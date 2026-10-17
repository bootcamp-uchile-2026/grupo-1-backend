import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ESTADOS_ALERTA, TIPOS_ALERTA } from './alerta.tipos';
import type { EstadoAlerta, TipoAlerta } from './alerta.tipos';

/**
 * DTO de SALIDA.
 * Alerta de precio o aviso de reposicion registrado.
 */
export class AlertaResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador de la alerta.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    enum: TIPOS_ALERTA,
    description: 'Tipo de alerta: precio o reposicion.',
    example: 'precio',
  })
  tipo: TipoAlerta;

  @ApiProperty({
    type: Number,
    description: 'Identificador del producto.',
    example: 1,
  })
  productoId: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Variante (color y talla) esperada. Solo en avisos de reposicion.',
    example: 103,
  })
  varianteId?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Precio desde el cual se avisa, en pesos chilenos. Solo en alertas de precio.',
    example: 29990,
  })
  precioObjetivo?: number;

  @ApiProperty({
    enum: ESTADOS_ALERTA,
    description: 'Estado actual de la alerta.',
    example: 'activa',
  })
  estado: EstadoAlerta;
}
