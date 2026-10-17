import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Cuerpo del formulario "Crear cuenta" del header.
 */
export class RegistrarUsuarioDto {
  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre con el que se saluda al cliente en la tienda.',
    example: 'Fernanda Rojas',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Correo electronico',
    description:
      'Correo electronico del cliente. Se usa como identificador unico de la cuenta.',
    example: 'cliente@stylenow.cl',
    required: true,
  })
  @IsEmail()
  correoElectronico: string;

  @ApiProperty({
    type: String,
    title: 'Contrasena',
    description:
      'Contrasena elegida por el cliente. En la fase dummy de Hito 2 se guarda en memoria ' +
      'y no se aplica hashing. Nunca se devuelve.',
    example: 'StyleNow2026',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
