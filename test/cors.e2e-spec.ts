import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

const FRONT = 'https://front.stylenow.test';
const VITE = 'http://localhost:5173';
const AJENO = 'https://atacante.example';

async function abrir(
  entorno: Record<string, string | undefined>,
): Promise<INestApplication<App>> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useValue(new ConfigService({ ...process.env, ...entorno }))
    .compile();
  const app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  return app;
}

const cabecerasPreflight = (r: request.Response) => ({
  origen: r.headers['access-control-allow-origin'],
  credenciales: r.headers['access-control-allow-credentials'],
  metodos: String(r.headers['access-control-allow-methods'] ?? '').split(','),
  cabeceras: String(r.headers['access-control-allow-headers'] ?? '')
    .toLowerCase()
    .split(','),
  maxAge: r.headers['access-control-max-age'],
  vary: String(r.headers['vary'] ?? ''),
});

describe('P6-01 CORS para el frontend React (JWT Bearer, sin cookies)', () => {
  describe('con CORS_ORIGENES explicito', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      app = await abrir({
        CORS_ORIGENES: `${FRONT},${VITE}`,
        NODE_ENV: 'production',
      });
    });
    afterAll(async () => {
      await app.close();
    });

    it('preflight de una ruta protegida responde 204 sin pasar por el guard JWT', async () => {
      for (const origen of [FRONT, VITE]) {
        const r = await request(app.getHttpServer())
          .options('/usuarios/1/carrito/items')
          .set('Origin', origen)
          .set('Access-Control-Request-Method', 'POST')
          .set(
            'Access-Control-Request-Headers',
            'authorization,content-type,x-request-id,idempotency-key',
          )
          .expect(204);
        const c = cabecerasPreflight(r);
        expect(c.origen).toBe(origen);
        expect(c.credenciales).toBeUndefined();
        expect(c.metodos).toEqual(['GET', 'HEAD', 'POST', 'PATCH', 'DELETE']);
        expect(c.cabeceras).toEqual([
          'authorization',
          'content-type',
          'x-request-id',
          'idempotency-key',
        ]);
        expect(c.maxAge).toBe('600');
        expect(c.vary).toMatch(/Origin/i);
        expect(r.headers['x-request-id']).toBeDefined();
      }
    });

    it('preflight de PATCH y DELETE tambien queda permitido', async () => {
      for (const metodo of ['PATCH', 'DELETE']) {
        const r = await request(app.getHttpServer())
          .options('/usuarios/1/direcciones/1')
          .set('Origin', FRONT)
          .set('Access-Control-Request-Method', metodo)
          .set('Access-Control-Request-Headers', 'authorization')
          .expect(204);
        expect(r.headers['access-control-allow-origin']).toBe(FRONT);
      }
    });

    it('un origen no listado no recibe Access-Control-Allow-Origin', async () => {
      const pre = await request(app.getHttpServer())
        .options('/usuarios/1')
        .set('Origin', AJENO)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization');
      expect(pre.headers['access-control-allow-origin']).toBeUndefined();
      const get = await request(app.getHttpServer())
        .get('/productos')
        .set('Origin', AJENO)
        .expect(200);
      expect(get.headers['access-control-allow-origin']).toBeUndefined();
      expect(get.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('la respuesta real expone X-Request-Id al origen permitido', async () => {
      const r = await request(app.getHttpServer())
        .get('/productos/1')
        .set('Origin', FRONT)
        .set('X-Request-Id', 'react-p6-001')
        .expect(200);
      expect(r.headers['access-control-allow-origin']).toBe(FRONT);
      expect(r.headers['access-control-expose-headers']).toBe('X-Request-Id');
      expect(r.headers['x-request-id']).toBe('react-p6-001');
      expect(r.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('sin token la ruta protegida responde 401 con CORS, para que React lea el error', async () => {
      const r = await request(app.getHttpServer())
        .get('/usuarios/1')
        .set('Origin', FRONT)
        .expect(401);
      expect(r.headers['access-control-allow-origin']).toBe(FRONT);
      expect(r.body).toMatchObject({ statusCode: 401, path: '/usuarios/1' });
    });

    it('peticiones sin Origin (curl, Swagger del mismo origen) siguen funcionando', async () => {
      const r = await request(app.getHttpServer())
        .get('/categorias')
        .expect(200);
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  it('sin CORS_ORIGENES fuera de produccion admite Vite local y nada mas', async () => {
    const app = await abrir({ CORS_ORIGENES: undefined, NODE_ENV: 'test' });
    try {
      const local = await request(app.getHttpServer())
        .get('/productos')
        .set('Origin', VITE)
        .expect(200);
      expect(local.headers['access-control-allow-origin']).toBe(VITE);
      const ajeno = await request(app.getHttpServer())
        .get('/productos')
        .set('Origin', AJENO)
        .expect(200);
      expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('sin CORS_ORIGENES en produccion no admite origenes cruzados', async () => {
    const app = await abrir({
      CORS_ORIGENES: undefined,
      NODE_ENV: 'production',
    });
    try {
      const r = await request(app.getHttpServer())
        .get('/productos')
        .set('Origin', VITE)
        .expect(200);
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('un CORS_ORIGENES invalido impide configurar la app (no arranca abierta)', async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ ...process.env, CORS_ORIGENES: '*' }))
      .compile();
    const app = modulo.createNestApplication();
    try {
      expect(() => configurarApp(app)).toThrow(
        'CORS_ORIGENES contiene un origen invalido',
      );
    } finally {
      await app.close();
    }
  });
});
