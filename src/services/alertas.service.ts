import { Injectable } from '@nestjs/common';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { AlertaResponseDto } from '../dto/alerta-response.dto';
import { CrearAlertaPrecioDto } from '../dto/crear-alerta-precio.dto';
import { CrearAvisoReposicionDto } from '../dto/crear-aviso-reposicion.dto';
import { AlertasRepository } from '../repositorios/alertas.repository';
import { ProductosService } from './productos.service';
import { UsuariosService } from './usuarios.service';

/**
 * Alertas de precio y avisos de reposicion del usuario.
 * Solo registra el contrato: no envia notificaciones ni programa tareas.
 * Toda alerta referencia un producto (y variante, si se indica) que existe
 * en el catalogo.
 */
@Injectable()
export class AlertasService {
  constructor(
    private readonly alertas: AlertasRepository,
    private readonly usuariosService: UsuariosService,
    private readonly productosService: ProductosService,
  ) {}

  /** Devuelve las alertas registradas por el usuario. */
  async obtenerAlertas(usuarioId: number): Promise<AlertaResponseDto[]> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    return this.alertas.listarPorUsuario(usuarioId);
  }

  /** Registra una alerta de baja de precio sobre un producto del catalogo. */
  async crearAlertaPrecio(
    usuarioId: number,
    datos: CrearAlertaPrecioDto,
  ): Promise<AlertaResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const producto = await this.productosService.obtenerProductoPorId(
      datos.productoId,
    );
    return this.alertas.crear(usuarioId, {
      tipo: 'precio',
      productoId: producto.id,
      precioObjetivo: datos.precioObjetivo ?? undefined,
      estado: 'activa',
    });
  }

  /**
   * Registra un aviso de reposicion.
   * Sin varianteId el aviso vale para cualquier variante del producto; con
   * varianteId, la variante debe pertenecer a ese producto.
   */
  async crearAvisoReposicion(
    usuarioId: number,
    datos: CrearAvisoReposicionDto,
  ): Promise<AlertaResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const producto = await this.productosService.obtenerProductoPorId(
      datos.productoId,
    );
    if (datos.varianteId !== undefined && datos.varianteId !== null) {
      await this.productosService.obtenerVarianteDeProducto(
        producto.id,
        datos.varianteId,
      );
    }
    return this.alertas.crear(usuarioId, {
      tipo: 'reposicion',
      productoId: producto.id,
      varianteId: datos.varianteId ?? undefined,
      estado: 'activa',
    });
  }

  /** Elimina una alerta del usuario. */
  async eliminarAlerta(usuarioId: number, alertaId: number): Promise<void> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const eliminada = await this.alertas.eliminar(usuarioId, alertaId);
    if (!eliminada) {
      throw new RecursoNoEncontradoError(
        `No existe la alerta con id ${alertaId}`,
      );
    }
  }
}
