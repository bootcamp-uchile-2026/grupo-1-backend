import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de ENTRADA.
 * Cuerpo del boton "Agregar a favoritos" de la ficha de producto.
 * Se envia el producto y no la variante porque el wireframe marca el
 * producto completo como favorito, sin exigir color ni talla.
 */
export class AgregarFavoritoDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de producto',
    description: 'Producto que el cliente marca como favorito desde la ficha.',
    example: 1,
    required: true,
  })
  productoId: number;
}
