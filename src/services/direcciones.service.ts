import { Injectable } from '@nestjs/common';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { ActualizarDireccionDto } from '../dto/actualizar-direccion.dto';
import { CrearDireccionDto } from '../dto/crear-direccion.dto';
import { DireccionResponseDto } from '../dto/direccion-response.dto';
import { DireccionesRepository } from '../repositorios/direcciones.repository';
import { UsuariosService } from './usuarios.service';

/**
 * Direcciones de despacho del usuario.
 * Una direccion de otro usuario se trata igual que una inexistente (404).
 */
@Injectable()
export class DireccionesService {
  constructor(
    private readonly direcciones: DireccionesRepository,
    private readonly usuariosService: UsuariosService,
  ) {}

  /** Devuelve las direcciones guardadas por el usuario. */
  async obtenerDirecciones(usuarioId: number): Promise<DireccionResponseDto[]> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    return this.direcciones.listarPorUsuario(usuarioId);
  }

  /** Registra una direccion nueva del usuario. */
  async crearDireccion(
    usuarioId: number,
    datos: CrearDireccionDto,
  ): Promise<DireccionResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    return this.direcciones.crear(usuarioId, {
      nombre: datos.nombre,
      calle: datos.calle,
      numero: datos.numero,
      departamento: datos.departamento ?? undefined,
      comuna: datos.comuna,
      region: datos.region,
      principal: datos.principal,
    });
  }

  /** Aplica los campos recibidos y devuelve la direccion actualizada. */
  async actualizarDireccion(
    usuarioId: number,
    direccionId: number,
    datos: ActualizarDireccionDto,
  ): Promise<DireccionResponseDto> {
    const direccion = await this.buscarDireccion(usuarioId, direccionId);
    const actualizada = await this.direcciones.actualizar(usuarioId, {
      ...direccion,
      nombre: datos.nombre ?? direccion.nombre,
      calle: datos.calle ?? direccion.calle,
      numero: datos.numero ?? direccion.numero,
      departamento: datos.departamento ?? direccion.departamento,
      comuna: datos.comuna ?? direccion.comuna,
      region: datos.region ?? direccion.region,
      principal: datos.principal ?? direccion.principal,
    });
    if (!actualizada) throw this.noExiste(direccionId);
    return actualizada;
  }

  /** Elimina una direccion del usuario. */
  async eliminarDireccion(
    usuarioId: number,
    direccionId: number,
  ): Promise<void> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const eliminada = await this.direcciones.eliminar(usuarioId, direccionId);
    if (!eliminada) throw this.noExiste(direccionId);
  }

  private async buscarDireccion(
    usuarioId: number,
    direccionId: number,
  ): Promise<DireccionResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const direccion = await this.direcciones.buscarDeUsuario(
      usuarioId,
      direccionId,
    );
    if (!direccion) throw this.noExiste(direccionId);
    return direccion;
  }

  private noExiste(direccionId: number): RecursoNoEncontradoError {
    return new RecursoNoEncontradoError(
      `No existe la direccion con id ${direccionId}`,
    );
  }
}
