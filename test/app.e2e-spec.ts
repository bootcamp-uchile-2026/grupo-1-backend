import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configurarApp } from '../src/configurar-app';
import { AppModule } from './../src/app.module';

describe('StyleNow API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
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

  it('rechaza parametros desconocidos con el contrato HTTP real', async () => {
    const response = await request(app.getHttpServer())
      .get('/productos?desconocido=1')
      .expect(400);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toMatchObject({ statusCode: 400 });
  });

  afterEach(async () => {
    await app.close();
  });
});
