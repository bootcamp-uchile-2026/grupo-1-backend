import { PRODUCTOS_DUMMY as PRODUCTOS_HISTORICOS } from './fixtures/historicos/productos.fixture';
import { contratoHttp, normalizarContrato } from './utilidades/contratos-http';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { Producto, Variante } from '../src/persistencia/productos.entidades';
import { TypeOrmProductosRepository } from '../src/repositorios/typeorm/typeorm-productos.repository';
import { ProductosRepository } from '../src/repositorios/productos.repository';
import { UsuariosRepository } from '../src/repositorios/usuarios.repository';
import { TypeOrmUsuariosRepository } from '../src/repositorios/typeorm/typeorm-usuarios.repository';
import { bearer } from './utilidades/autenticacion';
import {
  cambiosPendientesDeEsquema,
  revertirDesde,
  verificarMigracionesCompletas,
} from './utilidades/migraciones';
import { SembrarProductos1794950401000 } from '../src/persistencia/migraciones/1794950401000-sembrar-productos';
import { UnidadDeTrabajoTypeorm } from '../src/persistencia/unidad-de-trabajo';
import { gestorActual } from '../src/persistencia/gestor-actual';

const sql = describe;

sql('P1 productos MySQL exclusivo, posterior a PR0', () => {
  let source: DataSource;
  let repository: TypeOrmProductosRepository;
  const open = async (mode: 'mysql'): Promise<INestApplication<App>> => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ ...process.env, PERSISTENCIA: mode }))
      .compile();
    const app = module.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
    return app;
  };

  beforeAll(async () => {
    if (
      !/^stylenow_pr0_[a-f0-9]{12}_test$/.test(process.env.DB_DATABASE ?? '') ||
      process.env.DB_DATABASE !== process.env.MYSQL_LAB_DATABASE ||
      process.env.DB_HOST !== '127.0.0.1' ||
      process.env.MYSQL_LAB_GUARD !== 'exclusive-disposable-pr0'
    ) {
      throw new Error('P1 requiere el laboratorio exclusivo');
    }
    source = crearDataSourceMysql();
    await source.initialize();
    repository = new TypeOrmProductosRepository(source);
  });
  afterAll(async () => {
    if (source?.isInitialized) await source.destroy();
  });

  it('migra desde PR0 sin alterar sus filas y repite semillas sin sobreescribir', async () => {
    const before: unknown[] = await source.query(
      'SELECT * FROM categoria ORDER BY id',
    );
    const colecciones: unknown[] = await source.query(
      'SELECT * FROM coleccion ORDER BY id',
    );
    const publicaciones: unknown[] = await source.query(
      'SELECT * FROM post ORDER BY id',
    );
    // Vuelve a PR0: revierte P1 y todo lo aplicado despues.
    const revertidas = await revertirDesde(
      source,
      'CrearProductos1794950400000',
    );
    expect(revertidas.slice(0, 2)).toEqual([
      'CrearProductos1794950400000',
      'SembrarProductos1794950401000',
    ]);
    const tables: Record<string, string>[] = await source.query('SHOW TABLES');
    expect(tables.map((t) => Object.values(t)[0]).sort()).toEqual([
      'categoria',
      'coleccion',
      'migrations',
      'post',
    ]);
    await expect(repository.listar()).rejects.toThrow(); // Sin fallback si falta P1.
    expect((await source.runMigrations()).map((m) => m.name)).toEqual(
      revertidas,
    );
    await verificarMigracionesCompletas(source);
    expect(await source.query('SELECT * FROM categoria ORDER BY id')).toEqual(
      before,
    );
    expect(await source.query('SELECT * FROM coleccion ORDER BY id')).toEqual(
      colecciones,
    );
    expect(await source.query('SELECT * FROM post ORDER BY id')).toEqual(
      publicaciones,
    );
    const runner = source.createQueryRunner();
    try {
      await new SembrarProductos1794950401000().up(runner);
      await new SembrarProductos1794950401000().up(runner);
    } finally {
      await runner.release();
    }
    expect(await repository.listar()).toEqual(
      structuredClone(PRODUCTOS_HISTORICOS),
    );
    expect(await cambiosPendientesDeEsquema()).toEqual([]);
    const custom = source.createQueryRunner();
    await custom.startTransaction();
    try {
      await custom.query('UPDATE variante SET stock=17 WHERE id=101');
      await custom.query("UPDATE producto SET nombre='Dato propio' WHERE id=1");
      await new SembrarProductos1794950401000().up(custom);
      expect(
        await custom.query('SELECT stock FROM variante WHERE id=101'),
      ).toEqual([{ stock: '17' }]);
      expect(
        await custom.query('SELECT nombre FROM producto WHERE id=1'),
      ).toEqual([{ nombre: 'Dato propio' }]);
    } finally {
      await custom.rollbackTransaction();
      await custom.release();
    }
  });

  it('reconstruye los tres productos, siete variantes y ausencias con numeros HTTP', async () => {
    const catalogo = structuredClone(PRODUCTOS_HISTORICOS);
    for (const p of catalogo) {
      expect(await repository.buscarPorId(p.id)).toEqual(p);
      for (const v of p.variantes) {
        expect(await repository.buscarVariante(v.id)).toEqual({
          producto: p,
          variante: v,
        });
      }
    }
    expect(await repository.buscarPorId(404)).toBeNull();
    expect(await repository.buscarVariante(404)).toBeNull();
    const first = (await repository.listar())[0];
    first.imagenes.length = 0;
    first.variantes[0].stock = 999;
    expect(await repository.buscarPorId(1)).toEqual(catalogo[0]);
  });

  it('preserva posiciones, duplicados y arrays independientes dentro de UoW y revierte', async () => {
    await expect(
      new UnidadDeTrabajoTypeorm(source).ejecutar(async () => {
        const manager = gestorActual(source);
        await manager.query('DELETE FROM producto_imagen WHERE producto_id=1');
        await manager.query(
          'INSERT INTO producto_color (producto_id,posicion,color) VALUES (1,9,?), (1,5,?)',
          ['Repetido', 'Repetido'],
        );
        await manager.query(
          'INSERT INTO variante (id,producto_id,posicion,color,talla,stock) VALUES (999,1,8,?,?,0)',
          ['Blanco', 'S'],
        );
        const p = await repository.buscarPorId(1);
        expect(p?.imagenes).toEqual([]);
        expect(p?.imagenUrl).toBe(
          PRODUCTOS_HISTORICOS.find((p) => p.id === 1)?.imagenUrl,
        );
        expect(p?.colores).toEqual(['Blanco', 'Repetido', 'Repetido']);
        expect(p?.tallas).toEqual(['S', 'M', 'L']);
        expect(p?.variantes.map((v) => v.id)).toEqual([101, 102, 103, 999]);
        throw new Error('rollback P1');
      }),
    ).rejects.toThrow('rollback P1');
    expect(await repository.listar()).toEqual(
      structuredClone(PRODUCTOS_HISTORICOS),
    );
  });

  it.each([
    ['UPDATE producto SET categoria_id=999999 WHERE id=1', 1452],
    ['UPDATE variante SET producto_id=999999 WHERE id=101', 1452],
    ["INSERT INTO producto_imagen VALUES (999999,0,'x')", 1452],
    ["INSERT INTO producto_color VALUES (999999,0,'x')", 1452],
    ["INSERT INTO producto_talla VALUES (999999,0,'x')", 1452],
    ["INSERT INTO producto_imagen VALUES (1,0,'x')", 1062],
    ['UPDATE variante SET posicion=0 WHERE id=102', 1062],
    ['DELETE FROM producto WHERE id=1', 1451],
    ['DELETE FROM categoria WHERE id=1', 1451],
    ['UPDATE producto SET precio=-1 WHERE id=1', 3819],
    ['UPDATE producto SET precio=9007199254740992 WHERE id=1', 3819],
    ['UPDATE producto SET novedad=2 WHERE id=1', 3819],
    ['UPDATE producto SET calificacion=6 WHERE id=1', 3819],
    ['UPDATE variante SET stock=9007199254740992 WHERE id=101', 3819],
  ])('rechaza SQL que viola integridad: %s', async (statement, errno) => {
    await expect(source.query(statement)).rejects.toMatchObject({
      driverError: { errno },
    });
  });

  it('rechaza cambiar la PK de una variante a un id existente', async () => {
    const error = await source
      .query('UPDATE variante SET id=101 WHERE id=102')
      .then(
        () => {
          throw new Error('El UPDATE de la PK debia ser rechazado');
        },
        (e: unknown) =>
          e as { driverError?: { errno?: number; sqlMessage?: string } },
      );
    // La variante 102 tiene filas hijas (pedido_item desde P3, look_ocurrencia
    // desde P4) y toda FK hacia variante es ON UPDATE RESTRICT: InnoDB rechaza cambiar
    // la PK del padre (1451) antes de detectar la PK duplicada (1062), que
    // solo se observa si la variante no tiene hijos. Ambos son rechazos por
    // integridad; 1451 debe provenir de una FK que referencia variante.id.
    expect([1062, 1451]).toContain(error.driverError?.errno);
    if (error.driverError?.errno === 1451) {
      expect(error.driverError.sqlMessage).toMatch(
        /REFERENCES `variante` \(`id`/,
      );
    }
  });

  it('conserva paridad HTTP de detalle, filtros y errores; usuarios ya es SQL (P2)', async () => {
    const a = await open('mysql');
    const b = await open('mysql');
    try {
      expect(a.get(ProductosRepository)).toBeInstanceOf(
        TypeOrmProductosRepository,
      );
      expect(b.get(ProductosRepository)).toBeInstanceOf(
        TypeOrmProductosRepository,
      );
      expect(a.get(UsuariosRepository)).toBeInstanceOf(
        TypeOrmUsuariosRepository,
      );
      expect(b.get(UsuariosRepository)).toBeInstanceOf(
        TypeOrmUsuariosRepository,
      );
      // B1: id positivo no representable en el body -> 404 en ambos modos.
      for (const app of [a, b]) {
        for (const varianteId of ['9007199254740993', '1e20']) {
          const r = await request(app.getHttpServer())
            .post('/usuarios/1/carrito/items')
            .set('Authorization', bearer(app, 1))
            .set('Content-Type', 'application/json')
            .send(`{"varianteId":${varianteId},"cantidad":1}`);
          expect(r.status).toBe(404);
        }
      }
      const urls = [
        '/productos',
        '/productos/1',
        '/productos/2',
        '/productos/3',
        '/productos/999',
        '/productos/01',
        '/productos?search=%20ALGOD%C3%93N%20',
        '/productos?categoria=%20MUJER%20',
        '/productos?categoria=calzado',
        '/productos?color=Negro',
        '/productos?color=beige&talla=unica',
        '/productos?color=Blanco&talla=M',
        '/productos?color=Celeste&talla=S',
        '/productos?novedad=false&oferta=true',
        '/productos?novedad=true&oferta=false',
        '/productos?precioMin=29990&precioMax=39990',
        '/productos?precioMin=40000&precioMax=1',
        '/productos?pagina=2&limite=1',
        '/productos?pagina=99',
        '/productos?orden=precio_asc',
        '/productos?orden=precio_desc',
        '/productos?orden=nombre_asc',
        '/productos?orden=relevancia',
        '/productos?orden=invalid',
        '/productos?oferta=invalid',
        '/productos?limite=51',
      ];
      for (const url of urls) {
        const ra = await request(a.getHttpServer())
          .get(url)
          .set('X-Request-Id', 'p1-paridad');
        const rb = await request(b.getHttpServer())
          .get(url)
          .set('X-Request-Id', 'p1-paridad');
        const esperado = contratoHttp(url);
        expect(ra.status).toBe(esperado.status);
        expect(normalizarContrato(ra.body)).toEqual(esperado.body);
        expect(rb.status).toBe(ra.status);
        const normalize = (body: Record<string, unknown>) => {
          const copy = { ...body };
          if ('timestamp' in copy) copy.timestamp = '<instante>';
          return copy;
        };
        expect(normalize(rb.body as Record<string, unknown>)).toEqual(
          normalize(ra.body as Record<string, unknown>),
        );
      }
    } finally {
      await a.close();
      await b.close();
    }
  });

  it('lee cambios SQL reales sin fixtures ni cache y soporta IDs seguros grandes', async () => {
    const max = Number.MAX_SAFE_INTEGER;
    await expect(
      new UnidadDeTrabajoTypeorm(source).ejecutar(async () => {
        const manager = gestorActual(source);
        const p = await manager
          .getRepository(Producto)
          .findOneByOrFail({ id: 1 });
        await manager
          .getRepository(Producto)
          .insert({ ...p, id: max, nombre: 'Solo SQL', precio: max });
        await manager.getRepository(Variante).insert({
          id: max,
          productoId: max,
          posicion: 0,
          color: 'SQL',
          talla: 'SQL',
          stock: 0,
        });
        expect(await repository.buscarPorId(max)).toMatchObject({
          id: max,
          nombre: 'Solo SQL',
          precio: max,
          imagenes: [],
          colores: [],
          tallas: [],
        });
        expect((await repository.buscarVariante(max))?.variante.id).toBe(max);
        throw new Error('rollback grande');
      }),
    ).rejects.toThrow('rollback grande');
    expect(await repository.buscarPorId(max)).toBeNull();
  });
});
