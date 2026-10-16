import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Producto y variante que forman parte de un look.
 */
export class LookProductoResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del producto.',
    example: 1,
  })
  productoId: number;

  @ApiProperty({
    type: Number,
    description: 'Identificador de la variante elegida.',
    example: 101,
  })
  varianteId: number;
}

/**
 * DTO de SALIDA.
 * Look con sus productos y su precio total.
 */
export class LookResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del look.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: 'Nombre del look.',
    example: 'Look urbano',
  })
  nombre: string;

  @ApiProperty({
    type: [LookProductoResponseDto],
    description: 'Productos que componen el look.',
  })
  productos: LookProductoResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Suma de los precios de los productos, en pesos chilenos.',
    example: 89970,
  })
  precioTotal: number;
}
