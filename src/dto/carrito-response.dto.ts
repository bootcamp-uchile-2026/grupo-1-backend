import { ApiProperty } from '@nestjs/swagger';
import { ItemCarritoResponseDto } from './item-carrito-response.dto';

/**
 * DTO de SALIDA.
 * Carrito completo y recalculado. Todos los endpoints del carrito devuelven
 * este mismo contrato para que el frontend refresque el icono del header
 * con una sola respuesta.
 */
export class CarritoResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de usuario',
    description: 'Usuario dueno del carrito.',
    example: 1,
    required: true,
  })
  usuarioId: number;

  @ApiProperty({
    type: [ItemCarritoResponseDto],
    title: 'Items',
    description: 'Lineas actuales del carrito. Puede venir vacio.',
    required: true,
  })
  items: ItemCarritoResponseDto[];

  @ApiProperty({
    type: Number,
    title: 'Cantidad total',
    description:
      'Suma de unidades del carrito. Es el numero del icono del header.',
    example: 3,
    required: true,
  })
  cantidadTotal: number;

  @ApiProperty({
    type: Number,
    title: 'Subtotal',
    description: 'Suma de los subtotales de las lineas, en pesos chilenos.',
    example: 89970,
    required: true,
  })
  subtotal: number;
}
