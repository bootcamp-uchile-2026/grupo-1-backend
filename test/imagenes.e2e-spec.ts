import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { bearer } from './utilidades/autenticacion';
describe('P5 frontera publica y autorizacion SQL', () => {
  it('catalogo publico; carga exige JWT y MySQL, sin heredar @Publico de productos', async () => {
    const m = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ ...process.env, PERSISTENCIA: 'mysql' }))
      .compile();
    const app = m.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
    try {
      const api = request(app.getHttpServer());
      await api.get('/productos/1').expect(200);
      await api.post('/administracion/productos/1/imagenes').expect(401);
      await api
        .post('/administracion/productos/1/imagenes')
        .set('Authorization', bearer(app, 1))
        .expect(403);
      await api.get('/imagenes/productos/archivo-no-seguro.jpg').expect(404);
    } finally {
      await app.close();
    }
  });
});
