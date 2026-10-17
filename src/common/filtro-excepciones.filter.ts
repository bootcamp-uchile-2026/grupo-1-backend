import { STATUS_CODES } from 'node:http';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  LoggerService,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ConflictoDominioError,
  CredencialesInvalidasError,
  DomainError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import { obtenerRequestId } from './contexto-peticion';
import {
  CONTEXTO_LOGGER_HTTP,
  rutaSinQuery,
} from './observabilidad-http.middleware';

/** Nombre estable del evento de diagnostico de un error no controlado. */
export const EVENTO_ERROR_HTTP = 'http_error' as const;

/** Mensaje publico de un error no controlado: nunca el detalle interno. */
export const MENSAJE_ERROR_INTERNO = 'Internal server error';

/**
 * Cuerpo de toda respuesta de error. Conserva los tres campos que ya
 * entregaba Nest (statusCode, message, error) y agrega la correlacion.
 * message puede ser una lista: asi lo entrega el ValidationPipe.
 */
export interface RespuestaError {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId: string;
  timestamp: string;
  path: string;
}

/**
 * Registro de diagnostico de un error no controlado (500).
 * Solo correlacion y clasificacion. No incluye message, stack ni cause: esos
 * textos los arma codigo propio o de terceros y pueden contener credenciales
 * (cadenas de conexion, tokens). Para investigar, el requestId lleva al
 * http_request de la misma peticion y errorName indica el tipo de error.
 */
export interface RegistroErrorHttp {
  event: typeof EVENTO_ERROR_HTTP;
  requestId: string;
  path: string;
  errorName: string;
}

/** Traduccion de cada error de dominio a un status HTTP. */
export function statusDeErrorDominio(error: DomainError): number {
  if (error instanceof RecursoNoEncontradoError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictoDominioError) return HttpStatus.CONFLICT;
  if (error instanceof ReglaNegocioError) return HttpStatus.BAD_REQUEST;
  if (error instanceof CredencialesInvalidasError) {
    return HttpStatus.UNAUTHORIZED;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

const textoDeStatus = (status: number) =>
  STATUS_CODES[status] ?? 'Internal Server Error';

type DescripcionExcepcion = Pick<
  RespuestaError,
  'statusCode' | 'message' | 'error'
> & { controlado: boolean };

const errorInterno = (): DescripcionExcepcion => ({
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: MENSAJE_ERROR_INTERNO,
  error: textoDeStatus(HttpStatus.INTERNAL_SERVER_ERROR),
  controlado: false,
});

const esStatusError = (valor: unknown): valor is number =>
  typeof valor === 'number' &&
  Number.isInteger(valor) &&
  valor >= 400 &&
  valor < 600;

function copiarMensaje(valor: unknown): string | string[] | undefined {
  if (typeof valor === 'string') return valor;
  if (!Array.isArray(valor)) return undefined;
  const copia: unknown[] = Array.from(valor);
  return copia.every((item): item is string => typeof item === 'string')
    ? copia
    : undefined;
}

/**
 * Errores con status propio que no son HttpException: los que crean los
 * middlewares de Express con la libreria http-errors, como el 413 del body
 * parser. Solo se respetan si el propio error declara su mensaje como
 * publico (expose); si no, se tratan como error no controlado.
 */
function describirErrorHttpPublico(
  exception: unknown,
): DescripcionExcepcion | undefined {
  if (!(exception instanceof Error)) return undefined;
  // Capturar una sola vez: un getter podria cambiar entre dos lecturas.
  const { statusCode, expose, message } = exception as {
    statusCode?: unknown;
    expose?: unknown;
    message?: unknown;
  };
  if (
    !esStatusError(statusCode) ||
    expose !== true ||
    typeof message !== 'string'
  )
    return undefined;
  return {
    statusCode,
    message,
    error: textoDeStatus(statusCode),
    controlado: true,
  };
}

/**
 * Parte de la respuesta que depende de la excepcion: statusCode, message y
 * error. Es publica: para errores no controlados no expone su detalle.
 */
export function describirExcepcion(exception: unknown): DescripcionExcepcion {
  try {
    return describirExcepcionLegible(exception);
  } catch {
    // Tambien se pueden lanzar objetos con getters o proxies que fallan.
    return errorInterno();
  }
}

function describirExcepcionLegible(exception: unknown): DescripcionExcepcion {
  if (exception instanceof DomainError) {
    const statusCode = statusDeErrorDominio(exception);
    if (statusCode === Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      return errorInterno();
    }
    const message: unknown = exception.message;
    if (typeof message !== 'string') return errorInterno();
    return {
      statusCode,
      message,
      error: textoDeStatus(statusCode),
      controlado: true,
    };
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    if (!esStatusError(statusCode)) return errorInterno();
    const respuesta = exception.getResponse();
    if (typeof respuesta === 'string') {
      return {
        statusCode,
        message: respuesta,
        error: textoDeStatus(statusCode),
        controlado: true,
      };
    }
    if (respuesta === null || typeof respuesta !== 'object')
      return errorInterno();
    const { message, error } = respuesta as Record<string, unknown>;
    const mensaje = copiarMensaje(
      message === undefined ? exception.message : message,
    );
    if (mensaje === undefined) return errorInterno();
    return {
      statusCode,
      message: mensaje,
      error: typeof error === 'string' ? error : textoDeStatus(statusCode),
      controlado: true,
    };
  }

  return describirErrorHttpPublico(exception) ?? errorInterno();
}

/** errorName solo se registra si tiene forma de nombre de clase. */
const FORMATO_NOMBRE_ERROR = /^[A-Za-z_$][A-Za-z0-9_$]{0,99}$/;

/**
 * Clasifica el error sin leer su message ni su stack. Nunca convierte
 * valores arbitrarios ni deja que un getter roto impida responder.
 */
function nombreDeErrorSeguro(exception: unknown): string {
  try {
    if (exception instanceof Error) {
      const { name } = exception;
      return typeof name === 'string' && FORMATO_NOMBRE_ERROR.test(name)
        ? name
        : 'Error';
    }
  } catch {
    // El diagnostico no debe impedir responder al error original.
  }
  return 'UnknownThrownValue';
}

/**
 * Filtro global: toda excepcion que llega a Nest termina aqui.
 * - DomainError: se traduce a su status (404, 409, 400).
 * - HttpException (Nest, ValidationPipe, codigo heredado): conserva status,
 *   message y error.
 * - Error de Express con status publico (413 del body parser): conserva su
 *   status y mensaje.
 * - Cualquier otro error: 500 con mensaje generico, y un registro
 *   http_error en el servidor que solo identifica la peticion y el tipo
 *   de error, sin su mensaje ni su stack.
 * No emite http_request: eso lo hace solo el middleware de observabilidad.
 */
@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
  constructor(
    private readonly logger: Pick<LoggerService, 'error'> = new Logger(
      CONTEXTO_LOGGER_HTTP,
    ),
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = obtenerRequestId() ?? '';
    const path = rutaSinQuery(req.originalUrl ?? req.url);
    const { controlado, ...descripcion } = describirExcepcion(exception);

    if (!controlado) {
      const registro: RegistroErrorHttp = {
        event: EVENTO_ERROR_HTTP,
        requestId,
        path,
        errorName: nombreDeErrorSeguro(exception),
      };
      this.logger.error(registro);
    }

    const cuerpo: RespuestaError = {
      ...descripcion,
      requestId,
      timestamp: new Date().toISOString(),
      path,
    };
    res.status(cuerpo.statusCode).json(cuerpo);
  }
}
