import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de ENTRADA.
 * Cuerpo del selector de cantidad del carrito.
 */
export class ActualizarCantidadDto {
  @ApiProperty({
    type: Number,
    title: 'Cantidad',
    description:
      'Nueva cantidad de la linea del carrito. Debe ser mayor que cero.',
    example: 3,
    required: true,
  })
  cantidad: number;
}
