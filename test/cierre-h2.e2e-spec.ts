import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import type { CarritoResponseDto } from '../src/dto/carrito-response.dto';
import type { PedidoDetalleResponseDto } from '../src/dto/pedido-detalle-response.dto';
import type { ProductoDetalleResponseDto } from '../src/dto/producto-detalle-response.dto';
import type { UsuarioResponseDto } from '../src/dto/usuario-response.dto';
import { PedidosRepository } from '../src/repositorios/pedidos.repository';
import { CarritoService } from '../src/services/carrito.service';
import { solicitudAutenticada } from './utilidades/autenticacion';

describe('Aceptacion del cierre H2 sin cambios de contrato', () => {
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

  it('publica todos los enteros de entrada, limites y cardinalidad del look', () => {
    const spec = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schemas = spec.components?.schemas;
    const campos: Record<string, string[]> = {
      ActualizarCantidadDto: ['cantidad'],
      AgregarFavoritoDto: ['productoId'],
      AgregarItemCarritoDto: ['varianteId', 'cantidad'],
      CrearAlertaPrecioDto: ['productoId', 'precioObjetivo'],
      CrearAvisoReposicionDto: ['productoId', 'varianteId'],
      CrearCambioDevolucionDto: ['pedidoItemId', 'nuevaVarianteId'],
      LookProductoDto: ['productoId', 'varianteId'],
      CrearPedidoDto: ['carritoId'],
      GuardarLookDto: ['lookId'],
    };
    for (const [schema, fields] of Object.entries(campos)) {
      for (const field of fields) {
        expect(schemas?.[schema]).toMatchObject({
          properties: { [field]: { type: 'integer', minimum: 1 } },
        });
      }
    }
    expect(schemas?.CrearLookDto).toMatchObject({
      properties: { productos: { type: 'array', minItems: 1 } },
    });
    const query = spec.paths['/productos'].get?.parameters;
    for (const name of ['pagina', 'limite', 'precioMin', 'precioMax']) {
      expect(query).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name,
            schema: expect.objectContaining({ type: 'integer' }) as unknown,
          }),
        ]),
      );
    }
  });

  it('rechaza looks vacios y fracciones; conserva la creacion valida', async () => {
    const api = solicitudAutenticada(app);
    await api
      .post('/looks')
      .send({ nombre: 'Prueba', productos: [] })
      .expect(400);
    await api
      .post('/looks')
      .send({
        nombre: 'Prueba',
        productos: [{ productoId: 1.5, varianteId: 101 }],
      })
      .expect(400);
    await api
      .post('/looks')
      .send({
        nombre: 'Prueba',
        productos: [{ productoId: 1, varianteId: 101 }],
      })
      .expect(201);
  });

  it.each([
    ['/usuarios/{usuarioId}/pedidos', '/usuarios/0/pedidos'],
    ['/usuarios/{usuarioId}/pedidos/{pedidoId}', '/usuarios/1/pedidos/01'],
    [
      '/usuarios/{usuarioId}/pedidos/{pedidoId}/cambios-devoluciones',
      '/usuarios/1/pedidos/-1/cambios-devoluciones',
    ],
    [
      '/usuarios/{usuarioId}/cambios-devoluciones/{solicitudId}',
      '/usuarios/1/cambios-devoluciones/1.5',
    ],
  ])('documenta y entrega el error 400 de GET %s', async (template, url) => {
    const spec = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    expect(spec.paths[template].get?.responses['400']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponseDto' },
        },
      },
    });
    const res = await solicitudAutenticada(app).get(url).expect(400);
    expect(res.body).toEqual({
      statusCode: 400,
      message: expect.any(String) as unknown,
      error: 'Bad Request',
      requestId: expect.any(String) as unknown,
      timestamp: expect.any(String) as unknown,
      path: url,
    });
  });

  it.each([false, true])(
    'checkout, aislamiento y snapshots; compensacion=%s',
    async (compensar) => {
      const api = solicitudAutenticada(app);
      const registro = async (email: string) => {
        const res = await api
          .post('/auth/registro')
          .send({
            nombre: 'Sintetico',
            correoElectronico: email,
            contrasena: 'synthetic-only',
          })
          .expect(201);
        return res.body as UsuarioResponseDto;
      };
      const user = await registro('checkout@example.invalid');
      const other = await registro('other@example.invalid');
      const cartRes = await api.get(`/usuarios/${user.id}/carrito`).expect(200);
      const cart = cartRes.body as CarritoResponseDto;
      const productRes = await api.get('/productos/1').expect(200);
      const product = productRes.body as ProductoDetalleResponseDto;
      const variant = product.variantes.find((v) => v.stock >= 2)!;
      await api
        .post(`/usuarios/${user.id}/carrito/items`)
        .send({ varianteId: variant.id, cantidad: 2 })
        .expect(201);
      const checkout = {
        carritoId: cart.id,
        contacto: {
          nombre: 'PRIVATE-CONTACT',
          email: 'private@example.invalid',
          telefono: '000000',
        },
        direccion: {
          calle: 'PRIVATE-ADDRESS',
          numero: '1',
          comuna: 'Prueba',
          region: 'Prueba',
        },
        metodoPago: 'webpay',
      };
      if (compensar) {
        if (process.env.PERSISTENCIA === 'mysql') {
          const repository = app.get(PedidosRepository);
          const original = repository.crear.bind(repository);
          jest
            .spyOn(repository, 'crear')
            .mockImplementationOnce(async (datos) => {
              await original(datos);
              throw new Error('Fallo sintetico');
            });
        } else
          jest
            .spyOn(app.get(CarritoService), 'vaciarDespuesDeCheckout')
            .mockRejectedValueOnce(new Error('Fallo sintetico'));
        await solicitudAutenticada(app, user.id)
          .post('/pedidos')
          .send(checkout)
          .expect(500);
        const emptyOrders = await api
          .get(`/usuarios/${user.id}/pedidos`)
          .expect(200);
        expect(emptyOrders.body).toEqual([]);
        const restored = await api
          .get(`/usuarios/${user.id}/carrito`)
          .expect(200);
        expect((restored.body as CarritoResponseDto).items[0].cantidad).toBe(2);
      }
      const res = await solicitudAutenticada(app, user.id)
        .post('/pedidos')
        .send(checkout)
        .expect(201);
      const order = res.body as PedidoDetalleResponseDto;
      expect(order.total).toBe(product.precio * 2);
      expect(order.items[0]).toMatchObject({
        varianteId: variant.id,
        cantidad: 2,
        precioUnitario: product.precio,
      });
      expect(Number.isNaN(Date.parse(order.fecha))).toBe(false);
      const internal = await app
        .get(PedidosRepository)
        .buscarDeUsuario(user.id, order.id);
      expect(internal).toMatchObject({
        usuarioId: user.id,
        checkout: {
          contacto: checkout.contacto,
          direccion: checkout.direccion,
        },
      });
      const detail = await api
        .get(`/usuarios/${user.id}/pedidos/${order.id}`)
        .expect(200);
      expect(detail.body).toEqual(order);
      expect(JSON.stringify(detail.body)).not.toContain('PRIVATE-');
      expect(detail.body).not.toHaveProperty('usuarioId');
      expect(detail.body).not.toHaveProperty('checkout');
      await api.get(`/usuarios/${other.id}/pedidos/${order.id}`).expect(404);
      const emptyCart = await api
        .get(`/usuarios/${user.id}/carrito`)
        .expect(200);
      expect((emptyCart.body as CarritoResponseDto).items).toEqual([]);
      await solicitudAutenticada(app, user.id)
        .post('/pedidos')
        .send(checkout)
        .expect(400);
      const unchangedStock = await api.get('/productos/1').expect(200);
      expect(
        (unchangedStock.body as ProductoDetalleResponseDto).variantes,
      ).toEqual(
        product.variantes.map((v) =>
          process.env.PERSISTENCIA === 'mysql' && v.id === variant.id
            ? { ...v, stock: v.stock - 2 }
            : v,
        ),
      );
    },
  );
});
