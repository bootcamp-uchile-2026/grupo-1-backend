import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Linea del carrito. Repite el nombre, la imagen, la talla y el color para
 * que el frontend pueda pintar el carrito sin volver a pedir el producto.
 */
export class ItemCarritoResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de producto',
    description:
      'Producto al que pertenece la linea. Permite volver a la ficha.',
    example: 1,
    required: true,
  })
  productoId: number;

  @ApiProperty({
    type: Number,
    title: 'Identificador de variante',
    description: 'Variante de la linea. Identifica la linea en PATCH y DELETE.',
    example: 101,
    required: true,
  })
  varianteId: number;

  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre del producto.',
    example: 'Vestido de lino',
    required: true,
  })
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Imagen',
    description: 'Imagen del producto mostrada en la linea del carrito.',
    example: 'https://cdn.stylenow.cl/productos/vestido-lino.jpg',
    required: true,
  })
  imagenUrl: string;

  @ApiProperty({
    type: String,
    title: 'Talla',
    description: 'Talla elegida en la ficha.',
    example: 'M',
    required: true,
  })
  talla: string;

  @ApiProperty({
    type: String,
    title: 'Color',
    description: 'Color elegido en la ficha.',
    example: 'Beige',
    required: true,
  })
  color: string;

  @ApiProperty({
    type: Number,
    title: 'Precio unitario',
    description:
      'Precio del producto en pesos chilenos al momento de la consulta.',
    example: 29990,
    required: true,
  })
  precioUnitario: number;

  @ApiProperty({
    type: Number,
    title: 'Cantidad',
    description: 'Unidades de esta variante en el carrito.',
    example: 2,
    required: true,
  })
  cantidad: number;

  @ApiProperty({
    type: Number,
    title: 'Subtotal',
    description:
      'Precio unitario multiplicado por la cantidad. Lo calcula el backend.',
    example: 59980,
    required: true,
  })
  subtotal: number;
}
