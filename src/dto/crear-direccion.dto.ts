import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Direccion de despacho que el usuario agrega en Mi Cuenta.
 */
export class CrearDireccionDto {
  @ApiProperty({
    type: String,
    description: 'Nombre con que el usuario identifica la direccion.',
    example: 'Casa',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    type: String,
    description: 'Nombre de la calle.',
    example: 'Av. Providencia',
  })
  @IsString()
  @IsNotEmpty()
  calle: string;

  @ApiProperty({
    type: String,
    description: 'Numero de la direccion.',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Departamento, oficina o casa interior.',
    example: 'Depto 502',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departamento?: string;

  @ApiProperty({
    type: String,
    description: 'Comuna de despacho.',
    example: 'Providencia',
  })
  @IsString()
  @IsNotEmpty()
  comuna: string;

  @ApiProperty({
    type: String,
    description: 'Region de despacho.',
    example: 'Region Metropolitana',
  })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si es la direccion principal del usuario.',
    example: true,
  })
  @IsBoolean()
  principal: boolean;
}
