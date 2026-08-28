import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Categoria del menu principal y de la seccion "Categorias populares".
 */
export class CategoriaResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador',
    description: 'Identificador de la categoria.',
    example: 1,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre visible en el menu y en las tarjetas de la home.',
    example: 'Mujer',
    required: true,
  })
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Slug',
    description:
      'Valor que el frontend envia en GET /productos?categoria={slug}.',
    example: 'mujer',
    required: true,
  })
  slug: string;

  @ApiProperty({
    type: String,
    title: 'Imagen',
    description: 'Imagen de la tarjeta de la categoria.',
    example: 'https://cdn.stylenow.cl/categorias/mujer.jpg',
    required: true,
  })
  imagenUrl: string;

  @ApiProperty({
    type: Boolean,
    title: 'Destacada',
    description:
      'Indica si la categoria aparece en "Categorias populares" de la home.',
    example: true,
    required: true,
  })
  destacada: boolean;
}
