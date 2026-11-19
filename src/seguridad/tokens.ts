import { createHmac, timingSafeEqual } from 'node:crypto';

export const EMISOR_TOKEN = 'stylenow-api';
export const AUDIENCIA_TOKEN = 'stylenow-clientes';
const LARGO_MAXIMO_TOKEN = 2048;
const TOLERANCIA_RELOJ_SEGUNDOS = 60;
const CABECERA = { alg: 'HS256', typ: 'JWT' } as const;
const FORMA_JWT = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/;
const ENTERO_POSITIVO = /^[1-9]\d*$/;

export interface ConfiguracionTokens {
  /** Secreto HMAC de al menos 32 bytes. */
  secreto: string;
  /** Vigencia del token emitido. */
  expiracionSegundos: number;
  /** Reloj en segundos; inyectable para pruebas. */
  ahora?: () => number;
}

export interface TokenEmitido {
  token: string;
  expiraEnSegundos: number;
}

/** Token ausente, mal formado, manipulado, expirado o ajeno a StyleNow. */
export class TokenInvalidoError extends Error {}

const b64 = (valor: object): string =>
  Buffer.from(JSON.stringify(valor)).toString('base64url');

function leerJson(segmento: string): unknown {
  try {
    return JSON.parse(Buffer.from(segmento, 'base64url').toString('utf8'));
  } catch {
    throw new TokenInvalidoError();
  }
}

/** Valida la configuracion antes de aceptar peticiones (sin fallback). */
export function configuracionTokensDesdeEntorno(entorno: {
  JWT_SECRET?: string;
  JWT_EXPIRACION_SEGUNDOS?: string;
}): ConfiguracionTokens {
  const secreto = entorno.JWT_SECRET ?? '';
  if (Buffer.byteLength(secreto, 'utf8') < 32) {
    throw new Error(
      'JWT_SECRET es obligatorio y debe tener al menos 32 bytes.',
    );
  }
  const texto = entorno.JWT_EXPIRACION_SEGUNDOS?.trim() || '3600';
  const expiracionSegundos = Number(texto);
  if (
    !/^\d+$/.test(texto) ||
    expiracionSegundos < 60 ||
    expiracionSegundos > 86400
  ) {
    throw new Error(
      'JWT_EXPIRACION_SEGUNDOS debe ser un entero entre 60 y 86400.',
    );
  }
  return { secreto, expiracionSegundos };
}

/**
 * JWT HS256 compacto con algoritmo fijo. Rechaza cualquier otra cabecera
 * (incluido alg "none"), firmas que no coincidan, emisor o audiencia
 * ajenos, tokens expirados o emitidos en el futuro y sujetos no canonicos.
 */
export class ServicioTokens {
  private readonly clave: Buffer;
  private readonly ahora: () => number;

  constructor(private readonly configuracion: ConfiguracionTokens) {
    this.clave = Buffer.from(configuracion.secreto, 'utf8');
    if (this.clave.length < 32) {
      throw new Error('El secreto JWT debe tener al menos 32 bytes.');
    }
    this.ahora = configuracion.ahora ?? (() => Math.floor(Date.now() / 1000));
  }

  firmar(usuarioId: number): TokenEmitido {
    if (!Number.isSafeInteger(usuarioId) || usuarioId < 1) {
      throw new Error('Usuario invalido para emitir token.');
    }
    const iat = this.ahora();
    const contenido = {
      sub: String(usuarioId),
      iss: EMISOR_TOKEN,
      aud: AUDIENCIA_TOKEN,
      iat,
      exp: iat + this.configuracion.expiracionSegundos,
    };
    const base = `${b64(CABECERA)}.${b64(contenido)}`;
    return {
      token: `${base}.${this.firma(base).toString('base64url')}`,
      expiraEnSegundos: this.configuracion.expiracionSegundos,
    };
  }

  /** Devuelve el usuario del token o lanza TokenInvalidoError. */
  verificar(token: string): { usuarioId: number } {
    if (typeof token !== 'string' || token.length > LARGO_MAXIMO_TOKEN) {
      throw new TokenInvalidoError();
    }
    const partes = FORMA_JWT.exec(token);
    if (!partes) throw new TokenInvalidoError();
    const firmaRecibida = Buffer.from(partes[3], 'base64url');
    const firmaEsperada = this.firma(`${partes[1]}.${partes[2]}`);
    if (
      firmaRecibida.length !== firmaEsperada.length ||
      !timingSafeEqual(firmaRecibida, firmaEsperada)
    ) {
      throw new TokenInvalidoError();
    }
    const cabecera = leerJson(partes[1]) as Record<string, unknown>;
    if (
      typeof cabecera !== 'object' ||
      cabecera === null ||
      Object.keys(cabecera).length !== 2 ||
      cabecera.alg !== CABECERA.alg ||
      cabecera.typ !== CABECERA.typ
    ) {
      throw new TokenInvalidoError();
    }
    const c = leerJson(partes[2]) as Record<string, unknown>;
    const ahora = this.ahora();
    if (
      typeof c !== 'object' ||
      c === null ||
      c.iss !== EMISOR_TOKEN ||
      c.aud !== AUDIENCIA_TOKEN ||
      typeof c.sub !== 'string' ||
      !ENTERO_POSITIVO.test(c.sub) ||
      !Number.isSafeInteger(Number(c.sub)) ||
      typeof c.iat !== 'number' ||
      typeof c.exp !== 'number' ||
      !Number.isInteger(c.iat) ||
      !Number.isInteger(c.exp) ||
      c.iat > ahora + TOLERANCIA_RELOJ_SEGUNDOS ||
      c.exp <= ahora
    ) {
      throw new TokenInvalidoError();
    }
    return { usuarioId: Number(c.sub) };
  }

  private firma(base: string): Buffer {
    return createHmac('sha256', this.clave).update(base).digest();
  }
}
