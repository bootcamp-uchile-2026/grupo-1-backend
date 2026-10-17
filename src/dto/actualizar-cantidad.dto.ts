import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

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
  @IsInt()
  @IsPositive()
  cantidad: number;
}
