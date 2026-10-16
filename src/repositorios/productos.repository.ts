import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { VarianteResponseDto } from '../dto/variante-response.dto';

/** Una variante junto con el producto al que pertenece. */
export interface VarianteConProducto {
  producto: ProductoDetalleResponseDto;
  variante: VarianteResponseDto;
}

/**
 * Acceso al catalogo. Por ahora entrega el catalogo completo y el filtrado,
 * orden y paginacion del listado viven en ProductosService, para conservar
 * exactamente su comportamiento.
 */
export abstract class ProductosRepository {
  abstract listar(): Promise<ProductoDetalleResponseDto[]>;

  abstract buscarPorId(id: number): Promise<ProductoDetalleResponseDto | null>;

  abstract buscarVariante(
    varianteId: number,
  ): Promise<VarianteConProducto | null>;
}
