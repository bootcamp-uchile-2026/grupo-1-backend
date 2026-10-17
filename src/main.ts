import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  CABECERA_REQUEST_ID,
  LARGO_MAXIMO_REQUEST_ID,
} from './common/request-id.middleware';
import { configurarApp } from './configurar-app';

/**
 * Lee una variable de entorno de texto. Si no existe o viene vacia, usa el
 * valor por defecto, de modo que sin .env el comportamiento no cambia.
 */
function leerVariable(
  config: ConfigService,
  nombre: string,
  porDefecto: string,
): string {
  const valor = config.get<string>(nombre)?.trim();
  return valor ? valor : porDefecto;
}

/**
 * Normaliza SWAGGER_PATH a una ruta relativa sin slashes en los extremos.
 * Vacia o solo con slashes vuelve al valor por defecto.
 */
function normalizarRutaSwagger(valor: string): string {
  const ruta = valor.replace(/^\/+|\/+$/g, '');
  return ruta ? ruta : 'api';
}

/**
 * Impide que Swagger tape una ruta de negocio. SwaggerModule publica la UI
 * en /<ruta> (con sus recursos debajo de /<ruta>/), el JSON en /<ruta>-json
 * y el YAML en /<ruta>-yaml. Se compara contra las rutas del documento
 * OpenAPI, que son las de los controllers, asi que no hay lista manual que
 * mantener. Un parametro {x} de OpenAPI coincide con cualquier segmento.
 */
function validarRutaSwagger(ruta: string, rutasNegocio: string[]): void {
  const ui = `/${ruta}`;
  const publicadas = [ui, `${ui}-json`, `${ui}-yaml`];
  const colisiones = rutasNegocio.filter((rutaNegocio) => {
    const patron = new RegExp(
      '^' +
        rutaNegocio
          .split(/\{[^}]+\}/)
          .map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('[^/]+') +
        '$',
    );
    return (
      rutaNegocio.startsWith(`${ui}/`) ||
      publicadas.some((publicada) => patron.test(publicada))
    );
  });
  if (colisiones.length > 0) {
    throw new Error(
      `SWAGGER_PATH="${ruta}" colisiona con rutas de negocio de la API ` +
        `(${colisiones.join(', ')}). Usa otra ruta, por ejemplo "api".`,
    );
  }
}

/**
 * Punto de entrada de StyleNow.
 * Levanta la aplicacion y publica la documentacion Swagger. Puerto, nombre,
 * version y ruta de Swagger se leen del entorno (ver .env.example); sin
 * variables, la API escucha en el puerto 3000 y Swagger queda en /api.
 * Todavia no se configura BearerAuth: la autenticacion real llega en una fase posterior.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  const entorno = app.get(ConfigService);
  const puerto = leerVariable(entorno, 'PORT', '3000');
  const nombre = leerVariable(entorno, 'APP_NAME', 'StyleNow API');
  const version = leerVariable(entorno, 'APP_VERSION', '1.0');
  const rutaSwagger = normalizarRutaSwagger(
    leerVariable(entorno, 'SWAGGER_PATH', 'api'),
  );

  const config = new DocumentBuilder()
    .setTitle(nombre)
    .setDescription(
      'API REST del ecommerce StyleNow. Fase dummy de Hito 2: los datos viven en ' +
        'memoria mientras el servidor esta arriba; las escrituras se reflejan en las ' +
        'lecturas siguientes y se pierden al reiniciar. ' +
        'Toda respuesta incluye la cabecera X-Request-Id, que identifica la peticion.',
    )
    .setVersion(version)
    .addTag(
      'productos',
      'Catalogo, buscador, novedades, ofertas y ficha de producto',
    )
    .addTag('categorias', 'Menu principal y categorias populares de la home')
    .addTag('colecciones', 'Looks e inspiracion para ti')
    .addTag('auth', 'Registro, inicio de sesion y cierre de sesion del header')
    .addTag('carrito', 'Carrito de compras del usuario')
    .addTag('favoritos', 'Productos marcados como favoritos desde la ficha')
    .addTag('comunidad', 'Publicaciones de la seccion Comunidad')
    .addTag('pedidos', 'Creacion y consulta de pedidos')
    .addTag('usuarios', 'Perfil de Mi Cuenta y cambio de contrasena')
    .addTag('direcciones', 'Direcciones de despacho del usuario')
    .addTag('looks', 'Explorar, componer y guardar looks')
    .addTag('alertas', 'Alertas de precio y avisos de reposicion')
    .addTag(
      'cambios-devoluciones',
      'Solicitudes de cambio y devolucion de un pedido',
    )
    .addGlobalParameters({
      name: CABECERA_REQUEST_ID,
      in: 'header',
      required: false,
      description:
        'Identificador de la peticion. Si se omite o no es valido, el servidor ' +
        'genera uno. La respuesta siempre lo devuelve en esta misma cabecera.',
      schema: {
        type: 'string',
        maxLength: LARGO_MAXIMO_REQUEST_ID,
        pattern: '^[A-Za-z0-9._-]+$',
        example: 'web-7f3a9c',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  validarRutaSwagger(rutaSwagger, Object.keys(document.paths));
  SwaggerModule.setup(rutaSwagger, app, document);

  await app.listen(puerto);
 console.log(`🚀 Backend ejecutándose en puerto: ${puerto}`);

}
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  if (error instanceof Error) {
    logger.error(error.message, error.stack);
  } else {
    logger.error(String(error));
  }
  process.exit(1);
});
