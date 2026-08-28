import { ApiProperty } from '@nestjs/swagger';

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
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Correo electronico',
    description:
      'Correo electronico del cliente. Se usa como identificador unico de la cuenta.',
    example: 'cliente@stylenow.cl',
    required: true,
  })
  correoElectronico: string;

  @ApiProperty({
    type: String,
    title: 'Contrasena',
    description:
      'Contrasena elegida por el cliente. En Hito 1 se guarda en memoria y no se aplica hashing.',
    example: 'StyleNow2026',
    required: true,
  })
  contrasena: string;
}
