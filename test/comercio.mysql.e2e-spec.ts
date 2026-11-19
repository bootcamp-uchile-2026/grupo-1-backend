import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { TypeOrmCarritosRepository } from '../src/repositorios/typeorm/typeorm-carritos.repository';
import { TypeOrmPedidosRepository } from '../src/repositorios/typeorm/typeorm-pedidos.repository';
import { TypeOrmFavoritosRepository } from '../src/repositorios/typeorm/typeorm-favoritos.repository';
import { CarritoItemFila } from '../src/persistencia/comercio.entidades';
import { gestorActual } from '../src/persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../src/persistencia/unidad-de-trabajo';
import {
  laboratorioDesechable,
  conectarLaboratorio,
  reiniciarIdentidadSql,
} from './utilidades/estado-identidad-sql';
import { bearer } from './utilidades/autenticacion';
import type { Connection } from 'mysql2/promise';

const sql = process.env.STYLENOW_SQL_TEST === '1' ? describe : describe.skip;
const datos = (carritoId = 1) => ({
  carritoId,
  contacto: {
    nombre: 'Prueba',
    email: 'test@example.invalid',
    telefono: '000',
  },
  direccion: { calle: 'Prueba', numero: '1', comuna: 'Lab', region: 'Lab' },
  metodoPago: 'webpay',
});
sql('P3 comercio transaccional exclusivo', () => {
  let source: DataSource, connection: Connection;
  beforeAll(async () => {
    if (!laboratorioDesechable()) throw new Error('Solo laboratorio');
    source = crearDataSourceMysql();
    await source.initialize();
    await source.runMigrations();
    connection = await conectarLaboratorio();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(connection);
  });
  afterAll(async () => {
    await connection?.end();
    if (source?.isInitialized) await source.destroy();
  });
  const carts = () => new TypeOrmCarritosRepository(source);
  const orders = () => new TypeOrmPedidosRepository(source);
  it('migra desde P2 y conserva las seis migraciones originales', async () => {
    const migrations: unknown[] = await source.query(
      'SELECT * FROM migrations',
    );
    expect(migrations).toHaveLength(8);
    const original: unknown[] = await source.query(
      'SELECT * FROM usuario ORDER BY id',
    );
    await source.undoLastMigration();
    await source.undoLastMigration();
    await expect(carts().buscarPorId(1)).rejects.toThrow();
    expect(await source.query('SELECT * FROM usuario ORDER BY id')).toEqual(
      original,
    );
    expect((await source.runMigrations()).map((m) => m.name)).toEqual([
      'CrearComercio1795150400000',
      'SembrarComercio1795150401000',
    ]);
    await expect(
      source.query(
        'INSERT INTO favorito(usuario_id,producto_id) VALUES (99999,1)',
      ),
    ).rejects.toMatchObject({ driverError: { errno: 1452 } });
  });
  it('dos instancias suman en carrito sin perder actualizaciones', async () => {
    const fixture1 = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const fixture2 = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const a = fixture1.createNestApplication<INestApplication<App>>(),
      b = fixture2.createNestApplication<INestApplication<App>>();
    configurarApp(a);
    configurarApp(b);
    await a.init();
    await b.init();
    try {
      const send = (app: typeof a) =>
        request(app.getHttpServer())
          .post('/usuarios/1/carrito/items')
          .set('Authorization', bearer(app, 1))
          .send({ varianteId: 101, cantidad: 1 });
      const results = await Promise.all([send(a), send(b)]);
      expect(results.map((r) => r.status)).toEqual([201, 201]);
      expect((await carts().buscarPorId(1))?.items).toEqual([
        { varianteId: 101, cantidad: 2 },
      ]);
    } finally {
      await a.close();
      await b.close();
    }
  });
  it('carrito guarda orden, reemplaza y elimina sin descontar stock', async () => {
    const c = carts();
    await c.guardarCantidad(1, 102, 2);
    await c.guardarCantidad(1, 101, 1);
    await c.guardarCantidad(1, 102, 3);
    expect((await c.buscarPorId(1))?.items).toEqual([
      { varianteId: 102, cantidad: 3 },
      { varianteId: 101, cantidad: 1 },
    ]);
    await c.eliminarItem(1, 102);
    expect((await c.buscarPorId(1))?.items).toHaveLength(1);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '4' }]);
  });
  it('favoritos evita duplicados concurrentes y conserva insercion/aislamiento', async () => {
    const f = new TypeOrmFavoritosRepository(source);
    expect(await Promise.all([f.agregar(1, 3), f.agregar(1, 3)])).toEqual(
      expect.arrayContaining([true, false]),
    );
    await f.agregar(1, 1);
    expect(await f.listarProductos(1)).toEqual([3, 1]);
    expect(await f.listarProductos(2)).toEqual([]);
  });
  it('checkout atomico captura precios historicos y direccion propia', async () => {
    await carts().guardarCantidad(1, 101, 2);
    const p = await orders().confirmarCheckout(
      { ...datos(), direccionId: 1 },
      1,
    );
    expect(p.total).toBe(79980);
    expect(p.estado).toBe('confirmado');
    expect((await carts().buscarPorId(1))?.items).toEqual([]);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '2' }]);
    await source.query('UPDATE producto SET precio=1 WHERE id=1');
    try {
      expect(
        (await orders().buscarDeUsuario(1, p.id))?.items[0].precioUnitario,
      ).toBe(39990);
    } finally {
      await source.query('UPDATE producto SET precio=39990 WHERE id=1');
    }
  });
  it('idempotencia concurrente devuelve un solo pedido y detecta otro payload', async () => {
    await carts().guardarCantidad(1, 101, 1);
    const a = orders(),
      b = orders();
    const [x, y] = await Promise.all([
      a.confirmarCheckout(datos(), 1, 'prueba'),
      b.confirmarCheckout(datos(), 1, 'prueba'),
    ]);
    expect(x.id).toBe(y.id);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '3' }]);
    await expect(
      a.confirmarCheckout({ ...datos(), metodoPago: 'otro' }, 1, 'prueba'),
    ).rejects.toThrow('clave');
  });
  it('dos conexiones no sobrevenden la ultima unidad', async () => {
    await source.query('UPDATE variante SET stock=1 WHERE id=101');
    await carts().guardarCantidad(1, 101, 1);
    await carts().guardarCantidad(2, 101, 1);
    const other = crearDataSourceMysql();
    await other.initialize();
    try {
      const r = await Promise.allSettled([
        orders().confirmarCheckout(datos(1), 1),
        new TypeOrmPedidosRepository(other).confirmarCheckout(datos(2), 2),
      ]);
      expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
      expect(
        await source.query('SELECT stock FROM variante WHERE id=101'),
      ).toEqual([{ stock: '0' }]);
    } finally {
      await other.destroy();
    }
  });
  it('rollback tras descuento y vaciado restaura todo', async () => {
    await carts().guardarCantidad(1, 101, 1);
    await expect(
      new UnidadDeTrabajoTypeorm(source).ejecutar(async () => {
        const repository = gestorActual(source).getRepository(CarritoItemFila);
        const original = repository.delete.bind(repository);
        const spy = jest
          .spyOn(repository, 'delete')
          .mockImplementation(async (criteria) => {
            await original(criteria);
            throw new Error('fallo tras vaciar');
          });
        try {
          await orders().confirmarCheckout(datos(), 1);
        } finally {
          spy.mockRestore();
        }
      }),
    ).rejects.toThrow('fallo tras vaciar');
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '4' }]);
    expect((await carts().buscarPorId(1))?.items).toHaveLength(1);
    expect(await orders().listarPorUsuario(1)).toHaveLength(2);
  });
  it('stock insuficiente o direccion ajena no crean pedidos', async () => {
    await carts().guardarCantidad(1, 101, 5);
    await expect(orders().confirmarCheckout(datos(), 1)).rejects.toThrow(
      'Stock',
    );
    await expect(
      orders().confirmarCheckout({ ...datos(), direccionId: 3 }, 1),
    ).rejects.toThrow('direccion');
    expect((await carts().buscarPorId(1))?.items[0].cantidad).toBe(5);
  });
  it('JWT/ownership, precios del servidor y errores HTTP/OpenAPI', async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = fixture.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
    try {
      const api = request(app.getHttpServer());
      await api.get('/usuarios/1/carrito').expect(401);
      await api
        .get('/usuarios/1/carrito')
        .set('Authorization', bearer(app, 2))
        .expect(404);
      await api
        .post('/usuarios/1/carrito/items')
        .set('Authorization', bearer(app, 1))
        .send({ varianteId: 101, cantidad: 1 })
        .expect(201);
      await api
        .post('/pedidos')
        .set('Authorization', bearer(app, 2))
        .send(datos())
        .expect(404);
      await api
        .post('/pedidos')
        .set('Authorization', bearer(app, 1))
        .send({ ...datos(), total: 1 })
        .expect(400);
      await api
        .post('/pedidos')
        .set('Authorization', bearer(app, 1))
        .set('Idempotency-Key', 'http')
        .send(datos())
        .expect(201);
      await api
        .post('/pedidos')
        .set('Authorization', bearer(app, 1))
        .set('Idempotency-Key', 'http')
        .send(datos())
        .expect(201);
    } finally {
      await app.close();
    }
  });
});
