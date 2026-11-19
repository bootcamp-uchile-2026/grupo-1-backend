import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from './usuario-response.dto';

/**
 * DTO de SALIDA.
 * Resultado del inicio de sesion. Desde H3-P2 agrega el JWT (campos nuevos,
 * aditivos): mensaje y usuario conservan la forma de Hito 2.
 */
export class AuthResponseDto {
  @ApiProperty({
    type: String,
    title: 'Mensaje',
    description: 'Texto de confirmacion del inicio de sesion.',
    example: 'Inicio de sesion correcto',
    required: true,
  })
  mensaje!: string;

  @ApiProperty({
    type: UsuarioResponseDto,
    title: 'Usuario',
    description: 'Datos publicos del usuario autenticado, sin la contrasena.',
    required: true,
  })
  usuario!: UsuarioResponseDto;

  @ApiProperty({
    type: String,
    title: 'Token de acceso',
    description:
      'JWT HS256 firmado por el servidor. Enviar como Authorization: Bearer <token> ' +
      'en las rutas de usuario. Expira segun expiraEnSegundos.',
    required: true,
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    enum: ['Bearer'],
    title: 'Tipo de token',
    example: 'Bearer',
    required: true,
  })
  tipoToken!: 'Bearer';

  @ApiProperty({
    type: Number,
    title: 'Vigencia en segundos',
    example: 3600,
    required: true,
  })
  expiraEnSegundos!: number;
}
