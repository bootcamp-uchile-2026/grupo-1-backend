import { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';

/**
 * Usuarios de la fase dummy.
 * El usuario 1 es el dueno de casi todos los datos de ejemplo. El usuario 2
 * existe para que la pertenencia de los recursos se pueda comprobar: lo que
 * es de un usuario responde 404 cuando lo pide el otro.
 */
export const USUARIOS_DUMMY: UsuarioDetalleResponseDto[] = [
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
