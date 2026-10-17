import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Resumen de un pedido para el listado de Mis Pedidos.
 */
export class PedidoResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del pedido.',
    example: 1001,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: 'Numero de pedido visible para el cliente.',
    example: 'SN-2026-1001',
  })
  numeroPedido: string;

  @ApiProperty({
    type: String,
    description: 'Estado actual del pedido.',
    example: 'confirmado',
  })
  estado: string;

  @ApiProperty({
    type: String,
    description: 'Fecha de creacion del pedido en formato ISO 8601.',
    example: '2026-10-04T15:30:00.000Z',
  })
  fecha: string;

  @ApiProperty({
    type: Number,
    description: 'Suma de los items, en pesos chilenos.',
    example: 39990,
  })
  subtotal: number;

  @ApiProperty({
    type: Number,
    description: 'Costo de despacho, en pesos chilenos.',
    example: 0,
  })
  costoEnvio: number;

  @ApiProperty({
    type: Number,
    description: 'Total pagado, en pesos chilenos.',
    example: 39990,
  })
  total: number;

  @ApiProperty({
    type: String,
    description: 'Metodo de pago utilizado.',
    example: 'webpay',
  })
  metodoPago: string;
}
