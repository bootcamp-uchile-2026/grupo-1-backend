import { INestApplication, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import {
  LogisticaService,
  ESTADOS_ENVIO,
} from '../src/services/logistica.service';
import { bearer } from './utilidades/autenticacion';

describe('Contratos OpenAPI de autenticacion y logistica', () => {
  let app: INestApplication<App>;
  let document: OpenAPIObject;
  const fecha = '2026-11-19T12:30:00.000Z';
  const envio = {
    id: 2,
    pedido_id: 1,
    estado: 'PENDING',
    despachado_en: null,
  };
  const seguimiento = {
    pedidoId: 1,
    estado: 'PENDING',
    despachadoEn: null,
    eventos: [{ anterior: null, nuevo: 'PENDING', fecha }],
  };
  const cancelacion = {
    pedidoId: 1,
    estado: 'cancelado',
    stockRestituido: true,
    fecha,
  };
  const service = {
    crearEnvio: jest.fn(),
    transicionar: jest.fn(),
    seguimiento: jest.fn(),
    cancelar: jest.fn(),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LogisticaService)
      .useValue(service)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configurarApp(app);
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
  });
  beforeEach(() => {
    jest.resetAllMocks();
    service.crearEnvio.mockResolvedValue(envio);
    service.transicionar.mockResolvedValue({ ...envio, estado: 'PREPARING' });
    service.seguimiento.mockResolvedValue(seguimiento);
    service.cancelar.mockResolvedValue(cancelacion);
  });
  afterAll(async () => {
    await app.close();
  });

  it('publica Bearer y error 401 en cada operacion privada, sin exigirlo en las publicas', () => {
    let privadas = 0;
    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of ['get', 'post', 'patch', 'delete'] as const) {
        const operation = item[method];
        if (!operation) continue;
        const privada =
          path.startsWith('/usuarios/') ||
          path.startsWith('/operaciones/') ||
          path.startsWith('/administracion/') ||
          (method === 'post' && ['/pedidos', '/looks'].includes(path));
        if (privada) {
          privadas++;
          expect(operation.security).toEqual([{ bearer: [] }]);
          expect(operation.responses['401']).toMatchObject({
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponseDto' },
              },
            },
          });
        } else {
          expect(operation.security ?? []).toEqual([]);
        }
      }
    }
    expect(privadas).toBeGreaterThan(20);
  });

  it('describe errores y respuestas logisticas existentes con fechas ISO y estados cerrados', () => {
    const route =
      document.paths['/usuarios/{usuarioId}/pedidos/{pedidoId}/seguimiento']
        .get!;
    for (const status of ['400', '401', '404', '409', '500', '503']) {
      expect(route.responses[status]).toMatchObject({
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponseDto' },
          },
        },
      });
    }
    expect(route.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            properties: {
              estado: { enum: [...ESTADOS_ENVIO] },
              despachadoEn: { format: 'date-time', nullable: true },
              eventos: {
                items: { properties: { fecha: { format: 'date-time' } } },
              },
            },
          },
        },
      },
    });
    expect(
      document.paths['/usuarios/{usuarioId}/pedidos/{pedidoId}/cancelacion']
        .post!.responses['201'],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: { properties: { fecha: { format: 'date-time' } } },
        },
      },
    });
  });

  it('conserva los nombres y estados HTTP del transporte sin conectar MySQL', async () => {
    const auth = bearer(app, 1);
    await request(app.getHttpServer())
      .post('/operaciones/pedidos/1/envio')
      .set('Authorization', auth)
      .expect(201)
      .expect(envio);
    await request(app.getHttpServer())
      .patch('/operaciones/pedidos/1/envio')
      .set('Authorization', auth)
      .send({ estado: 'PREPARING' })
      .expect(200)
      .expect({ ...envio, estado: 'PREPARING' });
    await request(app.getHttpServer())
      .get('/usuarios/1/pedidos/1/seguimiento')
      .set('Authorization', auth)
      .expect(200)
      .expect(seguimiento);
    await request(app.getHttpServer())
      .post('/usuarios/1/pedidos/1/cancelacion')
      .set('Authorization', auth)
      .send({ motivo: 'Prueba sintetica' })
      .expect(201)
      .expect(cancelacion);
  });

  it('mantiene 401 sin token y 404 de acceso cruzado antes de llamar al servicio', async () => {
    await request(app.getHttpServer())
      .get('/usuarios/1/pedidos/1/seguimiento')
      .expect(401);
    await request(app.getHttpServer())
      .get('/usuarios/2/pedidos/1/seguimiento')
      .set('Authorization', bearer(app, 1))
      .expect(404);
    expect(service.seguimiento).not.toHaveBeenCalled();
  });

  it('conserva el error 403 y la validacion del estado, sin aceptar nuevos valores', async () => {
    service.crearEnvio.mockRejectedValue(
      new ForbiddenException('Sin permiso operativo'),
    );
    const denied = await request(app.getHttpServer())
      .post('/operaciones/pedidos/1/envio')
      .set('Authorization', bearer(app, 1))
      .expect(403);
    expect(denied.body).toMatchObject({
      statusCode: 403,
      message: 'Sin permiso operativo',
    });
    await request(app.getHttpServer())
      .patch('/operaciones/pedidos/1/envio')
      .set('Authorization', bearer(app, 1))
      .send({ estado: 'NO_EXISTE' })
      .expect(400);
    expect(service.transicionar).not.toHaveBeenCalled();
  });

  it('documenta hashing sin endurecer la politica publica de la contrasena', () => {
    const schema = document.components?.schemas?.RegistrarUsuarioDto;
    if (!schema || '$ref' in schema)
      throw new Error('Falta RegistrarUsuarioDto');
    const password = schema.properties?.contrasena;
    if (!password || '$ref' in password) throw new Error('Falta contrasena');
    expect(password.minLength).toBe(1);
    expect(password.description).toContain('hash scrypt');
  });
});
