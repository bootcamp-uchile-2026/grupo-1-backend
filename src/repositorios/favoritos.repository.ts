/**
 * Acceso a los favoritos: pares usuario/producto. No valida que el usuario
 * o el producto existan; eso lo hace FavoritosService.
 */
export abstract class FavoritosRepository {
  /**
   * Guarda el producto en la lista del usuario. Devuelve false si ya estaba,
   * sin modificar nada.
   */
  abstract agregar(usuarioId: number, productoId: number): Promise<boolean>;
}
