import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import { solicitudAutenticada } from './utilidades/autenticacion';
describe('IDs positivos documentados', () => {
  it('publica limites y rechaza IDs invalidos', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = module.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
    try {
      const doc = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      for (const item of Object.values(doc.paths))
        for (const op of [item.get, item.post, item.patch, item.delete]) {
          for (const param of op?.parameters ?? [])
            if (
              'in' in param &&
              param.in === 'path' &&
              param.name !== 'archivo'
            )
              expect(param).toMatchObject({
                schema: {
                  type: 'integer',
                  minimum: 1,
                  maximum: Number.MAX_SAFE_INTEGER,
                },
              });
        }
      for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992'])
        await solicitudAutenticada(app)
          .get('/productos/' + id)
          .expect(400);
      // Formas no canonicas: Number() las convertiria en 1 o 1000.
      for (const ruta of ['/productos/', '/usuarios/'])
        for (const id of ['0x1', '1e3', '3e0', '+1', '01', ' 1', '1 '])
          await solicitudAutenticada(app)
            .get(ruta + encodeURIComponent(id))
            .expect(400);
      await solicitudAutenticada(app).get('/usuarios/1').expect(200);
      await solicitudAutenticada(app).get('/productos/999999').expect(404);
      await solicitudAutenticada(app).get('/productos/1').expect(200);
    } finally {
      await app.close();
    }
  });
});
