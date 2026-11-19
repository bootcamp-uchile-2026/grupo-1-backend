import type { ProductoDetalle, Variante } from '../dominio/modelos';

/** Una variante junto con el producto al que pertenece. */
export interface VarianteConProducto {
  producto: ProductoDetalle;
  variante: Variante;
}

/**
 * Acceso al catalogo. Por ahora entrega el catalogo completo y el filtrado,
 * orden y paginacion del listado viven en ProductosService, para conservar
 * exactamente su comportamiento.
 */
export abstract class ProductosRepository {
  abstract listar(): Promise<ProductoDetalle[]>;

  abstract buscarPorId(id: number): Promise<ProductoDetalle | null>;

  abstract buscarVariante(
    varianteId: number,
  ): Promise<VarianteConProducto | null>;
}
