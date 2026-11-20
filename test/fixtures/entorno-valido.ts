import { randomBytes } from 'node:crypto';
/** Solo validacion/metadatos: nunca abre una conexion. */
export const ENTORNO_VALIDO = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USERNAME: 'usuario_unitario',
  DB_PASSWORD: 'valor-sintetico-exclusivo-de-prueba',
  DB_DATABASE: 'stylenow_unitario',
  JWT_SECRET: randomBytes(32).toString('hex'),
};
