import { LogEntradaInterceptor } from './common/log-entrada.interceptor';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { leerOrigenesCors, opcionesCors } from './common/cors';
import { FiltroExcepcionesGlobal } from './common/filtro-excepciones.filter';
import { crearObservabilidadHttp } from './common/observabilidad-http.middleware';
import { asignarRequestId } from './common/request-id.middleware';
import { ValidacionGlobalPipe } from './common/validacion-global.pipe';

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
 * CORS: solo los origenes de CORS_ORIGENES (o los de desarrollo local de
 * Vite si no se define y NODE_ENV no es production). Permite Authorization,
 * Content-Type, X-Request-Id e Idempotency-Key; expone X-Request-Id para que
 * el frontend pueda citarlo al reportar un error. Sin credenciales: la API
 * autentica con JWT Bearer y no usa cookies. Un origen invalido detiene el
 * arranque. El preflight OPTIONS lo responde CORS antes de los guards.
 *
 * Filtro global de excepciones: da el mismo formato a todo error que llega a
 * Nest (dominio, HttpException, ValidationPipe, errores no controlados) y
 * agrega requestId, timestamp y path. Los errores del body parser (JSON
 * malformado, 413) llegan al filtro mediante el manejador de errores de Nest.
 *
 * ValidationPipe:
 * - whitelist + forbidNonWhitelisted: un campo que el DTO no declara
 *   responde 400 en vez de llegar al Service.
 * - transform: el body y la query llegan como instancias tipadas del DTO.
 *   Los parametros de ruta llegan como texto a su pipe (IdPositivoPipe),
 *   que exige la forma canonica del identificador (ValidacionGlobalPipe).
 */
export function configurarApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const origenes = leerOrigenesCors(
    config.get<string>('CORS_ORIGENES'),
    config.get<string>('NODE_ENV'),
  );
  if (origenes.length === 0) {
    new Logger('Cors').warn(
      'CORS_ORIGENES no esta definido en produccion: no se admiten origenes cruzados.',
    );
  }
  app.use(asignarRequestId);
  app.use(crearObservabilidadHttp());
  app.enableCors(opcionesCors(origenes));
  app.useGlobalInterceptors(new LogEntradaInterceptor());
  app.useGlobalFilters(new FiltroExcepcionesGlobal());
  app.useGlobalPipes(
    new ValidacionGlobalPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
