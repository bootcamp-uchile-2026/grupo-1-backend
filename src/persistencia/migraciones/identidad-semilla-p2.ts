import type { Direccion, Usuario } from '../../dominio/modelos';

/**
 * Snapshot propio de los perfiles y direcciones H2 (datos sinteticos), para
 * que los dominios que aun son dummy conserven sus referencias a usuarios 1
 * y 2. NO incluye credenciales: ninguna migracion crea cuentas con
 * contrasena conocida. No importar fixtures vivos.
 */
export const USUARIOS_SEMILLA_P2: Usuario[] = [
  {
    id: 1,
    nombre: 'Fernanda',
    apellido: 'Rojas',
    email: 'cliente@stylenow.cl',
    telefono: '+56912345678',
  },
  {
    id: 2,
    nombre: 'Matias',
    apellido: 'Soto',
    email: 'matias.soto@stylenow.cl',
  },
];

export const DIRECCIONES_SEMILLA_P2: {
  usuarioId: number;
  direccion: Direccion;
}[] = [
  {
    usuarioId: 1,
    direccion: {
      id: 1,
      nombre: 'Casa',
      calle: 'Av. Providencia',
      numero: '1234',
      departamento: 'Depto 502',
      comuna: 'Providencia',
      region: 'Region Metropolitana',
      principal: true,
    },
  },
  {
    usuarioId: 1,
    direccion: {
      id: 2,
      nombre: 'Oficina',
      calle: 'Av. Apoquindo',
      numero: '4501',
      comuna: 'Las Condes',
      region: 'Region Metropolitana',
      principal: false,
    },
  },
  {
    usuarioId: 2,
    direccion: {
      id: 3,
      nombre: 'Casa',
      calle: 'Av. Alemania',
      numero: '850',
      comuna: 'Temuco',
      region: 'Region de La Araucania',
      principal: true,
    },
  },
];
