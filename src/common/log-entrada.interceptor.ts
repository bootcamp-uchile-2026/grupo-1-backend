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

/** Solo metadatos HTTP explicitamente permitidos; nunca body ni cabeceras. */
@Injectable()
export class LogEntradaInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const req = contexto.switchToHttp().getRequest<Request>();
    this.logger.log({
      event: 'http_request_start',
      timestamp: new Date().toISOString(),
      requestId: obtenerRequestId() ?? '',
      method: req.method,
      path: rutaSinQuery(req.originalUrl ?? req.url),
    });
    return siguiente.handle();
  }
}
