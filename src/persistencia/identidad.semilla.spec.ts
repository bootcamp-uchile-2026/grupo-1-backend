import { DIRECCIONES_DUMMY } from '../data/direcciones.dummy';
import { USUARIOS_DUMMY } from '../data/usuarios.dummy';
import {
  DIRECCIONES_SEMILLA_P2,
  USUARIOS_SEMILLA_P2,
} from './migraciones/identidad-semilla-p2';

describe('Semilla P2 de identidad', () => {
  it('es equivalente a los fixtures H2 y no contiene credenciales', () => {
    expect(USUARIOS_SEMILLA_P2).toEqual(USUARIOS_DUMMY);
    expect(DIRECCIONES_SEMILLA_P2).toEqual(DIRECCIONES_DUMMY);
    expect(
      JSON.stringify([USUARIOS_SEMILLA_P2, DIRECCIONES_SEMILLA_P2]),
    ).not.toMatch(/contrasena|hash|scrypt/i);
  });
});
