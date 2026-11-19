import { importeSeguro } from './typeorm-pedidos.repository';
describe('Importes exactos P3', () => {
  it('conserva maximo representable', () =>
    expect(importeSeguro(BigInt(Number.MAX_SAFE_INTEGER))).toBe(
      Number.MAX_SAFE_INTEGER,
    ));
  it.each([-1n, 9007199254740992n])('rechaza overflow %s', (n) =>
    expect(() => importeSeguro(n)).toThrow('rango'),
  );
});
