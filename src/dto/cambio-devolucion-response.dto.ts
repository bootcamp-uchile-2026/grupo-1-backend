import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ESTADOS_SOLICITUD, TIPOS_SOLICITUD } from './cambio-devolucion.tipos';
import type { EstadoSolicitud, TipoSolicitud } from './cambio-devolucion.tipos';

/**
 * DTO de SALIDA.
 * Solicitud de cambio o devolucion registrada.
 */
export class CambioDevolucionResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador de la solicitud.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'Identificador del pedido asociado.',
    example: 1001,
  })
  pedidoId: number;

  @ApiProperty({
    type: Number,
    description: 'Identificador del item del pedido.',
    example: 5001,
  })
  pedidoItemId: number;

  @ApiProperty({
    enum: TIPOS_SOLICITUD,
    description: 'Tipo de solicitud: cambio o devolucion.',
    example: 'cambio',
  })
  tipo: TipoSolicitud;

  @ApiProperty({
    enum: ESTADOS_SOLICITUD,
    description: 'Estado actual de la solicitud.',
    example: 'solicitada',
  })
  estado: EstadoSolicitud;

  @ApiProperty({
    type: String,
    description: 'Motivo de la solicitud.',
    example: 'La talla me quedo grande',
  })
  motivo: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Variante solicitada. Solo cuando el tipo es cambio.',
    example: 101,
  })
  nuevaVarianteId?: number;

  @ApiProperty({
    type: String,
    description: 'Forma en que el cliente entrega el producto.',
    example: 'retiro_domicilio',
  })
  metodoEntrega: string;

  @ApiProperty({
    type: String,
    description: 'Fecha de la solicitud en formato ISO 8601.',
    example: '2026-10-06T12:00:00.000Z',
  })
  fechaSolicitud: string;
}
