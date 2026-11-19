import type { Usuario } from '../dominio/modelos';

/** Campos del perfil que el usuario puede modificar. */
export type CambiosUsuario = Pick<Usuario, 'nombre' | 'apellido' | 'telefono'>;

/** Perfil de un usuario nuevo. El repositorio le asigna el id. */
export type NuevoUsuario = Omit<Usuario, 'id'>;

/** Acceso a los usuarios. Devuelve null cuando el usuario no existe. */
export abstract class UsuariosRepository {
  abstract buscarPorId(id: number): Promise<Usuario | null>;

  abstract actualizar(
    id: number,
    cambios: CambiosUsuario,
  ): Promise<Usuario | null>;

  /** Guarda un usuario nuevo con el siguiente id libre. */
  abstract crear(datos: NuevoUsuario): Promise<Usuario>;
}
