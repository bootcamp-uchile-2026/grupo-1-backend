import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { obtenerRequestId } from './contexto-peticion';
import { rutaSinQuery } from './observabilidad-http.middleware';

const CAMPOS_SENSIBLES =
  /contrasena|contraseña|password|secret|token|authorization|cookie|api.?key|correo|email|telefono|phone|direccion|address|rut|tarjeta|card|cvv/i;

/** Copia acotada para diagnostico, sin mutar el DTO que recibe el servicio. */
export function ocultarDatosSensibles(
  valor: unknown,
  profundidad = 0,
): unknown {
  if (profundidad >= 6) return '[TRUNCADO]';
  if (Array.isArray(valor)) {
    return valor
      .slice(0, 30)
      .map((item: unknown) => ocultarDatosSensibles(item, profundidad + 1));
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor)
        .slice(0, 30)
        .map(([clave, contenido]) => [
          clave,
          CAMPOS_SENSIBLES.test(clave)
            ? '[OCULTO]'
            : ocultarDatosSensibles(contenido, profundidad + 1),
        ]),
    );
  }
  return typeof valor === 'string' ? valor.slice(0, 256) : valor;
}

@Injectable()
export class LogEntradaInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const req = contexto.switchToHttp().getRequest<Request>();
    const body = ocultarDatosSensibles(req.body as unknown);
    const serializado = JSON.stringify(body);
    this.logger.log({
      event: 'http_request_start',
      timestamp: new Date().toISOString(),
      requestId: obtenerRequestId() ?? '',
      method: req.method,
      path: rutaSinQuery(req.originalUrl ?? req.url),
      body: serializado && serializado.length > 8192 ? '[TRUNCADO]' : body,
    });
    return siguiente.handle();
  }
}
