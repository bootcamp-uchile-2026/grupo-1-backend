import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Datos publicos de la cuenta. No expone la contrasena.
 */
export class UsuarioResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador',
    description:
      'Identificador del usuario. Se usa en las rutas de carrito y favoritos.',
    example: 1,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre del cliente mostrado en el header.',
    example: 'Fernanda Rojas',
    required: true,
  })
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Correo electronico',
    description: 'Correo electronico de la cuenta.',
    example: 'cliente@stylenow.cl',
    required: true,
  })
  correoElectronico: string;
}
