import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API StyleNow')
    .setDescription('E-commerce StyleNow - Hito 1')
    .setVersion('1.0')
    .addTag('categorias')
    .addTag('colecciones')
    .addTag('productos')
    .addTag('auth')
    .addTag('carrito')
    .addTag('comunidad')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
