import { ApiProperty } from '@nestjs/swagger';
import { PedidoResponseDto } from './pedido-response.dto';

/**
 * DTO de SALIDA.
 * Linea de un pedido. Tiene identidad propia: no se deduce del producto,
 * de la variante ni de su posicion en el pedido.
 */
export class PedidoItemResponseDto {
  @ApiProperty({
    type: Number,
    description:
      'Identificador propio del item. Es el pedidoItemId de cambios y devoluciones.',
    example: 5001,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'Identificador del producto.',
    example: 1,
  })
  productoId: number;

  @ApiProperty({
    type: Number,
    description: 'Identificador de la variante comprada.',
    example: 102,
  })
  varianteId: number;

  @ApiProperty({
    type: String,
    description: 'Nombre del producto.',
    example: 'Vestido de lino blanco',
  })
  nombre: string;

  @ApiProperty({
    type: Number,
    description: 'Unidades compradas.',
    example: 1,
  })
  cantidad: number;

  @ApiProperty({
    type: Number,
    description: 'Precio unitario, en pesos chilenos.',
    example: 39990,
  })
  precioUnitario: number;

  @ApiProperty({
    type: Number,
    description: 'Precio unitario por cantidad, en pesos chilenos.',
    example: 39990,
  })
  subtotal: number;
}

/**
 * DTO de SALIDA.
 * Detalle de un pedido: el resumen mas sus items.
 */
export class PedidoDetalleResponseDto extends PedidoResponseDto {
  @ApiProperty({
    type: [PedidoItemResponseDto],
    description: 'Lineas del pedido.',
  })
  items: PedidoItemResponseDto[];
}
