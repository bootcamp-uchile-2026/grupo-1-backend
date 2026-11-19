import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import sharp from 'sharp';
import { DataSource } from 'typeorm';
import { createHash, randomUUID } from 'node:crypto';
import crypto from 'node:crypto';
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import {
  CargaImagen,
  PermisoUsuario,
} from '../src/persistencia/imagenes.entidades';
import {
  ImagenesRepository,
  PERMISO_IMAGENES,
} from '../src/imagenes/imagenes.repository';
import { ImagenesService } from '../src/imagenes/imagenes.service';
import { MAX_IMAGEN_BYTES } from '../src/imagenes/validar-imagen';
import { bearer } from './utilidades/autenticacion';
import {
  laboratorioDesechable,
  conectarLaboratorio,
  reiniciarIdentidadSql,
} from './utilidades/estado-identidad-sql';
import type { Connection } from 'mysql2/promise';
interface Asociacion {
  productoId: number;
  posicion: number;
  url: string;
}
const sql = process.env.STYLENOW_SQL_TEST === '1' ? describe : describe.skip;
sql('P5 imagenes persistentes MySQL exclusivo', () => {
  let source: DataSource,
    conn: Connection,
    app: INestApplication<App>,
    dir: string;
  const input = (format: 'jpeg' | 'png' | 'webp' = 'png') =>
    sharp({ create: { width: 4, height: 4, channels: 3, background: 'red' } })
      .toFormat(format)
      .toBuffer();
  const open = async () => {
    const m = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ ...process.env, IMAGENES_DIRECTORIO: dir }))
      .compile();
    const a = m.createNestApplication<INestApplication<App>>();
    configurarApp(a);
    await a.init();
    return a;
  };
  beforeAll(async () => {
    if (!laboratorioDesechable()) throw new Error('Solo laboratorio');
    source = crearDataSourceMysql();
    await source.initialize();
    await source.runMigrations();
    conn = await conectarLaboratorio();
    dir = await mkdtemp(join(tmpdir(), 'stylenow-p5-sql-'));
    app = await open();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(conn);
    await source
      .getRepository(PermisoUsuario)
      .insert({ usuarioId: 1, permiso: PERMISO_IMAGENES });
  });
  afterAll(async () => {
    await app?.close();
    await conn?.end();
    if (source?.isInitialized) await source.destroy();
  });
  const upload = (a = app, id = 1, actor = 1) =>
    request(a.getHttpServer())
      .post(`/administracion/productos/${id}/imagenes`)
      .set('Authorization', bearer(a, actor));
  it('JWT sin permiso no carga; consulta sigue publica y carga no hereda @Publico', async () => {
    const api = request(app.getHttpServer());
    await api.get('/productos/1').expect(200);
    await api
      .post('/administracion/productos/1/imagenes')
      .attach('imagen', await input(), 'x.png')
      .expect(401);
    await upload(app, 1, 2)
      .attach('imagen', await input(), 'x.png')
      .expect(403);
    await source
      .getRepository(PermisoUsuario)
      .delete({ usuarioId: 1, permiso: PERMISO_IMAGENES });
    await upload()
      .attach('imagen', await input(), 'x.png')
      .expect(403);
  });
  it.each(['jpeg', 'png', 'webp'] as const)(
    'publica %s real; asocia sin cambiar portada',
    async (format) => {
      const before = await request(app.getHttpServer())
        .get('/productos/1')
        .expect(200);
      const r = await upload()
        .attach('imagen', await input(format), {
          filename: '../../ataque.exe',
          contentType: 'application/octet-stream',
        })
        .expect(201);
      const image = r.body as Asociacion;
      expect(image.posicion).toBe(2);
      expect(image.url).toMatch(
        /^\/imagenes\/productos\/[a-f0-9-]+\.(jpg|png|webp)$/,
      );
      const content = await request(app.getHttpServer())
        .get(image.url)
        .expect(200);
      expect(content.headers['content-type']).toContain(
        format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
      );
      expect(content.headers['x-content-type-options']).toBe('nosniff');
      const after = await request(app.getHttpServer())
        .get('/productos/1')
        .expect(200);
      expect((after.body as { imagenUrl: string }).imagenUrl).toBe(
        (before.body as { imagenUrl: string }).imagenUrl,
      );
      expect((after.body as { imagenes: string[] }).imagenes).toContain(
        image.url,
      );
    },
  );
  it('rechaza contenido falso, truncado, ausente, campo inesperado y exceso de tamano', async () => {
    await upload()
      .attach('imagen', Buffer.from('<script>x</script>'), {
        filename: 'falso.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);
    await upload()
      .attach('imagen', Buffer.from([255, 216, 255, 0]), 'truncada.jpg')
      .expect(400);
    await upload().expect(400);
    await upload()
      .field('productoId', '2')
      .attach('imagen', await input(), 'x.png')
      .expect(400);
    await upload()
      .attach('imagen', Buffer.alloc(MAX_IMAGEN_BYTES + 1), 'grande.png')
      .expect(413);
  });
  it('producto inexistente no deja archivo ni registro', async () => {
    const before = await readdir(dir);
    await upload(app, 99999)
      .attach('imagen', await input(), 'x.png')
      .expect(404);
    expect(await readdir(dir)).toEqual(before);
    expect(await source.getRepository(CargaImagen).count()).toBe(0);
  });
  it('dos procesos asignan posiciones distintas y nombres unicos', async () => {
    const other = await open();
    try {
      const bytes = await input();
      const results = await Promise.all([
        upload().attach('imagen', bytes, 'igual.png'),
        upload(other).attach('imagen', bytes, 'igual.png'),
      ]);
      expect(results.map((r) => r.status)).toEqual([201, 201]);
      expect(
        results.map((r) => (r.body as Asociacion).posicion).sort(),
      ).toEqual([2, 3]);
      expect(new Set(results.map((r) => (r.body as Asociacion).url)).size).toBe(
        2,
      );
    } finally {
      await other.close();
    }
  });
  it('asociacion fallida compensa su archivo nuevo y no cambia galeria', async () => {
    const repo = app.get(ImagenesRepository);
    const spy = jest
      .spyOn(repo, 'publicar')
      .mockRejectedValueOnce(new Error('Fallo SQL sintetico'));
    const before = await readdir(dir);
    try {
      await upload()
        .attach('imagen', await input(), 'x.png')
        .expect(500);
      expect(await readdir(dir)).toEqual(before);
      expect(await source.getRepository(CargaImagen).find()).toEqual([
        expect.objectContaining({ estado: 'fallida' }),
      ]);
    } finally {
      spy.mockRestore();
    }
  });
  it('colision de nombre no sobrescribe ni elimina un archivo previo', async () => {
    const id = randomUUID(),
      archivo = id + '.png';
    const anterior = Buffer.from('Archivo ajeno preexistente');
    await writeFile(join(dir, archivo), anterior, { flag: 'wx' });
    const spy = jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    try {
      await upload()
        .attach('imagen', await input(), 'x.png')
        .expect(500);
      expect(await readFile(join(dir, archivo))).toEqual(anterior);
      expect(
        (await source.getRepository(CargaImagen).findOneByOrFail({ archivo }))
          .estado,
      ).toBe('colision');
      await app.get(ImagenesService).reconciliar();
      expect(await readFile(join(dir, archivo))).toEqual(anterior);
    } finally {
      spy.mockRestore();
    }
  });
  it('un commit valido con respuesta perdida nunca compensa la imagen publicada', async () => {
    const repository = app.get(ImagenesRepository),
      original = repository.publicar.bind(repository);
    const spy = jest
      .spyOn(repository, 'publicar')
      .mockImplementationOnce(async (carga) => {
        await original(carga);
        throw new Error('Respuesta SQL perdida despues del commit');
      });
    try {
      await upload()
        .attach('imagen', await input(), 'x.png')
        .expect(500);
      const row = await source
        .getRepository(CargaImagen)
        .findOneByOrFail({ estado: 'publicada' });
      await request(app.getHttpServer())
        .get('/imagenes/productos/' + row.archivo)
        .expect(200);
      expect(await readFile(join(dir, row.archivo))).toBeDefined();
    } finally {
      spy.mockRestore();
    }
  });
  it('reconcilia huerfano conocido y no toca publicado ni archivo ajeno', async () => {
    const r = await upload()
      .attach('imagen', await input(), 'x.png')
      .expect(201);
    const published = (r.body as Asociacion).url.split('/').pop()!;
    const data = await input();
    const archivo = randomUUID() + '.png';
    await writeFile(join(dir, archivo), data, { flag: 'wx' });
    await source.getRepository(CargaImagen).insert({
      archivo,
      productoId: '1',
      actorId: 1,
      estado: 'pendiente',
      sha256: createHash('sha256').update(data).digest('hex'),
      bytes: data.length,
      creadaEn: new Date(Date.now() - 3600000),
    });
    const ajeno = randomUUID() + '.png';
    await writeFile(join(dir, ajeno), data, { flag: 'wx' });
    await request(app.getHttpServer())
      .get('/imagenes/productos/' + archivo)
      .expect(404);
    const result = await request(app.getHttpServer())
      .post('/administracion/imagenes/reconciliacion')
      .set('Authorization', bearer(app, 1))
      .expect(201);
    expect((result.body as { eliminados: number }).eliminados).toBe(1);
    expect(await readdir(dir)).not.toContain(archivo);
    expect(await readFile(join(dir, published))).toBeDefined();
    expect(await readFile(join(dir, ajeno))).toEqual(data);
  });
  it('reserva abortada no puede publicar y archivos alterados requieren revision', async () => {
    const data = await input(),
      archivo = randomUUID() + '.png';
    const row = Object.assign(new CargaImagen(), {
      archivo,
      productoId: '1',
      actorId: 1,
      estado: 'pendiente',
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
      creadaEn: new Date(Date.now() - 3600000),
    });
    await source.getRepository(CargaImagen).insert(row);
    await writeFile(join(dir, archivo), Buffer.from('Alterado'), {
      flag: 'wx',
    });
    const result = await app.get(ImagenesService).reconciliar();
    expect(result.requierenRevision).toBe(1);
    await expect(app.get(ImagenesRepository).publicar(row)).rejects.toThrow(
      'Carga',
    );
    expect(await readFile(join(dir, archivo), 'utf8')).toBe('Alterado');
  });
  it('FK y estados invalidos rechazados; no permisos semilla para otros usuarios', async () => {
    await expect(
      source.query(
        "INSERT INTO permiso_usuario VALUES (99999,'productos.imagenes.gestionar')",
      ),
    ).rejects.toMatchObject({ driverError: { errno: 1452 } });
    expect(
      await source
        .getRepository(PermisoUsuario)
        .existsBy({ usuarioId: 2, permiso: PERMISO_IMAGENES }),
    ).toBe(false);
  });
  it('reabrir API conserva bytes y URLs; nombres de traversal no se aceptan', async () => {
    const r = await upload()
      .attach('imagen', await input(), 'x.png')
      .expect(201);
    const image = r.body as Asociacion;
    await app.close();
    app = await open();
    await request(app.getHttpServer()).get(image.url).expect(200);
    await request(app.getHttpServer())
      .get('/imagenes/productos/%2e%2e%2fpackage.json')
      .expect(404);
  });
});
