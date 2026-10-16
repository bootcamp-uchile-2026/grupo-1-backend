import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from '../dto/cambiar-contrasena.dto';
import { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';
import { UsuariosService } from '../services/usuarios.service';

/**
 * Recurso Usuarios.
 * Perfil de Mi Cuenta: consulta, edicion de datos y cambio de contrasena.
 */
@ApiTags('usuarios')
@ApiBadRequestResponse({
  description: 'La entrada no cumple el contrato del endpoint.',
})
@ApiParam({
  name: 'usuarioId',
  type: Number,
  description: 'Identificador del usuario.',
  example: 1,
})
@ApiNotFoundResponse({ description: 'No existe un usuario con ese id.' })
@Controller('usuarios/:usuarioId')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @ApiOperation({ summary: 'Obtiene el perfil del usuario' })
  @ApiOkResponse({
    description: 'Perfil obtenido correctamente.',
    type: UsuarioDetalleResponseDto,
  })
  @Get()
  async obtenerUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<UsuarioDetalleResponseDto> {
    return this.usuariosService.obtenerUsuario(usuarioId);
  }

  @ApiOperation({
    summary: 'Actualiza los datos del perfil',
    description:
      'Modifica solo los campos enviados. El correo electronico y la contrasena ' +
      'no se cambian por este endpoint.',
  })
  @ApiOkResponse({
    description: 'Perfil actualizado. Devuelve el perfil completo.',
    type: UsuarioDetalleResponseDto,
  })
  @Patch()
  async actualizarUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: ActualizarUsuarioDto,
  ): Promise<UsuarioDetalleResponseDto> {
    return this.usuariosService.actualizarUsuario(usuarioId, datos);
  }

  @ApiOperation({
    summary: 'Cambia la contrasena del usuario',
    description:
      'Verifica la contrasena actual y la reemplaza por la nueva; desde ese momento solo ' +
      'la nueva sirve para iniciar sesion. Responde 204 sin cuerpo: la contrasena nunca ' +
      'se devuelve y no hay otro dato del perfil que cambie.',
  })
  @ApiNoContentResponse({ description: 'Contrasena cambiada.' })
  @ApiBadRequestResponse({
    description:
      'Falta algun campo, la contrasena actual no es correcta o la nueva es igual a la ' +
      'actual.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('contrasena')
  async cambiarContrasena(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CambiarContrasenaDto,
  ): Promise<void> {
    await this.usuariosService.cambiarContrasena(usuarioId, datos);
  }
}
