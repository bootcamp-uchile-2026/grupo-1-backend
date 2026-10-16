import { performance } from 'node:perf_hooks';
import { Logger, LoggerService } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { obtenerRequestId } from './contexto-peticion';

/** Nombre estable del evento de acceso HTTP. */
export const EVENTO_HTTP = 'http_request' as const;

/** Contexto del Logger de Nest con que se emiten los registros HTTP. */
export const CONTEXTO_LOGGER_HTTP = 'HTTP';

/**
 * Registro de acceso de una peticion HTTP. Solo datos de la peticion y su
 * resultado: nunca body, query, cabeceras ni datos del usuario.
 */
export interface RegistroHttp {
  event: typeof EVENTO_HTTP;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  /** false si la conexion se cerro antes de terminar de enviar la respuesta. */
  completa: boolean;
}

/** Ruta sin query string: los parametros pueden traer datos sensibles. */
export function rutaSinQuery(url: string): string {
  const fin = url.indexOf('?');
  return fin === -1 ? url : url.slice(0, fin);
}

/** Milisegundos transcurridos, con tres decimales y nunca negativos. */
export function calcularDuracionMs(inicio: number, fin: number): number {
  return Math.max(0, Math.round((fin - inicio) * 1000) / 1000);
}

/** Dependencias del middleware; se pueden reemplazar en los tests. */
export interface OpcionesObservabilidadHttp {
  logger?: Pick<LoggerService, 'log'>;
  reloj?: () => number;
}

/**
 * Crea el middleware de Express que mide cada peticion y emite un unico
 * registro http_request cuando termina.
 *
 * - Debe ir despues de asignarRequestId: toma el request-id del contexto al
 *   entrar, sin volver a leer la cabecera.
 * - Debe ir antes de CORS y del body parser, para medir y registrar tambien
 *   las respuestas que ellos terminan (preflight, JSON malformado, 413).
 * - Usa un reloj monotonico (performance.now) y registra el statusCode que
 *   finalmente tiene la respuesta.
 *
 * Escucha 'finish' (respuesta enviada) y 'close' (conexion cerrada). En una
 * peticion normal ocurren ambos; una bandera garantiza un solo registro. Si
 * 'close' llega primero, la conexion se corto antes de enviar todo y el
 * registro sale con completa: false.
 */
export function crearObservabilidadHttp({
  logger = new Logger(CONTEXTO_LOGGER_HTTP),
  reloj = () => performance.now(),
}: OpcionesObservabilidadHttp = {}) {
  return function observarPeticionHttp(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const inicio = reloj();
    const requestId = obtenerRequestId() ?? '';
    const method = req.method;
    const path = rutaSinQuery(req.originalUrl ?? req.url);
    let registrado = false;

    const registrar = (completa: boolean) => {
      if (registrado) return;
      registrado = true;
      const registro: RegistroHttp = {
        event: EVENTO_HTTP,
        requestId,
        method,
        path,
        statusCode: res.statusCode,
        durationMs: calcularDuracionMs(inicio, reloj()),
        completa,
      };
      logger.log(registro);
    };

    res.once('finish', () => registrar(true));
    res.once('close', () => registrar(res.writableFinished));
    next();
  };
}

