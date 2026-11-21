import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { CABECERA_REQUEST_ID } from './request-id.middleware';

/**
 * Origenes de desarrollo local del frontend React/Vite (`vite` y
 * `vite preview`). Solo se usan si CORS_ORIGENES no esta definido y la app
 * no corre con NODE_ENV=production.
 */
export const ORIGENES_DESARROLLO = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
] as const;

/** Cabeceras que el frontend puede enviar en peticiones cross-origin. */
export const CABECERAS_PERMITIDAS = [
  'Authorization',
  'Content-Type',
  CABECERA_REQUEST_ID,
  'Idempotency-Key',
] as const;

/** Metodos que usan los controllers de la API (HEAD lo agrega Express a GET). */
export const METODOS_PERMITIDOS = [
  'GET',
  'HEAD',
  'POST',
  'PATCH',
  'DELETE',
] as const;

/** Segundos que el navegador puede cachear una respuesta preflight. */
export const MAX_AGE_PREFLIGHT_SEGUNDOS = 600;

/** Un origen web exacto: esquema http(s), host y puerto opcional; sin ruta. */
function origenValido(valor: string): boolean {
  // WHATWG URL acepta '*' en el host: un comodin nunca es un origen exacto.
  if (valor.includes('*')) return false;
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.origin === valor &&
    !url.username &&
    !url.password
  );
}

/**
 * Interpreta CORS_ORIGENES: lista separada por comas de origenes exactos
 * (p. ej. `https://app.example.cl,http://localhost:5173`).
 * - No definido o vacio: origenes de desarrollo local, salvo en produccion,
 *   donde no se admite ningun origen cruzado hasta configurarlo.
 * - `*`, comodines, rutas o barras finales se rechazan: la app no arranca.
 */
export function leerOrigenesCors(
  valor: string | undefined,
  entornoNode: string | undefined,
): string[] {
  const texto = valor?.trim() ?? '';
  if (!texto) {
    return entornoNode === 'production' ? [] : [...ORIGENES_DESARROLLO];
  }
  const origenes = texto.split(',').map((origen) => origen.trim());
  for (const origen of origenes) {
    if (!origenValido(origen)) {
      throw new Error(
        'CORS_ORIGENES contiene un origen invalido. Usa origenes exactos ' +
          'separados por comas, como https://app.example.cl (sin *, ruta ni barra final).',
      );
    }
  }
  return [...new Set(origenes)];
}

/**
 * Politica CORS para un frontend que autentica con JWT Bearer. No se
 * habilitan credenciales: la API no usa cookies, y el navegador solo envia
 * el token cuando el codigo del origen permitido lo agrega en Authorization.
 */
export function opcionesCors(origenes: string[]): CorsOptions {
  return {
    origin: origenes,
    methods: [...METODOS_PERMITIDOS],
    allowedHeaders: [...CABECERAS_PERMITIDAS],
    exposedHeaders: [CABECERA_REQUEST_ID],
    credentials: false,
    maxAge: MAX_AGE_PREFLIGHT_SEGUNDOS,
    optionsSuccessStatus: 204,
  };
}
