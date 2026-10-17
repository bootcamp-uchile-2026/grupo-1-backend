import { AsyncLocalStorage } from 'node:async_hooks';

/** Datos que acompanan a una peticion HTTP durante todo su procesamiento. */
export interface ContextoPeticion {
  requestId: string;
}

const almacen = new AsyncLocalStorage<ContextoPeticion>();

/**
 * Ejecuta fn dentro del contexto de una peticion. Todo el codigo que se
 * encadene desde fn, sincrono o asincrono, ve ese mismo contexto.
 */
export function ejecutarEnContexto<T>(
  contexto: ContextoPeticion,
  fn: () => T,
): T {
  return almacen.run(contexto, fn);
}

/**
 * Devuelve el request-id de la peticion en curso, o undefined si el codigo
 * no se esta ejecutando dentro de una peticion (arranque, tests unitarios).
 * Es el punto de lectura para el logging y el filtro de errores.
 */
export function obtenerRequestId(): string | undefined {
  return almacen.getStore()?.requestId;
}