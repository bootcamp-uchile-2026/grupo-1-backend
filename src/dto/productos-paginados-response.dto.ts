import { ApiProperty } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto-response.dto';

/**
 * DTO de SALIDA.
 * Respuesta del catalogo. Devuelve la pagina pedida y los datos minimos
 * que el frontend necesita para pintar el paginador del listado.
 */
export class ProductosPaginadosResponseDto {
  @ApiProperty({
    type: [ProductoResponseDto],
    title: 'Productos',
    description: 'Productos de la pagina solicitada, ya filtrados y ordenados.',
    required: true,
  })
  productos: ProductoResponseDto[];

  @ApiProperty({
    type: Number,
    title: 'Pagina',
    description: 'Numero de pagina devuelta.',
    example: 1,
    required: true,
  })
  pagina: number;

  @ApiProperty({
    type: Number,
    title: 'Limite',
    description: 'Cantidad maxima de productos por pagina.',
    example: 12,
    required: true,
  })
  limite: number;

  @ApiProperty({
    type: Number,
    title: 'Total',
    description:
      'Cantidad total de productos que cumplen los filtros aplicados.',
    example: 8,
    required: true,
  })
  total: number;
}
