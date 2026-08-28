import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Combinacion concreta de color y talla de un producto.
 * Existe porque la ficha obliga a elegir color y talla antes de agregar
 * al carrito, y el carrito necesita saber que combinacion se agrego.
 */
export class VarianteResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de variante',
    description:
      'Identificador que se envia en POST /usuarios/{usuarioId}/carrito/items.',
    example: 101,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Color',
    description: 'Color de la variante.',
    example: 'Beige',
    required: true,
  })
  color: string;

  @ApiProperty({
    type: String,
    title: 'Talla',
    description: 'Talla de la variante.',
    example: 'M',
    required: true,
  })
  talla: string;

  @ApiProperty({
    type: Number,
    title: 'Stock',
    description: 'Unidades disponibles en memoria para esta combinacion.',
    example: 8,
    required: true,
  })
  stock: number;
}
