import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
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
            if ('in' in param && param.in === 'path')
              expect(param).toMatchObject({
                schema: {
                  type: 'integer',
                  minimum: 1,
                  maximum: Number.MAX_SAFE_INTEGER,
                },
              });
        }
      for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992'])
        await request(app.getHttpServer())
          .get('/productos/' + id)
          .expect(400);
      await request(app.getHttpServer()).get('/productos/999999').expect(404);
      await request(app.getHttpServer()).get('/productos/1').expect(200);
    } finally {
      await app.close();
    }
  });
});
