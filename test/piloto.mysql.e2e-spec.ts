import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { Categoria, Coleccion, Post } from '../src/persistencia/entidades';
import { SembrarCategoriasEditorial1794650401000 } from '../src/persistencia/migraciones/1794650401000-sembrar-categorias-editorial';
import { UnidadDeTrabajoTypeorm } from '../src/persistencia/unidad-de-trabajo';
import { gestorActual } from '../src/persistencia/gestor-actual';
import { CategoriasRepository } from '../src/repositorios/categorias.repository';
import { ProductosRepository } from '../src/repositorios/productos.repository';
import { DummyCategoriasRepository } from '../src/repositorios/dummy/dummy-categorias.repository';
import { TypeOrmProductosRepository } from '../src/repositorios/typeorm/typeorm-productos.repository';
import { TypeOrmCategoriasRepository } from '../src/repositorios/typeorm/typeorm-categorias.repository';

const sql = process.env.STYLENOW_SQL_TEST === '1' ? describe : describe.skip;

/** Solo el harness exclusivo puede proporcionar este entorno desechable. */
sql('PR0 MySQL 8.4 real y aislado', () => {
  let source: DataSource;
  const open = async (
    mode: 'dummy' | 'mysql',
  ): Promise<INestApplication<App>> => {
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
      throw new Error(
        'Prueba SQL requiere base exclusiva generada por el harness PR0.',
      );
    }
    source = crearDataSourceMysql();
    await source.initialize();
  });
  afterAll(async () => {
    if (source?.isInitialized) await source.destroy();
  });

  it('parte vacio, migra/revierte y repite semillas sin duplicar ni cambiar el esquema', async () => {
    const before: unknown[] = await source.query('SHOW TABLES');
    expect(before).toEqual([]);
    const emptyApp = await open('mysql');
    try {
      const afterStartup: unknown[] = await source.query('SHOW TABLES');
      expect(afterStartup).toEqual([]);
    } finally {
      await emptyApp.close();
    }
    expect((await source.runMigrations()).map((m) => m.name)).toEqual([
      'CrearCategoriasEditorial1794650400000',
      'SembrarCategoriasEditorial1794650401000',
      'CrearProductos1794950400000',
      'SembrarProductos1794950401000',
      'CrearIdentidad1795050400000',
      'SembrarIdentidad1795050401000',
    ]);
    expect(await source.showMigrations()).toBe(false);
    for (let i = 0; i < 6; i++) await source.undoLastMigration();
    const revertedTables: unknown[] = await source.query('SHOW TABLES');
    expect(revertedTables).toHaveLength(1);
    await source.runMigrations();
    const runner = source.createQueryRunner();
    try {
      await new SembrarCategoriasEditorial1794650401000().up(runner);
      await new SembrarCategoriasEditorial1794650401000().up(runner);
    } finally {
      await runner.release();
    }
    expect(await source.getRepository(Categoria).count()).toBe(4);
    expect(await source.getRepository(Coleccion).count()).toBe(3);
    expect(await source.getRepository(Post).count()).toBe(3);
    const migratedTables: unknown[] = await source.query('SHOW TABLES');
    expect(migratedTables).toHaveLength(12);
    expect((await source.driver.createSchemaBuilder().log()).upQueries).toEqual(
      [],
    );
  });

  it('conserva cuerpos, filtros, errores y OpenAPI dummy/mysql; los otros dominios siguen dummy', async () => {
    const dummy = await open('dummy');
    const mysql = await open('mysql');
    try {
      expect(dummy.get(DataSource)).toBeNull();
      expect(dummy.get(CategoriasRepository)).toBe(
        dummy.get(DummyCategoriasRepository),
      );
      expect(mysql.get(CategoriasRepository)).toBeInstanceOf(
        TypeOrmCategoriasRepository,
      );
      expect(mysql.get(ProductosRepository)).toBeInstanceOf(
        TypeOrmProductosRepository,
      );
      expect(
        SwaggerModule.createDocument(mysql, new DocumentBuilder().build()),
      ).toEqual(
        SwaggerModule.createDocument(dummy, new DocumentBuilder().build()),
      );
      for (const url of [
        '/categorias',
        '/categorias?destacada=true',
        '/categorias?destacada=false',
        '/colecciones',
        '/posts',
        '/productos',
      ]) {
        const a = await request(dummy.getHttpServer()).get(url).expect(200);
        const b = await request(mysql.getHttpServer()).get(url).expect(200);
        expect(b.body).toEqual(a.body);
      }
      for (const app of [dummy, mysql]) {
        const res = await request(app.getHttpServer())
          .get('/categorias?destacada=invalid')
          .set('X-Request-Id', 'sql-validation')
          .expect(400);
        expect(res.body).toMatchObject({
          statusCode: 400,
          requestId: 'sql-validation',
          path: '/categorias',
        });
      }
    } finally {
      await dummy.close();
      await mysql.close();
    }
  });

  it('impone UNIQUE de slug y la unidad de trabajo revierte operaciones anidadas', async () => {
    await expect(
      source.getRepository(Categoria).insert({
        id: 9000,
        nombre: 'Prueba',
        slug: 'mujer',
        imagenUrl: 'https://example.invalid/test',
        destacada: false,
        orden: 99,
      }),
    ).rejects.toMatchObject({ driverError: { errno: 1062 } });
    const unit = new UnidadDeTrabajoTypeorm(source);
    await expect(
      unit.ejecutar(async () => {
        await gestorActual(source).getRepository(Categoria).insert({
          id: 9000,
          nombre: 'Rollback',
          slug: 'rollback',
          imagenUrl: 'https://example.invalid/test',
          destacada: false,
          orden: 99,
        });
        await unit.ejecutar(async () => {
          expect(
            await gestorActual(source)
              .getRepository(Categoria)
              .countBy({ id: 9000 }),
          ).toBe(1);
          throw new Error('Fallo sintetico de transaccion');
        });
      }),
    ).rejects.toThrow('Fallo sintetico');
    expect(await source.getRepository(Categoria).countBy({ id: 9000 })).toBe(0);
    for (const errno of [1213, 1205]) {
      let ejecuciones = 0;
      await expect(
        unit.ejecutar(async () => {
          ejecuciones++;
          await gestorActual(source).getRepository(Categoria).insert({
            id: 9000,
            nombre: 'Rollback SQL',
            slug: 'rollback-sql',
            imagenUrl: 'https://example.invalid/test',
            destacada: false,
            orden: 99,
          });
          // Error SQL sintetico dentro de una transaccion MySQL real.
          throw Object.assign(new Error('conflicto sintetico'), {
            driverError: { errno },
          });
        }),
      ).rejects.toThrow('Conflicto temporal de persistencia');
      expect(ejecuciones).toBe(1);
      expect(await source.getRepository(Categoria).countBy({ id: 9000 })).toBe(
        0,
      );
    }
  });

  it('persiste una fila de cada dominio y las recupera al cerrar y reabrir Nest', async () => {
    await source.transaction(async (manager) => {
      await manager.getRepository(Categoria).insert({
        id: 9001,
        nombre: 'Persistencia PR0',
        slug: 'persistencia-pr0',
        imagenUrl: 'https://example.invalid/pr0',
        destacada: false,
        orden: 99,
      });
      await manager.getRepository(Coleccion).insert({
        id: 9001,
        nombre: 'Persistencia PR0',
        descripcion: 'Sintetica',
        imagenUrl: 'https://example.invalid/pr0',
      });
      await manager.getRepository(Post).insert({
        id: 9001,
        titulo: 'Persistencia PR0',
        contenido: 'Sintetico',
        imagenUrl: 'https://example.invalid/pr0',
      });
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      const app = await open('mysql');
      try {
        for (const url of ['/categorias', '/colecciones', '/posts']) {
          const res = await request(app.getHttpServer()).get(url).expect(200);
          expect(res.body).toEqual(
            expect.arrayContaining([expect.objectContaining({ id: 9001 })]),
          );
        }
      } finally {
        await app.close();
      }
    }
  });
});
