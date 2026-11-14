import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TIPOS_SOLICITUD } from './cambio-devolucion.tipos';
import type { TipoSolicitud } from './cambio-devolucion.tipos';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  ValidateIf,
  ValidateBy,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO de ENTRADA.
 * Solicitud de cambio o devolucion de un item de un pedido.
 */
export class CrearCambioDevolucionDto {
  @ApiProperty({
    minimum: 1,
    type: Number,
    description:
      'Identificador del item, obtenido del detalle del pedido (items[].id).',
    example: 5001,
  })
  @IsInt()
  @IsPositive()
  pedidoItemId: number;

  @ApiProperty({
    enum: TIPOS_SOLICITUD,
    description: 'Tipo de solicitud: cambio o devolucion.',
    example: 'cambio',
  })
  @IsIn(TIPOS_SOLICITUD)
  tipo: TipoSolicitud;

  @ApiProperty({
    minLength: 1,
    type: String,
    description: 'Motivo de la solicitud.',
    example: 'La talla me quedo grande',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    minimum: 1,
    type: Number,
    description: 'Obligatoria para cambio. No se permite para devolucion.',
    minimum: 1,
    example: 101,
  })
  @ValidateIf(
    (datos: CrearCambioDevolucionDto) =>
      datos.tipo === 'cambio' || datos.nuevaVarianteId !== undefined,
  )
  @ValidateBy({
    name: 'varianteSoloParaCambio',
    validator: {
      validate: (_valor: unknown, args) =>
        (args?.object as CrearCambioDevolucionDto).tipo === 'cambio',
      defaultMessage: () => 'Una devolucion no admite nuevaVarianteId',
    },
  })
  @IsInt()
  @IsPositive()
  nuevaVarianteId?: number;

  @ApiProperty({
    minLength: 1,
    type: String,
    description: 'Forma en que el cliente entrega el producto.',
    example: 'retiro_domicilio',
  })
  @IsString()
  @IsNotEmpty()
  metodoEntrega: string;
}
