import { randomBytes } from 'node:crypto';
import { ServicioContrasenas } from '../../src/seguridad/contrasenas';
import { USUARIOS_DUMMY } from '../fixtures/historicos/usuarios.fixture';
const cuentas = USUARIOS_DUMMY.map((u) => ({
  usuarioId: u.id,
  correo: u.email,
  contrasena: randomBytes(24).toString('hex'),
}));
export function credencialPrueba(usuarioId: number) {
  const cuenta = cuentas.find((c) => c.usuarioId === usuarioId);
  if (!cuenta) throw new Error('Cuenta de prueba no preparada');
  return cuenta;
}
let hashes:
  | Promise<{ usuarioId: number; correo: string; hashContrasena: string }[]>
  | undefined;
export function credencialesHistoricas() {
  return (hashes ??= Promise.all(
    cuentas.map(async (c) => ({
      usuarioId: c.usuarioId,
      correo: c.correo,
      hashContrasena: await new ServicioContrasenas().hash(c.contrasena),
    })),
  ));
}
