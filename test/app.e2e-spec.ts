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

  it.each([
    ['/productos/0', 400],
    ['/productos/-1', 400],
    ['/productos/abc', 400],
    ['/usuarios/1/pedidos/-1', 400],
    ['/productos/999999', 404],
    ['/productos/1', 200],
  ] as const)('valida %s con HTTP %i', async (ruta, estado) => {
    await request(app.getHttpServer()).get(ruta).expect(estado);
  });

  afterEach(async () => {
    await app.close();
  });
});
