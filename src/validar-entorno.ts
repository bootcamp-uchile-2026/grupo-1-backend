import { isIP } from 'node:net';
import { configuracionTokensDesdeEntorno } from './seguridad/tokens';

export interface ConexionMysqlValidada {
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
}

/** Se tolera mysql como marca antigua, nunca como selector entre adaptadores. */
function rechazarPersistenciaObsoleta(config: Record<string, unknown>): void {
  if (config.PERSISTENCIA !== undefined && config.PERSISTENCIA !== 'mysql') {
    throw new Error(
      'PERSISTENCIA obsoleta: solo se admite MySQL; elimine el selector.',
    );
  }
}

/** Configuracion SQL sin defaults de conexion ni requisitos JWT para el CLI. */
export function validarConexionMysql(
  config: Record<string, unknown>,
): ConexionMysqlValidada {
  rechazarPersistenciaObsoleta(config);
  const required = (key: string): string => {
    const value = config[key];
    if (typeof value !== 'string' || !value.trim())
      throw new Error(key + ' es obligatorio para conectar MySQL.');
    return value;
  };
  const host = required('DB_HOST').trim();
  const name = host.endsWith('.') ? host.slice(0, -1) : host;
  const dns =
    name.length <= 253 &&
    name
      .split('.')
      .every((label) =>
        /^[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?$/.test(label),
      );
  if (!isIP(host) && (!dns || /^[0-9.]+$/.test(host)))
    throw new Error(
      'DB_HOST debe ser un host o una IP valida, sin URL, puerto ni credenciales.',
    );
  const port = required('DB_PORT').trim();
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error('DB_PORT debe ser un entero entre 1 y 65535.');
  const username = required('DB_USERNAME');
  if (
    Array.from(username).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  )
    throw new Error('DB_USERNAME contiene caracteres de control.');
  const password = required('DB_PASSWORD');
  const database = required('DB_DATABASE');
  if (!/^[A-Za-z0-9_$-]{1,64}$/.test(database))
    throw new Error(
      'DB_DATABASE debe ser un identificador de 1 a 64 caracteres ASCII alfanumericos, _, $ o -.',
    );
  return {
    DB_HOST: host,
    DB_PORT: port,
    DB_USERNAME: username,
    DB_PASSWORD: password,
    DB_DATABASE: database,
  };
}

/** Valida antes de crear Nest: HTTP, MySQL obligatorio y JWT seguro. */
export function validarEntorno(
  configuracion: Record<string, unknown>,
): Record<string, unknown> {
  const resultado = { ...configuracion };
  const valor = configuracion.PORT;
  if (valor !== undefined && !(typeof valor === 'string' && !valor.trim())) {
    const puerto = typeof valor === 'string' ? valor.trim() : '';
    if (!/^\d+$/.test(puerto) || Number(puerto) < 1 || Number(puerto) > 65535)
      throw new Error('PORT debe ser un entero entre 1 y 65535.');
    resultado.PORT = puerto;
  }
  Object.assign(resultado, validarConexionMysql(configuracion));
  const expiracion = configuracion.JWT_EXPIRACION_SEGUNDOS;
  if (expiracion !== undefined && typeof expiracion !== 'string')
    throw new Error(
      'JWT_EXPIRACION_SEGUNDOS debe ser texto numerico entre 60 y 86400.',
    );
  configuracionTokensDesdeEntorno({
    JWT_SECRET:
      typeof configuracion.JWT_SECRET === 'string'
        ? configuracion.JWT_SECRET
        : undefined,
    JWT_EXPIRACION_SEGUNDOS: expiracion,
  });
  return resultado;
}
