import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Datos minimos que necesita una tarjeta de producto del catalogo.
 * No incluye descripcion, galeria ni variantes para no enviar informacion
 * que el listado no muestra.
 */
export class ProductoResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador',
    description:
      'Identificador del producto. Se usa para abrir la ficha en GET /productos/{id}.',
    example: 1,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre comercial del producto.',
    example: 'Vestido de lino',
    required: true,
  })
  nombre: string;

  @ApiProperty({
    type: Number,
    title: 'Precio',
    description: 'Precio vigente en pesos chilenos, sin decimales.',
    example: 29990,
    required: true,
  })
  precio: number;

  @ApiProperty({
    type: String,
    title: 'Imagen principal',
    description: 'Imagen que se muestra en la tarjeta del catalogo.',
    example: 'https://cdn.stylenow.cl/productos/vestido-lino.jpg',
    required: true,
  })
  imagenUrl: string;

  @ApiProperty({
    type: String,
    title: 'Categoria',
    description: 'Slug de la categoria a la que pertenece el producto.',
    example: 'mujer',
    required: true,
  })
  categoria: string;

  @ApiProperty({
    type: Boolean,
    title: 'Novedad',
    description:
      'Indica si el producto forma parte de la nueva coleccion de la home.',
    example: true,
    required: true,
  })
  novedad: boolean;

  @ApiProperty({
    type: Boolean,
    title: 'Oferta',
    description: 'Indica si el producto aparece en la seccion Ofertas.',
    example: false,
    required: true,
  })
  oferta: boolean;
}
