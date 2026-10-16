import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ejecutarEnContexto } from './contexto-peticion';

/** Cabecera con que viaja el identificador de la peticion. */
export const CABECERA_REQUEST_ID = 'X-Request-Id';

/** Largo maximo que se acepta de un request-id enviado por el cliente. */
export const LARGO_MAXIMO_REQUEST_ID = 64;

/**
 * Un id recibido solo se reutiliza si es corto y de caracteres seguros.
 * Asi una cabecera manipulada no puede inyectar saltos de linea ni texto
 * arbitrario en los logs ni en la respuesta.
 */
const FORMATO_REQUEST_ID = new RegExp(
  `^[A-Za-z0-9._-]{1,${LARGO_MAXIMO_REQUEST_ID}}$`,
);

/** Devuelve el id recibido si es valido; si no, genera un UUID v4. */
export function resolverRequestId(recibido: unknown): string {
  return typeof recibido === 'string' && FORMATO_REQUEST_ID.test(recibido)
    ? recibido
    : randomUUID();
}

/**
 * Middleware de Express que asigna un request-id a cada peticion.
 * - Reutiliza el X-Request-Id del cliente o del proxy si es valido, para
 *   poder seguir una misma peticion entre sistemas; si no, genera uno.
 * - Lo devuelve en la cabecera X-Request-Id de toda respuesta.
 * - Ejecuta el resto de la cadena dentro del contexto de la peticion, de modo
 *   que obtenerRequestId() lo devuelve hasta que termina, tambien despues de
 *   leer el body y de cualquier await.
 *
 * Se instala una sola vez, en configurarApp(), antes de CORS y del body
 * parser: asi tambien llevan el id las respuestas que esos middlewares
 * terminan sin llegar a Nest (preflight, JSON malformado, 413).
 */
export function asignarRequestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = resolverRequestId(req.headers['x-request-id']);
  res.setHeader(CABECERA_REQUEST_ID, requestId);
  ejecutarEnContexto({ requestId }, next);
}
