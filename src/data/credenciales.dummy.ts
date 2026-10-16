import type { CredencialPersistida } from '../repositorios/credenciales.repository';

/**
 * Credenciales de la fase dummy, una por usuario semilla.
 * Son valores de demostracion para probar login y cambio de contrasena; no
 * son secretos reales. Viven separadas del perfil para que ninguna
 * respuesta de usuario pueda incluir la contrasena por accidente.
 * correo es el email del usuario, normalizado en minusculas.
 */
export const CREDENCIALES_DUMMY: CredencialPersistida[] = [
  { usuarioId: 1, correo: 'cliente@stylenow.cl', contrasena: 'demo-cliente-1' },
  {
    usuarioId: 2,
    correo: 'matias.soto@stylenow.cl',
    contrasena: 'demo-matias-2',
  },
];
