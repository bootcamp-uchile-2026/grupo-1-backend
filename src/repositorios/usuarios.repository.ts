import { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';

/** Campos del perfil que el usuario puede modificar. */
export type CambiosUsuario = Pick<
  UsuarioDetalleResponseDto,
  'nombre' | 'apellido' | 'telefono'
>;

/** Perfil de un usuario nuevo. El repositorio le asigna el id. */
export type NuevoUsuario = Omit<UsuarioDetalleResponseDto, 'id'>;

/** Acceso a los usuarios. Devuelve null cuando el usuario no existe. */
export abstract class UsuariosRepository {
  abstract buscarPorId(id: number): Promise<UsuarioDetalleResponseDto | null>;

  abstract actualizar(
    id: number,
    cambios: CambiosUsuario,
  ): Promise<UsuarioDetalleResponseDto | null>;

  /** Guarda un usuario nuevo con el siguiente id libre. */
  abstract crear(datos: NuevoUsuario): Promise<UsuarioDetalleResponseDto>;
}
