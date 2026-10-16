import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Estado de seguimiento de un pedido.
 */
export class PedidoSeguimientoResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del pedido.',
    example: 1,
  })
  pedidoId: number;

  @ApiProperty({
    type: String,
    description: 'Estado actual del pedido.',
    example: 'en_camino',
  })
  estado: string;

  @ApiProperty({
    type: String,
    description: 'Fecha del ultimo cambio de estado en formato ISO 8601.',
    example: '2026-10-05T10:00:00.000Z',
  })
  fechaActualizacion: string;
}
