import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Punto de entrada de StyleNow.
 * Levanta la aplicacion y publica la documentacion Swagger en /api.
 * No se configura BearerAuth porque JWT esta fuera del alcance de Hito 1.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('StyleNow API')
    .setDescription('API REST del ecommerce StyleNow - Hito 1')
    .setVersion('1.0')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
