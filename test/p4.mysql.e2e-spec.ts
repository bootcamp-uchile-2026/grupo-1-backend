import { DummyPedidosRepository } from '../src/repositorios/dummy/dummy-pedidos.repository';
import { DummyFavoritosRepository } from '../src/repositorios/dummy/dummy-favoritos.repository';
import { DummyCarritosRepository } from '../src/repositorios/dummy/dummy-carritos.repository';
import { DummyDireccionesRepository } from '../src/repositorios/dummy/dummy-direcciones.repository';
import { DummyCredencialesRepository } from '../src/repositorios/dummy/dummy-credenciales.repository';
import { DummyPostsRepository } from '../src/repositorios/dummy/dummy-posts.repository';
import { DummyColeccionesRepository } from '../src/repositorios/dummy/dummy-colecciones.repository';
import { DummyCategoriasRepository } from '../src/repositorios/dummy/dummy-categorias.repository';
import { DummyProductosRepository } from '../src/repositorios/dummy/dummy-productos.repository';
import { DummyUsuariosRepository } from '../src/repositorios/dummy/dummy-usuarios.repository';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import type { Connection } from 'mysql2/promise';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { LogisticaService } from '../src/services/logistica.service';
import { TypeOrmCarritosRepository } from '../src/repositorios/typeorm/typeorm-carritos.repository';
import { TypeOrmPedidosRepository } from '../src/repositorios/typeorm/typeorm-pedidos.repository';
import { TypeOrmLooksRepository } from '../src/repositorios/typeorm/typeorm-looks.repository';
import { TypeOrmAlertasRepository } from '../src/repositorios/typeorm/typeorm-alertas.repository';
import { TypeOrmCambiosDevolucionesRepository } from '../src/repositorios/typeorm/typeorm-cambios-devoluciones.repository';
import { DummyLooksRepository } from '../src/repositorios/dummy/dummy-looks.repository';
import { DummyAlertasRepository } from '../src/repositorios/dummy/dummy-alertas.repository';
import { DummyCambiosDevolucionesRepository } from '../src/repositorios/dummy/dummy-cambios-devoluciones.repository';
import {
  laboratorioDesechable,
  conectarLaboratorio,
  reiniciarIdentidadSql,
} from './utilidades/estado-identidad-sql';
import { bearer } from './utilidades/autenticacion';
const sql = process.env.STYLENOW_SQL_TEST === '1' ? describe : describe.skip;
const body = (carritoId = 1) => ({
  carritoId,
  contacto: { nombre: 'Lab', email: 'lab@example.invalid', telefono: '000' },
  direccion: { calle: 'Lab', numero: '1', comuna: 'Lab', region: 'Lab' },
  metodoPago: 'webpay',
});
sql('P4 restante SQL exclusivo', () => {
  let source: DataSource, conn: Connection, app: INestApplication<App>;
  const logistica = (s = source) =>
    new LogisticaService(
      s,
      new ConfigService({ LOGISTICA_OPERADORES_IDS: '2' }),
    );
  const pedido = async () => {
    await new TypeOrmCarritosRepository(source).guardarCantidad(1, 101, 1);
    return new TypeOrmPedidosRepository(source).confirmarCheckout(body(), 1);
  };
  beforeAll(async () => {
    if (!laboratorioDesechable()) throw new Error('Solo laboratorio');
    source = crearDataSourceMysql();
    await source.initialize();
    await source.runMigrations();
    conn = await conectarLaboratorio();
    const m = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({ ...process.env, LOGISTICA_OPERADORES_IDS: '2' }),
      )
      .compile();
    app = m.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(conn);
  });
  afterAll(async () => {
    await app?.close();
    await conn?.end();
    if (source?.isInitialized) await source.destroy();
  });
  it('migraciones desde vacio, entidades y semillas sin envios ficticios', async () => {
    const rows = await source.query<unknown[]>('SELECT * FROM migrations');
    expect(rows).toHaveLength(13);
    const original = await source.query<unknown[]>(
      'SELECT * FROM pedido ORDER BY id',
    );
    for (let i = 0; i < 5; i++) await source.undoLastMigration();
    expect(
      await source.query<unknown[]>('SELECT * FROM migrations'),
    ).toHaveLength(8);
    expect(await source.query('SELECT * FROM pedido ORDER BY id')).toEqual(
      original,
    );
    expect(await source.runMigrations()).toHaveLength(5);
    expect(await source.query('SELECT * FROM envio')).toEqual([]);
    expect(await source.query('SELECT * FROM inventario_pedido')).toEqual([]);
  });
  it('alertas equivalentes y aisladas, duplicados permitidos por H2', async () => {
    const r = new TypeOrmAlertasRepository(source);
    expect(await r.listarPorUsuario(1)).toEqual(
      await new DummyAlertasRepository().listarPorUsuario(1),
    );
    const a = await r.crear(1, {
      tipo: 'reposicion',
      productoId: 3,
      varianteId: 302,
      estado: 'activa',
    });
    expect(await r.eliminar(2, a.id)).toBe(false);
    expect(await r.eliminar(1, a.id)).toBe(true);
    await expect(
      source.query(
        "INSERT INTO alerta(usuario_id,tipo,producto_id,variante_id,estado) VALUES(1,'reposicion',1,201,'activa')",
      ),
    ).rejects.toMatchObject({ driverError: { errno: 1452 } });
  });
  it('looks conservan orden, repeticiones, total y creador; guardar idempotente', async () => {
    const r = new TypeOrmLooksRepository(source);
    expect(await r.listarPagina(0, 10)).toEqual(
      await new DummyLooksRepository().listarPagina(0, 10),
    );
    const l = await r.crear(
      {
        nombre: 'Duplicados',
        productos: [
          { productoId: 1, varianteId: 101 },
          { productoId: 1, varianteId: 101 },
        ],
        precioTotal: 79980,
      },
      1,
    );
    expect(l.productos).toHaveLength(2);
    await r.guardarParaUsuario(1, l.id);
    await r.guardarParaUsuario(1, l.id);
    expect(
      await source.query(
        'SELECT creador_usuario_id FROM look_conjunto WHERE id=?',
        [l.id],
      ),
    ).toEqual([{ creador_usuario_id: 1 }]);
    expect(
      await source.query<unknown[]>(
        'SELECT * FROM look_guardado WHERE look_id=?',
        [l.id],
      ),
    ).toHaveLength(1);
  });
  it('ciclo valido e invalido con actor y fechas', async () => {
    const p = await pedido(),
      l = logistica();
    await expect(l.transicionar(p.id, 'SHIPPED', 2)).rejects.toThrow();
    await expect(l.transicionar(p.id, 'PREPARING', 1)).rejects.toThrow(
      'autorizado',
    );
    await l.transicionar(p.id, 'PREPARING', 2);
    await l.transicionar(p.id, 'SHIPPED', 2);
    await l.transicionar(p.id, 'DELIVERED', 2);
    await expect(l.transicionar(p.id, 'PENDING', 2)).rejects.toThrow();
    const s = await l.seguimiento(p.id, 1);
    expect(s.eventos).toHaveLength(4);
    expect(s.estado).toBe('DELIVERED');
    await expect(l.seguimiento(p.id, 2)).rejects.toThrow('inexistente');
  });
  it.each(['PENDING', 'PREPARING'] as const)(
    'cancela en %s una sola vez y restituye evidencia real',
    async (estado) => {
      const p = await pedido(),
        l = logistica();
      if (estado === 'PREPARING') await l.transicionar(p.id, estado, 2);
      const [a, b] = await Promise.all([
        l.cancelar(p.id, 1, 'Motivo'),
        l.cancelar(p.id, 1, 'Reintento'),
      ]);
      expect(a).toEqual(b);
      expect(a.stockRestituido).toBe(true);
      expect(
        await source.query('SELECT stock FROM variante WHERE id=101'),
      ).toEqual([{ stock: '4' }]);
      expect(
        await source.query<unknown[]>(
          'SELECT * FROM pedido_cancelacion WHERE pedido_id=?',
          [p.id],
        ),
      ).toHaveLength(1);
      await expect(l.transicionar(p.id, 'SHIPPED', 2)).rejects.toThrow();
    },
  );
  it('carrera despacho/cancelacion en conexiones distintas es serializable', async () => {
    const p = await pedido();
    await logistica().transicionar(p.id, 'PREPARING', 2);
    const other = crearDataSourceMysql();
    await other.initialize();
    try {
      const results = await Promise.allSettled([
        logistica().cancelar(p.id, 1),
        logistica(other).transicionar(p.id, 'SHIPPED', 2),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const s = await logistica().seguimiento(p.id, 1);
      expect(['SHIPPED', 'CANCELLED']).toContain(s.estado);
      expect(
        await source.query('SELECT stock FROM variante WHERE id=101'),
      ).toEqual([{ stock: s.estado === 'CANCELLED' ? '4' : '3' }]);
    } finally {
      await other.destroy();
    }
  });
  it('sin evidencia no devuelve stock historico; sin envio no inventa elegibilidad', async () => {
    const l = logistica();
    await expect(l.cancelar(1001, 1)).rejects.toThrow('evidencia');
    await l.crearEnvio(1001, 2);
    const c = await l.cancelar(1001, 1);
    expect(c.stockRestituido).toBe(false);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '4' }]);
  });
  it('cancelacion logistica no cancela pedido comercial ni devuelve stock', async () => {
    const p = await pedido();
    await logistica().transicionar(p.id, 'CANCELLED', 2);
    expect(
      await source.query('SELECT estado FROM pedido WHERE id=?', [p.id]),
    ).toEqual([{ estado: 'confirmado' }]);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '3' }]);
  });
  it('rollback de compensacion ante error de evento', async () => {
    const p = await pedido();
    const service = logistica();
    const spy = jest
      .spyOn(
        service as unknown as { evento: (...args: unknown[]) => Promise<void> },
        'evento',
      )
      .mockRejectedValueOnce(new Error('fallo sintetico de evento'));
    try {
      await expect(service.cancelar(p.id, 1)).rejects.toThrow(
        'fallo sintetico',
      );
      expect(
        await source.query('SELECT stock FROM variante WHERE id=101'),
      ).toEqual([{ stock: '3' }]);
      expect((await logistica().seguimiento(p.id, 1)).estado).toBe('PENDING');
      expect(await source.query('SELECT * FROM pedido_cancelacion')).toEqual(
        [],
      );
    } finally {
      spy.mockRestore();
    }
  });
  it('postventa conserva semillas, idempotencia, FK, historial y pertenencia', async () => {
    const r = new TypeOrmCambiosDevolucionesRepository(source);
    expect(await r.listarPorPedido(1001)).toEqual(
      await new DummyCambiosDevolucionesRepository().listarPorPedido(1001),
    );
    const d = {
      pedidoId: 1001,
      pedidoItemId: 5001,
      tipo: 'cambio' as const,
      estado: 'solicitada' as const,
      motivo: 'Lab',
      nuevaVarianteId: 101,
      metodoEntrega: 'retiro_domicilio',
    };
    const [a, b] = await Promise.all([
      r.crear(d, 1, 'solicitud'),
      r.crear(d, 1, 'solicitud'),
    ]);
    expect(a.id).toBe(b.id);
    expect(await r.historial(a.id)).toHaveLength(1);
    await expect(
      r.crear({ ...d, motivo: 'Otro' }, 1, 'solicitud'),
    ).rejects.toThrow('Clave');
    await expect(r.crear(d, 2)).rejects.toThrow();
    await expect(
      source.query(
        "INSERT INTO solicitud_postventa(pedido_id,pedido_item_id,tipo,estado,motivo,metodo_entrega,fecha_solicitud) VALUES(1001,6001,'devolucion','solicitada','x','x',NOW())",
      ),
    ).rejects.toMatchObject({ driverError: { errno: 1452 } });
  });
  it('HTTP JWT y operaciones cerradas para clientes; no campos extras', async () => {
    const api = request(app.getHttpServer());
    const p = await pedido();
    await api.get(`/usuarios/1/pedidos/${p.id}/seguimiento`).expect(401);
    await api
      .get(`/usuarios/1/pedidos/${p.id}/seguimiento`)
      .set('Authorization', bearer(app, 2))
      .expect(404);
    await api
      .patch(`/operaciones/pedidos/${p.id}/envio`)
      .set('Authorization', bearer(app, 1))
      .send({ estado: 'SHIPPED' })
      .expect(403);
    await api
      .post(`/usuarios/1/pedidos/${p.id}/cancelacion`)
      .set('Authorization', bearer(app, 1))
      .send({ estado: 'CANCELLED' })
      .expect(400);
    await api
      .post(`/usuarios/1/pedidos/${p.id}/cancelacion`)
      .set('Authorization', bearer(app, 1))
      .send({ motivo: 'Lab' })
      .expect(201);
  });

  it('ninguna lectura de negocio SQL usa los trece adaptadores dummy', async () => {
    const prototypes = [
      DummyUsuariosRepository.prototype,
      DummyProductosRepository.prototype,
      DummyCategoriasRepository.prototype,
      DummyColeccionesRepository.prototype,
      DummyPostsRepository.prototype,
      DummyCredencialesRepository.prototype,
      DummyDireccionesRepository.prototype,
      DummyCarritosRepository.prototype,
      DummyFavoritosRepository.prototype,
      DummyPedidosRepository.prototype,
      DummyLooksRepository.prototype,
      DummyAlertasRepository.prototype,
      DummyCambiosDevolucionesRepository.prototype,
    ];
    const spies: jest.SpyInstance[] = [];
    try {
      for (const prototype of prototypes)
        for (const key of Object.getOwnPropertyNames(prototype)) {
          if (key === 'constructor') continue;
          const record = prototype as unknown as Record<string, () => unknown>;
          if (typeof record[key] === 'function')
            spies.push(
              jest.spyOn(record, key).mockImplementation(() => {
                throw new Error('Dummy invocado en MySQL');
              }),
            );
        }
      const api = request(app.getHttpServer());
      for (const url of [
        '/productos',
        '/categorias',
        '/colecciones',
        '/posts',
        '/looks',
        '/usuarios/1',
        '/usuarios/1/carrito',
        '/usuarios/1/favoritos',
        '/usuarios/1/pedidos',
        '/usuarios/1/alertas',
        '/usuarios/1/direcciones',
        '/usuarios/1/pedidos/1001/cambios-devoluciones',
      ])
        await api.get(url).set('Authorization', bearer(app, 1)).expect(200);
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
  it('personal explicitamente autorizado puede despachar; cliente no cancela SHIPPED', async () => {
    const p = await pedido(),
      api = request(app.getHttpServer());
    await api
      .patch('/operaciones/pedidos/' + p.id + '/envio')
      .set('Authorization', bearer(app, 2))
      .send({ estado: 'PREPARING' })
      .expect(200);
    await api
      .patch('/operaciones/pedidos/' + p.id + '/envio')
      .set('Authorization', bearer(app, 2))
      .send({ estado: 'SHIPPED' })
      .expect(200);
    await api
      .post('/usuarios/1/pedidos/' + p.id + '/cancelacion')
      .set('Authorization', bearer(app, 1))
      .send({ motivo: 'Tarde' })
      .expect(409);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=101'),
    ).toEqual([{ stock: '3' }]);
  });
  it('postventa de pedido cancelado se rechaza y propietario ajeno no lee historial', async () => {
    const p = await pedido();
    await logistica().cancelar(p.id, 1);
    const api = request(app.getHttpServer());
    await api
      .post('/usuarios/1/pedidos/' + p.id + '/cambios-devoluciones')
      .set('Authorization', bearer(app, 1))
      .send({
        pedidoItemId: p.items[0].id,
        tipo: 'devolucion',
        motivo: 'Lab',
        metodoEntrega: 'simulado',
      })
      .expect(409);
    await api
      .get('/usuarios/1/cambios-devoluciones/1/eventos')
      .set('Authorization', bearer(app, 2))
      .expect(404);
  });
});
