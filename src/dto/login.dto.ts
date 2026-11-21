import { LONGITUD_MAXIMA_CORREO } from '../dominio/limites-identidad';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Cuerpo del formulario "Iniciar sesion" del header.
 */
export class LoginDto {
  @ApiProperty({
    format: 'email',
    maxLength: LONGITUD_MAXIMA_CORREO,
    type: String,
    title: 'Correo electronico',
    description:
      'Correo electronico registrado previamente en POST /auth/registro.',
    example: 'cliente@stylenow.cl',
    required: true,
  })
  @IsEmail()
  @MaxLength(LONGITUD_MAXIMA_CORREO)
  correoElectronico!: string;

  @ApiProperty({
    minLength: 1,
    type: String,
    title: 'Contrasena',
    description: 'Contrasena de la cuenta.',
    example: 'StyleNow2026',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
