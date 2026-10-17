import { Injectable } from '@nestjs/common';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from '../dto/cambiar-contrasena.dto';
import { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import {
  NuevoUsuario,
  UsuariosRepository,
} from '../repositorios/usuarios.repository';

/**
 * Perfil del usuario (Mi Cuenta).
 * Los datos vienen de UsuariosRepository; este servicio decide que es un
 * usuario inexistente y aplica las reglas del perfil.
 */
@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly credenciales: CredencialesRepository,
  ) {}

  /**
   * Devuelve el perfil del usuario.
   * Los demas servicios lo usan para comprobar que el usuario de la ruta existe.
   */
  async obtenerUsuario(usuarioId: number): Promise<UsuarioDetalleResponseDto> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) {
      throw new RecursoNoEncontradoError(
        `No existe el usuario con id ${usuarioId}`,
      );
    }
    return usuario;
  }

  /** Aplica los campos recibidos y devuelve el perfil actualizado. */
  async actualizarUsuario(
    usuarioId: number,
    datos: ActualizarUsuarioDto,
  ): Promise<UsuarioDetalleResponseDto> {
    const usuario = await this.obtenerUsuario(usuarioId);
    const actualizado = await this.usuarios.actualizar(usuarioId, {
      nombre: datos.nombre ?? usuario.nombre,
      apellido: datos.apellido ?? usuario.apellido,
      telefono: datos.telefono ?? usuario.telefono,
    });
    if (!actualizado) {
      throw new RecursoNoEncontradoError(
        `No existe el usuario con id ${usuarioId}`,
      );
    }
    return actualizado;
  }

  /** Crea el perfil de un usuario nuevo. Lo usa el registro. */
  async crearUsuario(datos: NuevoUsuario): Promise<UsuarioDetalleResponseDto> {
    return this.usuarios.crear(datos);
  }

  /**
   * Cambia la contrasena guardada del usuario.
   * La nueva debe ser distinta de la actual, y la actual debe coincidir con
   * la credencial guardada. Desde ese momento solo la nueva sirve para
   * iniciar sesion.
   */
  async cambiarContrasena(
    usuarioId: number,
    datos: CambiarContrasenaDto,
  ): Promise<void> {
    await this.obtenerUsuario(usuarioId);
    if (datos.contrasenaNueva === datos.contrasenaActual) {
      throw new ReglaNegocioError(
        'La contrasena nueva debe ser distinta de la actual',
      );
    }
    const credencial = await this.credenciales.buscarPorUsuario(usuarioId);
    if (!credencial) {
      throw new RecursoNoEncontradoError(
        `El usuario ${usuarioId} no tiene credenciales`,
      );
    }
    if (credencial.contrasena !== datos.contrasenaActual) {
      throw new ReglaNegocioError('La contrasena actual no es correcta');
    }
    await this.credenciales.actualizarContrasena(
      usuarioId,
      datos.contrasenaNueva,
    );
  }
}
