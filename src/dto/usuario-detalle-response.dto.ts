import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Perfil completo del usuario mostrado en Mi Cuenta. No expone la contrasena.
 */
export class UsuarioDetalleResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del usuario.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: 'Nombre del cliente.',
    example: 'Fernanda',
  })
  nombre: string;

  @ApiProperty({
    type: String,
    description: 'Apellido del cliente.',
    example: 'Rojas',
  })
  apellido: string;

  @ApiProperty({
    type: String,
    description: 'Correo electronico de la cuenta.',
    example: 'cliente@stylenow.cl',
  })
  email: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Telefono de contacto.',
    example: '+56912345678',
  })
  telefono?: string;
}
