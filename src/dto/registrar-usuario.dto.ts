import { LONGITUD_MAXIMA_CORREO } from '../dominio/limites-identidad';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Cuerpo del formulario "Crear cuenta" del header.
 */
export class RegistrarUsuarioDto {
  @ApiProperty({
    minLength: 1,
    type: String,
    title: 'Nombre',
    description: 'Nombre con el que se saluda al cliente en la tienda.',
    example: 'Fernanda Rojas',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({
    format: 'email',
    maxLength: LONGITUD_MAXIMA_CORREO,
    type: String,
    title: 'Correo electronico',
    description:
      'Correo electronico del cliente. Se usa como identificador unico de la cuenta.',
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
    description:
      'Contrasena elegida por el cliente. Se almacena un hash scrypt con sal aleatoria. ' +
      'La contrasena en claro nunca se devuelve.',
    example: 'StyleNow2026',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
