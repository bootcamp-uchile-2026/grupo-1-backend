import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from './usuario-response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'Inicio de sesion exitoso' })
  mensaje: string;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
