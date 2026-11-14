import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configurarApp } from '../src/configurar-app';
import { AppModule } from './../src/app.module';

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
    return request(app.getHttpServer())
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
    await request(app.getHttpServer())
      .post('/usuarios/1/pedidos/1001/cambios-devoluciones')
      .send({ ...solicitud, ...datos })
      .expect(estado);
  });

  it('informa simultaneamente motivo vacio y variante ausente', async () => {
    const response = await request(app.getHttpServer())
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

  afterEach(async () => {
    await app.close();
  });
});
