import { ApiProperty } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto-response.dto';
import { VarianteResponseDto } from './variante-response.dto';

/**
 * DTO de SALIDA.
 * Ficha completa del producto (PDP). Extiende la tarjeta del catalogo y
 * agrega solamente lo que el wireframe de la ficha muestra.
 */
export class ProductoDetalleResponseDto extends ProductoResponseDto {
  @ApiProperty({
    type: String,
    title: 'Descripcion',
    description: 'Texto descriptivo mostrado bajo el nombre del producto.',
    example: 'Vestido de lino de corte recto, ideal para primavera.',
    required: true,
  })
  descripcion: string;

  @ApiProperty({
    type: [String],
    title: 'Galeria de imagenes',
    description:
      'Imagenes del carrusel de la ficha. La primera es la principal.',
    example: [
      'https://cdn.stylenow.cl/productos/vestido-lino-1.jpg',
      'https://cdn.stylenow.cl/productos/vestido-lino-2.jpg',
    ],
    required: true,
  })
  imagenes: string[];

  @ApiProperty({
    type: Number,
    title: 'Calificacion',
    description:
      'Calificacion promedio mostrada con estrellas en la ficha. Va de 0 a 5.',
    example: 4.5,
    required: true,
  })
  calificacion: number;

  @ApiProperty({
    type: [String],
    title: 'Colores',
    description: 'Colores que se pintan en el selector de color de la ficha.',
    example: ['Beige', 'Negro'],
    required: true,
  })
  colores: string[];

  @ApiProperty({
    type: [String],
    title: 'Tallas',
    description: 'Tallas que se pintan en el selector de talla de la ficha.',
    example: ['S', 'M', 'L'],
    required: true,
  })
  tallas: string[];

  @ApiProperty({
    type: String,
    title: 'Guia de tallas',
    description:
      'Enlace de la guia de tallas que abre el link "Guia de tallas" de la ficha.',
    example: 'https://www.stylenow.cl/ayuda/guia-de-tallas',
    required: true,
  })
  guiaTallas: string;

  @ApiProperty({
    type: [VarianteResponseDto],
    title: 'Variantes',
    description:
      'Combinaciones de color y talla con su stock. El frontend usa el id de la variante ' +
      'elegida para agregar el producto al carrito.',
    required: true,
  })
  variantes: VarianteResponseDto[];
}
