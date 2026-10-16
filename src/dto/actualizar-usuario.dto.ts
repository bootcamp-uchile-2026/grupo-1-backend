import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Datos editables del perfil en Mi Cuenta. Todos los campos son opcionales.
 */
export class ActualizarUsuarioDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Nombre del cliente.',
    example: 'Fernanda',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Apellido del cliente.',
    example: 'Rojas',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  apellido?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Telefono de contacto.',
    example: '+56912345678',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  telefono?: string;
}
