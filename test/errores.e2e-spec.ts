import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

describe('errores', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => app.close());
  it('documenta los errores con el esquema del filtro', () => {
    const spec = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schema = spec.components?.schemas?.ErrorResponseDto;
    expect(schema).toMatchObject({
      required: expect.arrayContaining([
        'statusCode',
        'message',
        'error',
        'requestId',
        'timestamp',
        'path',
      ]) as unknown,
      properties: {
        timestamp: { format: 'date-time' },
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      },
    });
    let count = 0;
    for (const path of Object.values(spec.paths)) {
      for (const op of [path.get, path.post, path.patch, path.delete]) {
        for (const [status, response] of Object.entries(op?.responses ?? {})) {
          if (Number(status) >= 400) {
            count++;
            expect(response).toMatchObject({
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponseDto' },
                },
              },
            });
          }
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(39);
  });
  it('entrega el contrato de error en validación, acceso, recurso y conflicto', async () => {
    const api = request(app.getHttpServer());
    const cuenta = {
      nombre: 'Prueba',
      correoElectronico: 'test@example.org',
      contrasena: 'sintetica-123',
    };
    await api.post('/auth/registro').send(cuenta).expect(201);
    const casos = [
      await api.post('/auth/login').send({}).expect(400),
      await api
        .post('/auth/login')
        .send({ correoElectronico: 'test@example.org', contrasena: 'otra' })
        .expect(401),
      await api.get('/productos/99999').expect(404),
      await api.post('/auth/registro').send(cuenta).expect(409),
    ];
    for (const res of casos) {
      expect(res.body).toMatchObject({
        statusCode: res.status,
        error: expect.any(String) as unknown,
        path: expect.any(String) as unknown,
        requestId: res.headers['x-request-id'],
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) as unknown,
      });
    }
    expect((casos[0].body as { message: unknown }).message).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect((casos[2].body as { message: unknown }).message).toEqual(
      expect.any(String),
    );
  });
});
