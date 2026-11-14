import type { App } from 'supertest/types';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
describe('Privacidad HTTP', () => {
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
  it.each([
    [
      {
        nombre: 'private-name',
        correoElectronico: 'private@example.test',
        contrasena: 'private-password',
      },
      201,
    ],
    [
      {
        contacto: {
          nombre: 'private-name',
          apellido: 'private-surname',
          direccion: 'private-address',
        },
        extra: [{ token: 'private-token' }],
        desconocido: 'private-unknown',
      },
      400,
    ],
    [[{ nombre: 'private-array' }], 400],
  ])('excluye cuerpos y cabeceras: %j', async (body, status) => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    await request(app.getHttpServer())
      .post('/auth/registro')
      .set('X-Request-Id', 'privacy-case')
      .set('Authorization', 'private-auth')
      .set('Cookie', 'session=private-cookie')
      .send(body)
      .expect(status);
    const records = log.mock.calls.map(
      ([value]) => value as Record<string, unknown>,
    );
    const events = records.filter((r) => r.requestId === 'privacy-case');
    expect(events.map((r) => r.event)).toEqual([
      'http_request_start',
      'http_request',
    ]);
    expect(Object.keys(events[0]).sort()).toEqual(
      ['event', 'timestamp', 'requestId', 'method', 'path'].sort(),
    );
    expect(Object.keys(events[1]).sort()).toEqual(
      [
        'event',
        'requestId',
        'method',
        'path',
        'statusCode',
        'durationMs',
        'completa',
      ].sort(),
    );
    expect(events[1]).toMatchObject({
      statusCode: status,
      durationMs: expect.any(Number) as unknown,
    });
    expect(JSON.stringify(records)).not.toContain('private-');
  });
  it('correlaciona solicitudes simultaneas y omite query', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    await Promise.all(
      ['parallel-a', 'parallel-b'].map((id) =>
        request(app.getHttpServer())
          .get('/productos?search=private-query')
          .set('X-Request-Id', id)
          .expect(200),
      ),
    );
    for (const id of ['parallel-a', 'parallel-b']) {
      const records = log.mock.calls
        .map(([value]) => value as Record<string, unknown>)
        .filter((r) => r.requestId === id);
      expect(records.map((r) => r.event)).toEqual([
        'http_request_start',
        'http_request',
      ]);
      expect(records.every((r) => r.path === '/productos')).toBe(true);
    }
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-query');
  });
});
