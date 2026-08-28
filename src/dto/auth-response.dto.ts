import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from './usuario-response.dto';

/**
 * DTO de SALIDA.
 * Resultado del inicio de sesion. En Hito 1 no se devuelve ningun token
 * porque JWT esta fuera del alcance.
 */
export class AuthResponseDto {
  @ApiProperty({
    type: String,
    title: 'Mensaje',
    description: 'Texto de confirmacion del inicio de sesion.',
    example: 'Inicio de sesion correcto',
    required: true,
  })
  mensaje: string;

  @ApiProperty({
    type: UsuarioResponseDto,
    title: 'Usuario',
    description: 'Datos publicos del usuario autenticado, sin la contrasena.',
    required: true,
  })
  usuario: UsuarioResponseDto;
}
