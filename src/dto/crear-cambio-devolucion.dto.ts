import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TIPOS_SOLICITUD } from './cambio-devolucion.tipos';
import type { TipoSolicitud } from './cambio-devolucion.tipos';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO de ENTRADA.
 * Solicitud de cambio o devolucion de un item de un pedido.
 */
export class CrearCambioDevolucionDto {
  @ApiProperty({
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
    type: String,
    description: 'Motivo de la solicitud.',
    example: 'La talla me quedo grande',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Variante que se solicita cuando el tipo es cambio.',
    example: 101,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  nuevaVarianteId?: number;

  @ApiProperty({
    type: String,
    description: 'Forma en que el cliente entrega el producto.',
    example: 'retiro_domicilio',
  })
  @IsString()
  @IsNotEmpty()
  metodoEntrega: string;
}
