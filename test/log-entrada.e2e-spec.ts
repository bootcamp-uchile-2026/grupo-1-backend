import type { App } from 'supertest/types';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

describe('Registro de entrada HTTP', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('correlaciona entrada y salida, oculta datos anidados aun en un error', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Request-Id', 'regression-log')
      .send({
        contrasena: 'private-value',
        extra: [{ token: 'nested-private' }],
      })
      .expect(400);
    const registros = log.mock.calls.map(
      ([value]) => value as Record<string, unknown>,
    );
    expect(registros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'http_request_start',
          requestId: 'regression-log',
          body: { contrasena: '[OCULTO]', extra: [{ token: '[OCULTO]' }] },
        }),
        expect.objectContaining({
          event: 'http_request',
          requestId: 'regression-log',
          statusCode: 400,
        }),
      ]),
    );
    expect(JSON.stringify(registros)).not.toContain('private-value');
    expect(JSON.stringify(registros)).not.toContain('nested-private');
  });
});
