import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Direccion de despacho guardada por el usuario.
 */
export class DireccionResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador de la direccion.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: 'Nombre con que el usuario identifica la direccion.',
    example: 'Casa',
  })
  nombre: string;

  @ApiProperty({
    type: String,
    description: 'Nombre de la calle.',
    example: 'Av. Providencia',
  })
  calle: string;

  @ApiProperty({
    type: String,
    description: 'Numero de la direccion.',
    example: '1234',
  })
  numero: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Departamento, oficina o casa interior.',
    example: 'Depto 502',
  })
  departamento?: string;

  @ApiProperty({
    type: String,
    description: 'Comuna de despacho.',
    example: 'Providencia',
  })
  comuna: string;

  @ApiProperty({
    type: String,
    description: 'Region de despacho.',
    example: 'Region Metropolitana',
  })
  region: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si es la direccion principal del usuario.',
    example: true,
  })
  principal: boolean;
}
