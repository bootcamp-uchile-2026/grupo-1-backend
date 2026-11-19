import { enteroSeguro } from './productos.entidades';
import { PRODUCTOS_SEMILLA_P1 } from './migraciones/productos-semilla-p1';
import { PRODUCTOS_DUMMY } from '../data/productos.dummy';

describe('Representacion SQL de productos', () => {
  it('conserva el snapshot H2 completo sin importar fixtures en la migracion', () => {
    expect(PRODUCTOS_SEMILLA_P1).toEqual(PRODUCTOS_DUMMY);
    expect(PRODUCTOS_SEMILLA_P1).not.toBe(PRODUCTOS_DUMMY);
  });
  it.each([0, 39990, Number.MAX_SAFE_INTEGER])(
    'convierte sin perder precision %s',
    (value) => {
      expect(enteroSeguro.from(String(value))).toBe(value);
      expect(enteroSeguro.to(value)).toBe(value);
    },
  );
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza el entero no representable %s',
    (value) => {
      expect(() => enteroSeguro.from(String(value))).toThrow('fuera de rango');
      expect(() => enteroSeguro.to(value)).toThrow('fuera de rango');
    },
  );
});
