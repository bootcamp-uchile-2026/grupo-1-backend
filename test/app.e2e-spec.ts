import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { App } from 'supertest/types';
import { configurarApp } from '../src/configurar-app';
import { AppModule } from './../src/app.module';
import { solicitudAutenticada } from './utilidades/autenticacion';

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
    return solicitudAutenticada(app)
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

  it('consulta el carrito del usuario mediante el repositorio registrado', () => {
    return solicitudAutenticada(app)
      .get('/usuarios/1/carrito')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ usuarioId: 1, items: [] });
      });
  });

  it('publica las fechas de pedido y solicitud como date-time', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schemas = document.components?.schemas;
    const fecha = { type: 'string', format: 'date-time' };
    expect(schemas?.PedidoResponseDto).toMatchObject({
      properties: { fecha },
    });
    expect(schemas?.CambioDevolucionResponseDto).toMatchObject({
      properties: { fechaSolicitud: fecha },
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
    await solicitudAutenticada(app).get(ruta).expect(estado);
  });

  const solicitud = {
    pedidoItemId: 5001,
    motivo: 'Talla incorrecta',
    metodoEntrega: 'retiro_domicilio',
  };

  it.each([
    [{ tipo: 'cambio', nuevaVarianteId: 101 }, 201],
    [{ tipo: 'devolucion' }, 201],
    [{ tipo: 'cambio' }, 400],
    [{ tipo: 'cambio', nuevaVarianteId: null }, 400],
    [{ tipo: 'cambio', nuevaVarianteId: 0 }, 400],
    [{ tipo: 'devolucion', nuevaVarianteId: 101 }, 400],
    [{ tipo: 'devolucion', nuevaVarianteId: null }, 400],
    [{ tipo: 'cambio', nuevaVarianteId: 102 }, 400],
    [{ tipo: 'cambio', nuevaVarianteId: 201 }, 404],
  ])('valida la solicitud %j con HTTP %i', async (datos, estado) => {
    await solicitudAutenticada(app)
      .post('/usuarios/1/pedidos/1001/cambios-devoluciones')
      .send({ ...solicitud, ...datos })
      .expect(estado);
  });

  it('informa simultaneamente motivo vacio y variante ausente', async () => {
    const response = await solicitudAutenticada(app)
      .post('/usuarios/1/pedidos/1001/cambios-devoluciones')
      .send({ ...solicitud, tipo: 'cambio', motivo: '' })
      .expect(400);
    const body = response.body as { message: string[] };
    expect(body.message.some((mensaje) => mensaje.includes('motivo'))).toBe(
      true,
    );
    expect(
      body.message.some((mensaje) => mensaje.includes('nuevaVarianteId')),
    ).toBe(true);
  });

  it('rechaza parametros desconocidos con el contrato HTTP real', async () => {
    const response = await solicitudAutenticada(app)
      .get('/productos?desconocido=1')
      .expect(400);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toMatchObject({ statusCode: 400 });
  });

  afterEach(async () => {
    await app.close();
  });
});
