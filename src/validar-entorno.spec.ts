import { validarEntorno } from './validar-entorno';

describe('validarEntorno', () => {
  it.each(['abc', '0', '65536', '1.5', '-5'])('rechaza PORT=%s', (PORT) => {
    expect(() => validarEntorno({ PORT })).toThrow('PORT');
  });

  it.each([undefined, '', '1', '3000', '65535'])(
    'admite el valor de puerto %s',
    (PORT) => {
      expect(validarEntorno({ PORT, APP_NAME: 'StyleNow' })).toEqual({
        PORT,
        APP_NAME: 'StyleNow',
      });
    },
  );
});
