import { validarEntorno } from '../validar-entorno';
import { UnidadDeTrabajoDummy } from './unidad-de-trabajo';
import { traducirErrorMysql } from './errores-mysql';
describe('Infraestructura piloto', () => {
  it('ignora DB en modo dummy', () => {
    expect(() => validarEntorno({ DB_PORT: 'invalid' })).not.toThrow();
  });
  it('no exige DB en dummy y conserva PORT normalizado', () => {
    expect(validarEntorno({ PORT: ' 3001 ' })).toMatchObject({
      PORT: '3001',
    });
  });
  it.each(['otro', '', 'MYSQL'])('rechaza adaptador %s', (PERSISTENCIA) => {
    expect(() => validarEntorno({ PERSISTENCIA })).toThrow('PERSISTENCIA');
  });
  it('no omite validar MySQL cuando falta PORT', () => {
    expect(() => validarEntorno({ PERSISTENCIA: 'mysql' })).toThrow('DB_HOST');
  });
  it.each(['0', '-1', '1.5', 'abc', '65536', '', '  '])(
    'rechaza DB_PORT %s',
    (DB_PORT) => {
      expect(() => validarEntorno({ DB_PORT, PERSISTENCIA: 'mysql' })).toThrow(
        'DB_PORT',
      );
    },
  );
  it('ejecuta unidad dummy y propaga errores sin ocultarlos', async () => {
    await expect(
      new UnidadDeTrabajoDummy().ejecutar(() => Promise.resolve(42)),
    ).resolves.toBe(42);
    await expect(
      new UnidadDeTrabajoDummy().ejecutar(() =>
        Promise.reject(new Error('test')),
      ),
    ).rejects.toThrow('test');
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
