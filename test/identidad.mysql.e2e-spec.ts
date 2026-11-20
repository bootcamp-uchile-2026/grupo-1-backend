import {
  contratoHttp,
  normalizarContrato,
  direccionesEsperadas,
} from './utilidades/contratos-http';
import { credencialPrueba } from './utilidades/credenciales-prueba';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mysql2/promise';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import { CredencialesRepository } from '../src/repositorios/credenciales.repository';
import { DireccionesRepository } from '../src/repositorios/direcciones.repository';
import { UsuariosRepository } from '../src/repositorios/usuarios.repository';
import { TypeOrmCredencialesRepository } from '../src/repositorios/typeorm/typeorm-credenciales.repository';
import { TypeOrmDireccionesRepository } from '../src/repositorios/typeorm/typeorm-direcciones.repository';
import { TypeOrmUsuariosRepository } from '../src/repositorios/typeorm/typeorm-usuarios.repository';
import { bearer } from './utilidades/autenticacion';
import {
  cambiosPendientesDeEsquema,
  migracionesAplicadas,
  verificarMigracionesCompletas,
} from './utilidades/migraciones';
import {
  conectarLaboratorio,
  laboratorioDesechable,
  reiniciarIdentidadSql,
} from './utilidades/estado-identidad-sql';

const sql = describe;
const errno = (e: unknown) =>
  (e as { errno?: number; driverError?: { errno?: number } }).driverError
    ?.errno ?? (e as { errno?: number }).errno;

sql('P2 identidad MySQL exclusivo (usuario, credencial, direccion)', () => {
  let source: DataSource;
  let conexion: Connection;
  const abrir = async (modo: 'mysql'): Promise<INestApplication<App>> => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ ...process.env, PERSISTENCIA: modo }))
      .compile();
    const app = modulo.createNestApplication<INestApplication<App>>();
    configurarApp(app);
    await app.init();
    return app;
  };

  beforeAll(async () => {
    if (!laboratorioDesechable()) {
      throw new Error('P2 requiere el laboratorio exclusivo');
    }
    source = crearDataSourceMysql();
    await source.initialize();
    conexion = await conectarLaboratorio();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(conexion);
  });
  afterAll(async () => {
    await conexion?.end();
    if (source?.isInitialized) await source.destroy();
  });

  it('M03/S03 aplicadas, entidades = DDL y semilla y contrato historico', async () => {
    await verificarMigracionesCompletas(source);
    const aplicadas = await migracionesAplicadas(source);
    const m03 = aplicadas.indexOf('CrearIdentidad1795050400000');
    expect(aplicadas.slice(m03, m03 + 2)).toEqual([
      'CrearIdentidad1795050400000',
      'SembrarIdentidad1795050401000',
    ]);
    expect(await cambiosPendientesDeEsquema()).toEqual([]);
    const b = await abrir('mysql');
    try {
      expect(b.get(UsuariosRepository)).toBeInstanceOf(
        TypeOrmUsuariosRepository,
      );
      expect(b.get(CredencialesRepository)).toBeInstanceOf(
        TypeOrmCredencialesRepository,
      );
      expect(b.get(DireccionesRepository)).toBeInstanceOf(
        TypeOrmDireccionesRepository,
      );
      for (const [url, id] of [
        ['/usuarios/1', 1],
        ['/usuarios/2', 2],
        ['/usuarios/1/direcciones', 1],
        ['/usuarios/2/direcciones', 2],
        ['/usuarios/1/direcciones/3', 1],
        ['/usuarios/99999', 99999],
        ['/usuarios/4294967296', 4294967296],
      ] as const) {
        const ra = contratoHttp(url);
        const rb = await request(b.getHttpServer())
          .get(url)
          .set('Authorization', bearer(b, id));
        expect(rb.status).toBe(ra.status);
        expect(normalizarContrato(rb.body)).toEqual(ra.body);
      }
    } finally {
      await b.close();
    }
  });

  it('integridad: FK RESTRICT, CHECK y unicidad se cumplen en la base', async () => {
    await conexion.beginTransaction();
    try {
      const casos: [string, unknown[], number][] = [
        [
          "INSERT INTO credencial (usuario_id,correo,hash_contrasena) VALUES (999,'x@x.cl','scrypt$x')",
          [],
          1452,
        ],
        [
          "INSERT INTO direccion (usuario_id,nombre,calle,numero,comuna,region,principal) VALUES (999,'n','c','1','c','r',0)",
          [],
          1452,
        ],
        ['DELETE FROM usuario WHERE id=1', [], 1451],
        [
          "INSERT INTO usuario (nombre,apellido,email) VALUES ('a','b','cliente@stylenow.cl')",
          [],
          1062,
        ],
        [
          "INSERT INTO credencial (usuario_id,correo,hash_contrasena) VALUES (1,'otro@x.cl','scrypt$x')",
          [],
          1062,
        ],
        [
          "UPDATE credencial SET hash_contrasena='texto-plano-invalido' WHERE usuario_id=1",
          [],
          3819,
        ],
        ['UPDATE direccion SET principal=2 WHERE id=1', [], 3819],
      ];
      for (const [consulta, valores, esperado] of casos) {
        let codigo: number | undefined;
        try {
          await conexion.query(consulta, valores);
        } catch (e) {
          codigo = errno(e);
        }
        expect([consulta, codigo]).toEqual([consulta, esperado]);
      }
    } finally {
      await conexion.rollback();
    }
  });

  it('registro transaccional: guarda hash, revierte usuario si falla la credencial y resiste concurrencia', async () => {
    const app = await abrir('mysql');
    try {
      const api = () => request(app.getHttpServer());
      await api()
        .post('/auth/registro')
        .send({
          nombre: 'Sql',
          correoElectronico: 'Sql.P2@Example.org',
          contrasena: 'Clave-Sql-P2',
        })
        .expect(201)
        .expect({
          id: 3,
          nombre: 'Sql',
          correoElectronico: 'sql.p2@example.org',
        });
      const [[fila]] = (await conexion.query(
        "SELECT c.hash_contrasena AS h FROM credencial c JOIN usuario u ON u.id=c.usuario_id WHERE u.email='sql.p2@example.org'",
      )) as unknown as [{ h: string }[]];
      expect(fila.h).toMatch(/^scrypt\$N=32768,r=8,p=3\$/);
      expect(fila.h).not.toContain('Clave-Sql-P2');

      const repo = app.get(CredencialesRepository);
      jest
        .spyOn(repo, 'crear')
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Fallo sintetico de credencial')),
        );
      await api()
        .post('/auth/registro')
        .send({
          nombre: 'Rollback',
          correoElectronico: 'rollback@example.org',
          contrasena: 'x-y-z-1',
        })
        .expect(500);
      const [huerfanos] = (await conexion.query(
        "SELECT COUNT(*) AS n FROM usuario WHERE email='rollback@example.org'",
      )) as unknown as [{ n: number }[]];
      expect(Number(huerfanos[0].n)).toBe(0);

      const intentos = await Promise.all(
        Array.from({ length: 4 }, () =>
          api().post('/auth/registro').send({
            nombre: 'Doble',
            correoElectronico: 'doble@example.org',
            contrasena: 'Clave-Doble-1',
          }),
        ),
      );
      expect(intentos.map((r) => r.status).sort()).toEqual([
        201, 409, 409, 409,
      ]);
      const [dobles] = (await conexion.query(
        "SELECT (SELECT COUNT(*) FROM usuario WHERE email='doble@example.org') AS u, (SELECT COUNT(*) FROM credencial WHERE correo='doble@example.org') AS c",
      )) as unknown as [{ u: number; c: number }[]];
      expect([Number(dobles[0].u), Number(dobles[0].c)]).toEqual([1, 1]);
    } finally {
      jest.restoreAllMocks();
      await app.close();
    }
  });

  it('login SQL valido/invalido, JWT obligatorio, acceso cruzado 404 y sin fuga de hashes', async () => {
    const app = await abrir('mysql');
    try {
      const api = () => request(app.getHttpServer());
      await api()
        .post('/auth/login')
        .send({ correoElectronico: 'cliente@stylenow.cl', contrasena: 'mala' })
        .expect(401);
      await api()
        .post('/auth/login')
        .send({
          correoElectronico: 'nadie@stylenow.cl',
          contrasena: credencialPrueba(1).contrasena,
        })
        .expect(401);
      const login = await api()
        .post('/auth/login')
        .send({
          correoElectronico: 'CLIENTE@stylenow.cl',
          contrasena: credencialPrueba(1).contrasena,
        })
        .expect(200);
      const t = `Bearer ${(login.body as { accessToken: string }).accessToken}`;
      await api().get('/usuarios/1').expect(401);
      await api()
        .get('/usuarios/1')
        .set('Authorization', t.slice(0, -2) + 'xx')
        .expect(401);
      const perfil = await api()
        .get('/usuarios/1')
        .set('Authorization', t)
        .expect(200);
      await api().get('/usuarios/2').set('Authorization', t).expect(404);
      await api()
        .get('/usuarios/2/direcciones')
        .set('Authorization', t)
        .expect(404);
      await api()
        .delete('/usuarios/2/direcciones/3')
        .set('Authorization', t)
        .expect(404);
      const [[d3]] = (await conexion.query(
        'SELECT COUNT(*) AS n FROM direccion WHERE id=3',
      )) as unknown as [{ n: number }[]];
      expect(Number(d3.n)).toBe(1);
      const [[h]] = (await conexion.query(
        'SELECT hash_contrasena AS h FROM credencial WHERE usuario_id=1',
      )) as unknown as [{ h: string }[]];
      const todo = JSON.stringify([login.body, perfil.body]);
      expect(todo).not.toContain(h.h);
      expect(todo).not.toContain(credencialPrueba(1).contrasena);
      expect(todo).not.toMatch(/hash|scrypt/i);
    } finally {
      await app.close();
    }
  });

  it('direcciones y perfil SQL: secuencia contractual y persisten en otra instancia', async () => {
    const pasos = async (app: INestApplication<App>) => {
      const t = bearer(app, 1);
      const r: unknown[] = [];
      const api = () => request(app.getHttpServer());
      const creada = await api()
        .post('/usuarios/1/direcciones')
        .set('Authorization', t)
        .send({
          nombre: 'Nueva',
          calle: 'Calle Ñuñoa',
          numero: '10',
          comuna: 'Ñuñoa',
          region: 'RM',
          principal: false,
        });
      r.push([creada.status, creada.body]);
      const editada = await api()
        .patch('/usuarios/1/direcciones/4')
        .set('Authorization', t)
        .send({ departamento: 'Of 2', principal: true });
      r.push([editada.status, editada.body]);
      const perfil = await api()
        .patch('/usuarios/1')
        .set('Authorization', t)
        .send({ apellido: 'Rojas Pérez' });
      r.push([perfil.status, perfil.body]);
      const borrada = await api()
        .delete('/usuarios/1/direcciones/2')
        .set('Authorization', t);
      r.push([borrada.status]);
      const lista = await api()
        .get('/usuarios/1/direcciones')
        .set('Authorization', t);
      r.push([lista.status, lista.body]);
      return r;
    };
    const b = await abrir('mysql');
    let esperado: unknown[];
    try {
      esperado = structuredClone(direccionesEsperadas);
      expect(await pasos(b)).toEqual(esperado);
    } finally {
      await b.close();
    }
    const c = await abrir('mysql'); // otra instancia, otro DataSource
    try {
      const lista = await request(c.getHttpServer())
        .get('/usuarios/1/direcciones')
        .set('Authorization', bearer(c, 1))
        .expect(200);
      expect(lista.body).toEqual((esperado[4] as unknown[])[1]);
      const perfil = await request(c.getHttpServer())
        .get('/usuarios/1')
        .set('Authorization', bearer(c, 1))
        .expect(200);
      expect((perfil.body as { apellido: string }).apellido).toBe(
        'Rojas Pérez',
      );
    } finally {
      await c.close();
    }
  });
});
