import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Cambio de contrasena desde Mi Cuenta.
 */
export class CambiarContrasenaDto {
  @ApiProperty({
    type: String,
    description: 'Contrasena vigente de la cuenta.',
    example: 'StyleNow2026',
  })
  @IsString()
  @IsNotEmpty()
  contrasenaActual: string;

  @ApiProperty({
    type: String,
    description: 'Contrasena que reemplaza a la actual.',
    example: 'StyleNow2027',
  })
  @IsString()
  @IsNotEmpty()
  contrasenaNueva: string;
}