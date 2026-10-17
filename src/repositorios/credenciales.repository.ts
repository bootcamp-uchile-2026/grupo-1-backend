/**
 * Credencial privada de un usuario. No forma parte de ningun DTO de salida:
 * solo AuthService y UsuariosService la leen para validar contrasenas.
 */
export interface CredencialPersistida {
  usuarioId: number;
  /** Correo normalizado (sin espacios en los extremos y en minusculas). */
  correo: string;
  /** Contrasena en texto plano: Hito 2 no aplica hashing (fase dummy). */
  contrasena: string;
}

/**
 * Acceso a las credenciales. Compara correos tal como llegan: normalizarlos
 * es tarea del servicio. No decide si una contrasena es correcta.
 */
export abstract class CredencialesRepository {
  abstract buscarPorCorreo(
    correo: string,
  ): Promise<CredencialPersistida | null>;

  abstract buscarPorUsuario(
    usuarioId: number,
  ): Promise<CredencialPersistida | null>;

  /**
   * Guarda una credencial nueva. Devuelve false si ya existe una con el
   * mismo correo o para el mismo usuario.
   */
  abstract crear(credencial: CredencialPersistida): Promise<boolean>;

  /** Reemplaza la contrasena. Devuelve false si el usuario no tiene credencial. */
  abstract actualizarContrasena(
    usuarioId: number,
    contrasena: string,
  ): Promise<boolean>;
}
