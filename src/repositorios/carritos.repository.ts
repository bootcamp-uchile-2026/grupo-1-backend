/** Linea guardada del carrito: solo la variante y sus unidades. */
export interface LineaCarritoPersistida {
  varianteId: number;
  cantidad: number;
}

/**
 * Carrito tal como se guarda. No repite nombre, imagen ni precio: esos datos
 * se leen del catalogo vigente al construir la respuesta.
 * id es la identidad propia del carrito; no equivale a usuarioId.
 */
export interface CarritoPersistido {
  id: number;
  usuarioId: number;
  items: LineaCarritoPersistida[];
}

/**
 * Acceso a los carritos. Guarda cantidades; no valida stock, usuarios ni
 * variantes: esas reglas son de CarritoService.
 */
export abstract class CarritosRepository {
  abstract buscarPorUsuario(
    usuarioId: number,
  ): Promise<CarritoPersistido | null>;

  abstract buscarPorId(carritoId: number): Promise<CarritoPersistido | null>;

  /**
   * Crea el carrito vacio de un usuario con el siguiente id libre. Si el
   * usuario ya tiene carrito, lo devuelve sin crear otro.
   */
  abstract crearParaUsuario(usuarioId: number): Promise<CarritoPersistido>;

  /**
   * Fija las unidades de una variante. Si la linea no existe la agrega al
   * final. Devuelve null si el carrito no existe.
   */
  abstract guardarCantidad(
    carritoId: number,
    varianteId: number,
    cantidad: number,
  ): Promise<CarritoPersistido | null>;

  /** Quita una linea. Devuelve false si el carrito o la linea no existen. */
  abstract eliminarItem(
    carritoId: number,
    varianteId: number,
  ): Promise<boolean>;

  /** Deja el carrito sin lineas. Devuelve false si el carrito no existe. */
  abstract vaciar(carritoId: number): Promise<boolean>;

  /** Restaura las lineas anteriores si el checkout no pudo completarse. */
  abstract restaurarItems(
    carritoId: number,
    items: LineaCarritoPersistida[],
  ): Promise<boolean>;
}
