import { ENTORNO_VALIDO } from '../../test/fixtures/entorno-valido';
import { validarEntorno } from '../validar-entorno';
import { Test } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { PersistenciaModule } from './persistencia.module';
import { UnidadDeTrabajo, UnidadDeTrabajoTypeorm } from './unidad-de-trabajo';
import { traducirErrorMysql } from './errores-mysql';
describe('Infraestructura piloto', () => {
  it('exige variables SQL y JWT, valida formatos y no refleja valores sensibles', () => {
    for (const key of [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
      'JWT_SECRET',
    ]) {
      const config: Record<string, unknown> = { ...ENTORNO_VALIDO };
      delete config[key];
      expect(() => validarEntorno(config)).toThrow(key);
      for (const value of ['', '   ', null, 123])
        expect(() =>
          validarEntorno({ ...ENTORNO_VALIDO, [key]: value }),
        ).toThrow(key);
    }
    for (const host of [
      'mysql://usuario:marcador@host/base',
      '127.0.0.1:3306',
      '999.999.999.999',
    ])
      expect(() =>
        validarEntorno({ ...ENTORNO_VALIDO, DB_HOST: host }),
      ).toThrow('DB_HOST');
    for (const db of ['base/con/ruta', 'base.con.punto', 'x'.repeat(65)])
      expect(() =>
        validarEntorno({ ...ENTORNO_VALIDO, DB_DATABASE: db }),
      ).toThrow('DB_DATABASE');
    for (const secret of ['corto', ' '.repeat(32)])
      expect(() =>
        validarEntorno({ ...ENTORNO_VALIDO, JWT_SECRET: secret }),
      ).toThrow('JWT_SECRET');
    expect(() =>
      validarEntorno({
        ...ENTORNO_VALIDO,
        DB_USERNAME: 'usuario' + String.fromCharCode(0),
      }),
    ).toThrow('DB_USERNAME');
    const marker = 'NO-PUBLICAR-SQL03';
    try {
      validarEntorno({
        ...ENTORNO_VALIDO,
        DB_HOST: 'mysql://' + marker + '@host',
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(marker);
      expect((error as Error).stack).not.toContain(marker);
    }
  });
  it('no requiere selector, admite mysql legado y normaliza puertos sin alterar la contrasena', () => {
    const config = {
      ...ENTORNO_VALIDO,
      PORT: ' 3001 ',
      DB_PORT: ' 3306 ',
      DB_PASSWORD: ' espacios significativos ',
    };
    expect(validarEntorno(config)).toMatchObject({
      PORT: '3001',
      DB_PORT: '3306',
      DB_PASSWORD: config.DB_PASSWORD,
    });
    expect(validarEntorno(config)).not.toHaveProperty('PERSISTENCIA');
    expect(validarEntorno({ ...config, PERSISTENCIA: 'mysql' })).toHaveProperty(
      'PERSISTENCIA',
      'mysql',
    );
    expect(validarEntorno({ ...config, DB_HOST: '::1' })).toHaveProperty(
      'DB_HOST',
      '::1',
    );
    expect(() => validarEntorno({ ...config, PERSISTENCIA: 'dummy' })).toThrow(
      'PERSISTENCIA',
    );
  });
  it.each(['otro', '', 'MYSQL'])('rechaza adaptador %s', (PERSISTENCIA) => {
    expect(() => validarEntorno({ ...ENTORNO_VALIDO, PERSISTENCIA })).toThrow(
      'PERSISTENCIA',
    );
  });
  it('no omite validar MySQL cuando falta PORT', () => {
    expect(() =>
      validarEntorno({
        ...ENTORNO_VALIDO,
        DB_HOST: undefined,
        PORT: undefined,
      }),
    ).toThrow('DB_HOST');
  });
  it.each(['0', '-1', '1.5', 'abc', '65536', '', '  '])(
    'rechaza DB_PORT %s',
    (DB_PORT) => {
      expect(() => validarEntorno({ ...ENTORNO_VALIDO, DB_PORT })).toThrow(
        'DB_PORT',
      );
    },
  );
  it('resuelve la unidad TypeORM, propaga errores y rechaza ausencia de SQL', async () => {
    const transaction = jest.fn(
      async (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback({} as EntityManager),
    );
    const module = await Test.createTestingModule({
      imports: [PersistenciaModule],
    })
      .overrideProvider(DataSource)
      .useValue({
        transaction,
        isInitialized: true,
        destroy: jest.fn().mockResolvedValue(undefined),
      })
      .compile();
    try {
      const unit = module.get(UnidadDeTrabajo);
      expect(unit).toBeInstanceOf(UnidadDeTrabajoTypeorm);
      await expect(unit.ejecutar(() => Promise.resolve(42))).resolves.toBe(42);
      await expect(
        unit.ejecutar(() => Promise.reject(new Error('test'))),
      ).rejects.toThrow('test');
      expect(transaction).toHaveBeenCalledTimes(2);
    } finally {
      await module.close();
    }
    await expect(
      Test.createTestingModule({ imports: [PersistenciaModule] })
        .overrideProvider(DataSource)
        .useValue(null)
        .compile(),
    ).rejects.toThrow('requiere MySQL');
    await expect(
      Test.createTestingModule({ imports: [PersistenciaModule] })
        .overrideProvider(DataSource)
        .useValue({ isInitialized: false })
        .compile(),
    ).rejects.toThrow('requiere MySQL');
  });
  it.each([1062, 1451, 1452, 3819, 3572])(
    'traduce error %i sin exponer SQL',
    (errno) => {
      expect(() =>
        traducirErrorMysql({ driverError: { errno }, sql: 'secreto' }),
      ).toThrow(/persistencia|relacionado|incumplida/);
    },
  );
});
