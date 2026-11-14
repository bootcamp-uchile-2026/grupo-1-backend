import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('StyleNow API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/productos (GET)', () => {
    return request(app.getHttpServer())
      .get('/productos')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as {
          productos: unknown[];
          pagina: number;
        };

        expect(responseBody.productos).toBeInstanceOf(Array);
        expect(responseBody.pagina).toBe(1);
      });
  });

  it('publica las fechas de pedido y solicitud como date-time', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schemas = document.components?.schemas;
    const fecha = { type: 'string', format: 'date-time' };
    expect(schemas?.PedidoResponseDto).toMatchObject({
      properties: { fecha },
    });
    expect(schemas?.CambioDevolucionResponseDto).toMatchObject({
      properties: { fechaSolicitud: fecha },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
