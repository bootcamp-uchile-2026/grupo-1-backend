import { crearDataSourceMysql, opcionesMysql } from './mysql.datasource';

const entorno = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USERNAME: 'test',
  DB_PASSWORD: 'valor-exclusivo-de-prueba',
  DB_DATABASE: 'stylenow_test',
};

describe('Configuracion MySQL', () => {
  it('desactiva escrituras automaticas del esquema y logs', () => {
    expect(opcionesMysql(entorno)).toMatchObject({
      synchronize: false,
      migrationsRun: false,
      logging: false,
      timezone: 'Z',
      charset: 'utf8mb4',
    });
    expect(crearDataSourceMysql(entorno).isInitialized).toBe(false);
  });

  it.each(['0', '-1', 'abc', '65536', '1.2'])(
    'rechaza puerto %s',
    (DB_PORT) => {
      expect(() => opcionesMysql({ ...entorno, DB_PORT })).toThrow('DB_PORT');
    },
  );

  it.each(['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'])(
    'identifica la variable ausente %s sin imprimir secretos',
    (campo) => {
      expect(() => opcionesMysql({ ...entorno, [campo]: '' })).toThrow(campo);
    },
  );
});
