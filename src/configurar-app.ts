import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FiltroExcepcionesGlobal } from './common/filtro-excepciones.filter';
import { crearObservabilidadHttp } from './common/observabilidad-http.middleware';
import {
  asignarRequestId,
  CABECERA_REQUEST_ID,
} from './common/request-id.middleware';

/**
 * Configuracion global compartida por main.ts y por los tests e2e, para que
 * ambos levanten la aplicacion con el mismo comportamiento HTTP.
 *
 * Es la unica entrada soportada: una app creada sin configurarApp() no tiene
 * request-id, CORS ni validacion.
 *
 * Orden efectivo de una peticion:
 *   request-id -> logging/timing -> CORS -> body parser -> Nest
 * y, al terminar la respuesta, logging/timing emite un registro http_request.
 * app.use() y enableCors() se aplican en el momento de llamarlos; Nest
 * agrega el body parser despues, en app.init().
 *
 * Request-id: va primero para que toda respuesta lleve X-Request-Id, incluso
 * las que CORS o el body parser terminan antes de llegar a Nest.
 *
 * Logging/timing: va justo despues para que el request-id ya exista y para
 * medir y registrar tambien esas respuestas tempranas. Es un access log:
 * metodo, ruta, status y duracion. El detalle de errores no le corresponde.
 *
 * CORS: expone X-Request-Id para que el frontend, que corre en otro origen,
 * pueda leer la cabecera y citarla al reportar un error.
 *
 * Filtro global de excepciones: da el mismo formato a todo error que llega a
 * Nest (dominio, HttpException, ValidationPipe, errores no controlados) y
 * agrega requestId, timestamp y path. Los errores del body parser (JSON
 * malformado, 413) llegan al filtro mediante el manejador de errores de Nest.
 *
 * ValidationPipe:
 * - whitelist + forbidNonWhitelisted: un campo que el DTO no declara
 *   responde 400 en vez de llegar al Service.
 * - transform: el body, la query y los parametros llegan como instancias
 *   tipadas del DTO.
 */
export function configurarApp(app: INestApplication): void {
  app.use(asignarRequestId);
  app.use(crearObservabilidadHttp());
  app.enableCors({ exposedHeaders: [CABECERA_REQUEST_ID] });
  app.useGlobalFilters(new FiltroExcepcionesGlobal());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
