import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

describe('Privacidad persistente: 28 marcadores sinteticos', () => {
  let app: INestApplication<App>;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configurarApp(app);
    await app.init();
  });
  afterAll(async () => app.close());
  afterEach(() => jest.restoreAllMocks());

  it('omite body, arrays, anidados, query, cookies y Authorization con correlacion concurrente', async () => {
    const logs: unknown[] = [];
    const capture = (value: unknown) => {
      logs.push(value);
    };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(capture);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(capture);
    const markers = Array.from(
      { length: 28 },
      (_, i) => `SYNTHETIC_PRIVATE_${i}_END`,
    );
    const responses = await Promise.all(
      markers.map((marker, i) => {
        const body =
          i === 0
            ? {
                nombre: marker,
                correoElectronico: 'privacy-cierre@example.invalid',
                contrasena: marker,
              }
            : i === 1
              ? [{ contacto: marker }]
              : {
                  nombre: marker,
                  contacto: { direccion: marker },
                  desconocido: [{ token: marker }],
                };
        return request(app.getHttpServer())
          .post(`/auth/registro?oculto=${marker}`)
          .set('X-Request-Id', `privacy-cierre-${i}`)
          .set('Authorization', `Bearer ${marker}`)
          .set('Cookie', `synthetic=${marker}`)
          .send(body)
          .expect(i === 0 ? 201 : 400);
      }),
    );
    const serialized = JSON.stringify(logs);
    for (const marker of markers) expect(serialized).not.toContain(marker);
    for (const [i, response] of responses.entries()) {
      const records = logs.filter(
        (value): value is Record<string, unknown> =>
          typeof value === 'object' &&
          value !== null &&
          'requestId' in value &&
          value.requestId === `privacy-cierre-${i}`,
      );
      expect(response.headers['x-request-id']).toBe(`privacy-cierre-${i}`);
      expect(records.map((r) => r.event)).toEqual([
        'http_request_start',
        'http_request',
      ]);
      expect(records[0].path).toBe('/auth/registro');
      expect(records[1]).toMatchObject({
        path: '/auth/registro',
        statusCode: i === 0 ? 201 : 400,
        durationMs: expect.any(Number) as unknown,
      });
      for (const record of records) {
        expect(record).not.toHaveProperty('body');
        expect(record).not.toHaveProperty('headers');
      }
    }
  });
});
