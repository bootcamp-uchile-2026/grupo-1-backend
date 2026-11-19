import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Parametros de scrypt (KDF de memoria dura). OWASP Password Storage Cheat
 * Sheet los acepta como equivalentes a N=2^17,r=8,p=1 con menos memoria por
 * peticion: N=2^15, r=8, p=3 usa ~32 MiB por hash.
 */
export interface ParametrosScrypt {
  N: number;
  r: number;
  p: number;
}

export const PARAMETROS_SCRYPT: ParametrosScrypt = { N: 2 ** 15, r: 8, p: 3 };

const LARGO_SAL = 16;
const LARGO_CLAVE = 32;
/** Formato almacenado: scrypt$N=<n>,r=<r>,p=<p>$<sal base64url>$<clave base64url>. */
const FORMATO =
  /^scrypt\$N=(\d{1,7}),r=(\d{1,2}),p=(\d{1,2})\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/;

function derivar(
  contrasena: string,
  sal: Buffer,
  parametros: ParametrosScrypt,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      contrasena.normalize('NFC'),
      sal,
      LARGO_CLAVE,
      {
        N: parametros.N,
        r: parametros.r,
        p: parametros.p,
        maxmem: 256 * parametros.N * parametros.r,
      },
      (error, clave) => (error ? reject(error) : resolve(clave)),
    );
  });
}

/** Parametros aceptables al leer un hash: evita costos arbitrarios. */
function parametrosLegibles(p: ParametrosScrypt): boolean {
  const potencia = Number.isInteger(Math.log2(p.N));
  return (
    potencia &&
    p.N >= 2 ** 10 &&
    p.N <= 2 ** 17 &&
    p.r >= 1 &&
    p.r <= 16 &&
    p.p >= 1 &&
    p.p <= 8
  );
}

/**
 * Hash y verificacion de contrasenas. Nunca devuelve ni registra la
 * contrasena; la comparacion es de tiempo constante.
 *
 * Se usa scrypt de node:crypto en lugar de Argon2id para no agregar una
 * dependencia nativa mientras la politica npm sigue pendiente de Fran.
 */
export class ServicioContrasenas {
  private hashSinCuenta?: Promise<string>;

  constructor(
    private readonly parametros: ParametrosScrypt = PARAMETROS_SCRYPT,
  ) {
    if (!parametrosLegibles(parametros)) {
      throw new Error('Parametros scrypt fuera del rango admitido.');
    }
  }

  async hash(contrasena: string): Promise<string> {
    const sal = randomBytes(LARGO_SAL);
    const clave = await derivar(contrasena, sal, this.parametros);
    const { N, r, p } = this.parametros;
    return `scrypt$N=${N},r=${r},p=${p}$${sal.toString('base64url')}$${clave.toString('base64url')}`;
  }

  /** Devuelve false ante un hash corrupto o ajeno al formato, sin lanzar. */
  async verificar(contrasena: string, almacenado: string): Promise<boolean> {
    const partes = FORMATO.exec(almacenado);
    if (!partes) return false;
    const parametros = {
      N: Number(partes[1]),
      r: Number(partes[2]),
      p: Number(partes[3]),
    };
    if (!parametrosLegibles(parametros)) return false;
    const esperada = Buffer.from(partes[5], 'base64url');
    const calculada = await derivar(
      contrasena,
      Buffer.from(partes[4], 'base64url'),
      parametros,
    );
    return (
      esperada.length === calculada.length &&
      timingSafeEqual(esperada, calculada)
    );
  }

  /**
   * Gasta el mismo trabajo que una verificacion real cuando el correo no
   * existe, para no revelar cuentas por tiempo de respuesta.
   */
  async verificarSinCuenta(contrasena: string): Promise<false> {
    this.hashSinCuenta ??= this.hash(randomBytes(24).toString('base64url'));
    await this.verificar(contrasena, await this.hashSinCuenta);
    return false;
  }
}
