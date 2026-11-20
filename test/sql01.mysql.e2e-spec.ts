import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { DataSource } from 'typeorm';
import type { Connection } from 'mysql2/promise';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { UnidadDeTrabajoTypeorm } from '../src/persistencia/unidad-de-trabajo';
import { TypeOrmPedidosRepository } from '../src/repositorios/typeorm/typeorm-pedidos.repository';
import { TypeOrmCarritosRepository } from '../src/repositorios/typeorm/typeorm-carritos.repository';
import { TypeOrmProductosRepository } from '../src/repositorios/typeorm/typeorm-productos.repository';
import { aPedidoRespuesta } from '../src/services/respuestas.mapper';
import {
  conectarLaboratorio,
  reiniciarIdentidadSql,
} from './utilidades/estado-identidad-sql';
import { FactoriesSql } from './utilidades/factories-sql';
import { bearer } from './utilidades/autenticacion';

describe('SQL-01 factories y conservacion de propiedad, snapshot y transacciones', () => {
  let source: DataSource,
    conn: Connection,
    app: INestApplication<App>,
    f: FactoriesSql;
  beforeAll(async () => {
    conn = await conectarLaboratorio();
    source = crearDataSourceMysql();
    await source.initialize();
    const m = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = m.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(conn);
    f = new FactoriesSql(source);
  });
  afterEach(async () => {
    await reiniciarIdentidadSql(conn);
    await f.limpiarCatalogos();
  });
  afterAll(async () => {
    await app?.close();
    await conn?.end();
    if (source?.isInitialized) await source.destroy();
  });
  it('crea cuentas independientes y verifica JWT, acceso cruzado y privacidad', async () => {
    const a = await f.usuario(),
      b = await f.usuario();
    expect(a.usuario.id).not.toBe(b.usuario.id);
    expect(a.correo).not.toBe(b.correo);
    expect(a.contrasena).not.toBe(b.contrasena);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correoElectronico: a.correo, contrasena: a.contrasena })
      .expect(200);
    const auth =
      'Bearer ' + (login.body as { accessToken: string }).accessToken;
    await request(app.getHttpServer())
      .get('/usuarios/' + a.usuario.id)
      .expect(401);
    await request(app.getHttpServer())
      .get('/usuarios/' + b.usuario.id)
      .set('Authorization', auth)
      .expect(404);
    const profile = await request(app.getHttpServer())
      .get('/usuarios/' + a.usuario.id)
      .set('Authorization', auth)
      .expect(200);
    expect(JSON.stringify(profile.body)).not.toContain(a.contrasena);
    expect(JSON.stringify(profile.body)).not.toMatch(/scrypt|hashContrasena/i);
  });
  it('crea producto, variante e imagen sin IDs de catalogo compartidos', async () => {
    const a = await f.producto(),
      b = await f.producto();
    expect(a.producto.id).not.toBe(b.producto.id);
    expect(a.variante.id).not.toBe(b.variante.id);
    const p = await new TypeOrmProductosRepository(source).buscarPorId(
      a.producto.id,
    );
    expect(p?.variantes[0]).toMatchObject({ id: a.variante.id, stock: 3 });
    expect(p?.imagenes).toEqual(['https://example.invalid/producto.webp']);
    await request(app.getHttpServer())
      .get('/productos/' + a.producto.id)
      .expect(200);
  });
  it('conserva dueno y snapshot, copia independiente y lectura desde otra conexion', async () => {
    const { cuenta, pedido, catalogo } = await f.pedido(),
      otro = await f.usuario();
    const output = aPedidoRespuesta(pedido);
    expect(pedido.usuarioId).toBe(cuenta.usuario.id);
    expect(pedido.checkout?.contacto.nombre).toBe('privado');
    expect(output).not.toHaveProperty('checkout');
    expect(output).not.toHaveProperty('usuarioId');
    output.items[0].nombre = 'mutado externamente';
    pedido.checkout!.contacto.nombre = 'otra mutacion';
    const other = crearDataSourceMysql();
    await other.initialize();
    try {
      const r = new TypeOrmPedidosRepository(other),
        stored = await r.buscarDeUsuario(cuenta.usuario.id, pedido.id);
      expect(stored?.items[0].nombre).toBe('Producto SQL01');
      expect(stored?.checkout?.contacto.nombre).toBe('privado');
      expect(await r.buscarDeUsuario(otro.usuario.id, pedido.id)).toBeNull();
    } finally {
      await other.destroy();
    }
    await source.query('UPDATE producto SET precio=9999 WHERE id=?', [
      catalogo.producto.id,
    ]);
    expect(
      (
        await new TypeOrmPedidosRepository(source).buscarDeUsuario(
          cuenta.usuario.id,
          pedido.id,
        )
      )?.items[0].precioUnitario,
    ).toBe(1234);
    await request(app.getHttpServer())
      .get('/usuarios/' + cuenta.usuario.id + '/pedidos/' + pedido.id)
      .set('Authorization', bearer(app, otro.usuario.id))
      .expect(404);
  });
  it('revierte usuario, credencial, pedido y catalogo ante un fallo exterior', async () => {
    const before = await source.query<unknown[]>(
      'SELECT (SELECT COUNT(*) FROM usuario) AS usuarios,(SELECT COUNT(*) FROM pedido) AS pedidos,(SELECT COUNT(*) FROM credencial) AS credenciales',
    );
    await expect(
      new UnidadDeTrabajoTypeorm(source).ejecutar(async () => {
        await f.pedido();
        throw new Error('rollback factory');
      }),
    ).rejects.toThrow('rollback factory');
    expect(
      await source.query(
        'SELECT (SELECT COUNT(*) FROM usuario) AS usuarios,(SELECT COUNT(*) FROM pedido) AS pedidos,(SELECT COUNT(*) FROM credencial) AS credenciales',
      ),
    ).toEqual(before);
  });
  it('dos cuentas compiten por una unidad sin sobreventa', async () => {
    const a = await f.usuario(),
      b = await f.usuario(),
      p = await f.producto(1),
      carritos = new TypeOrmCarritosRepository(source),
      pedidos = new TypeOrmPedidosRepository(source);
    const preparar = async (id: number) => {
      const c = await carritos.crearParaUsuario(id);
      await carritos.guardarCantidad(c.id, p.variante.id, 1);
      return {
        carritoId: c.id,
        contacto: {
          nombre: 'Lab',
          email: 'lab@example.invalid',
          telefono: '000',
        },
        direccion: { calle: 'Lab', numero: '1', comuna: 'Lab', region: 'Lab' },
        metodoPago: 'webpay',
      };
    };
    const [ca, cb] = await Promise.all([
        preparar(a.usuario.id),
        preparar(b.usuario.id),
      ]),
      r = await Promise.allSettled([
        pedidos.confirmarCheckout(ca, a.usuario.id),
        pedidos.confirmarCheckout(cb, b.usuario.id),
      ]);
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(r.filter((x) => x.status === 'rejected')).toHaveLength(1);
    expect(
      await source.query('SELECT stock FROM variante WHERE id=?', [
        p.variante.id,
      ]),
    ).toEqual([{ stock: '0' }]);
    expect(
      await source.query(
        'SELECT COUNT(*) AS n FROM pedido_item WHERE variante_id=?',
        [p.variante.id],
      ),
    ).toEqual([{ n: '1' }]);
  });
});
