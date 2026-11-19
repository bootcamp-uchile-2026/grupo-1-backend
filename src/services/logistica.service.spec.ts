import { validarTransicion, EstadoEnvio } from './logistica.service';
describe('Ciclo logistico aprobado', () => {
  it.each([
    ['PENDING', 'PREPARING'],
    ['PREPARING', 'SHIPPED'],
    ['SHIPPED', 'DELIVERED'],
    ['PENDING', 'CANCELLED'],
    ['PREPARING', 'CANCELLED'],
  ] as [EstadoEnvio, EstadoEnvio][])('%s -> %s', (a, b) =>
    expect(() => validarTransicion(a, b, a === 'SHIPPED')).not.toThrow(),
  );
  it.each([
    ['PENDING', 'SHIPPED'],
    ['PREPARING', 'DELIVERED'],
    ['SHIPPED', 'PENDING'],
    ['SHIPPED', 'CANCELLED'],
    ['DELIVERED', 'CANCELLED'],
    ['CANCELLED', 'PREPARING'],
    ['CANCELLED', 'CANCELLED'],
  ] as [EstadoEnvio, EstadoEnvio][])('rechaza %s -> %s', (a, b) =>
    expect(() =>
      validarTransicion(a, b, a === 'SHIPPED' || a === 'DELIVERED'),
    ).toThrow(),
  );
  it('rechaza cancelar PREPARING si ya existe despacho', () =>
    expect(() => validarTransicion('PREPARING', 'CANCELLED', true)).toThrow());
});
