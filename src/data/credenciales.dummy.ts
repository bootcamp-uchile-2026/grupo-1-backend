import type { CredencialPersistida } from '../repositorios/credenciales.repository';

/**
 * Credenciales de la fase dummy (solo pruebas), una por usuario semilla.
 * Desde P2 se guarda unicamente el hash scrypt de las contrasenas de
 * demostracion de H2; las contrasenas en claro viven solo en los tests.
 * No son secretos reales y ninguna migracion SQL las crea.
 * correo es el email del usuario, normalizado en minusculas.
 */
export const CREDENCIALES_DUMMY: CredencialPersistida[] = [
  {
    usuarioId: 1,
    correo: 'cliente@stylenow.cl',
    hashContrasena:
      'scrypt$N=32768,r=8,p=3$K0n3pxgQ93jyFM7dK2daig$LeYyjaaKNF--K3cKNnM6K1Qx7x37yxsyA_DkwvzLXvQ',
  },
  {
    usuarioId: 2,
    correo: 'matias.soto@stylenow.cl',
    hashContrasena:
      'scrypt$N=32768,r=8,p=3$k13joj0cCa4AeZXOoUQ2yw$AMHp-5rr-zALJo1dRhs2v0KV32UqmmBitwY2SxESExQ',
  },
];
