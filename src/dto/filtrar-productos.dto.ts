import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de ENTRADA.
 * Agrupa los filtros opcionales del catalogo que llegan como query params
 * en GET /productos. Todas las propiedades son opcionales: si no se envia
 * ninguna, el endpoint devuelve el catalogo completo paginado.
 */
export class FiltrarProductosDto {
  @ApiProperty({
    type: String,
    title: 'Texto buscado',
    description:
      'Texto libre del buscador del header. Busca en nombre y descripcion.',
    example: 'vestido',
    required: false,
  })
  search?: string;

  @ApiProperty({
    type: String,
    title: 'Categoria',
    description:
      'Slug de la categoria del catalogo, obtenido desde GET /categorias.',
    example: 'mujer',
    required: false,
  })
  categoria?: string;

  @ApiProperty({
    type: String,
    title: 'Talla',
    description: 'Talla disponible en alguna variante del producto.',
    example: 'M',
    required: false,
  })
  talla?: string;

  @ApiProperty({
    type: String,
    title: 'Color',
    description: 'Color disponible en alguna variante del producto.',
    example: 'Beige',
    required: false,
  })
  color?: string;

  @ApiProperty({
    type: Number,
    title: 'Precio minimo',
    description: 'Precio minimo en pesos chilenos, sin decimales.',
    example: 10000,
    required: false,
  })
  precioMin?: string;

  @ApiProperty({
    type: Number,
    title: 'Precio maximo',
    description: 'Precio maximo en pesos chilenos, sin decimales.',
    example: 40000,
    required: false,
  })
  precioMax?: string;

  @ApiProperty({
    type: Boolean,
    title: 'Solo novedades',
    description:
      'Cuando es true devuelve solo los productos de la nueva coleccion.',
    example: true,
    required: false,
  })
  novedad?: string;

  @ApiProperty({
    type: Boolean,
    title: 'Solo ofertas',
    description:
      'Cuando es true devuelve solo los productos con precio rebajado.',
    example: true,
    required: false,
  })
  oferta?: string;

  @ApiProperty({
    type: String,
    title: 'Orden del listado',
    description: 'Criterio de ordenamiento del catalogo.',
    example: 'precio_asc',
    enum: ['relevancia', 'precio_asc', 'precio_desc', 'nombre_asc'],
    required: false,
  })
  orden?: string;

  @ApiProperty({
    type: Number,
    title: 'Pagina',
    description: 'Numero de pagina solicitada. Comienza en 1.',
    example: 1,
    required: false,
  })
  pagina?: string;

  @ApiProperty({
    type: Number,
    title: 'Limite',
    description: 'Cantidad de productos por pagina. Maximo 50.',
    example: 12,
    required: false,
  })
  limite?: string;
}
