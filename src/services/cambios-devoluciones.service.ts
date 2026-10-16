import { Injectable } from '@nestjs/common';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import { CambioDevolucionResponseDto } from '../dto/cambio-devolucion-response.dto';
import { CrearCambioDevolucionDto } from '../dto/crear-cambio-devolucion.dto';
import { CambiosDevolucionesRepository } from '../repositorios/cambios-devoluciones.repository';
import { PedidosService } from './pedidos.service';
import { ProductosService } from './productos.service';

/**
 * Solicitudes de cambio y devolucion sobre los items de un pedido.
 * Valida la cadena usuario -> pedido -> item -> producto -> variante.
 * Todavia no aplica plazos de devolucion, reembolsos ni movimientos de stock.
 */
@Injectable()
export class CambiosDevolucionesService {
  constructor(
    private readonly solicitudes: CambiosDevolucionesRepository,
    private readonly pedidosService: PedidosService,
    private readonly productosService: ProductosService,
  ) {}

  /** Registra una solicitud nueva, que siempre nace en estado solicitada. */
  async crearSolicitud(
    usuarioId: number,
    pedidoId: number,
    datos: CrearCambioDevolucionDto,
  ): Promise<CambioDevolucionResponseDto> {
    const item = await this.pedidosService.obtenerItemDePedido(
      usuarioId,
      pedidoId,
      datos.pedidoItemId,
    );
    const nuevaVarianteId = datos.nuevaVarianteId ?? undefined;

    if (datos.tipo === 'devolucion' && nuevaVarianteId !== undefined) {
      throw new ReglaNegocioError('Una devolucion no admite nuevaVarianteId');
    }
    if (datos.tipo === 'cambio') {
      if (nuevaVarianteId === undefined) {
        throw new ReglaNegocioError('Un cambio requiere nuevaVarianteId');
      }
      if (nuevaVarianteId === item.varianteId) {
        throw new ReglaNegocioError(
          'nuevaVarianteId debe ser distinta de la variante comprada',
        );
      }
      await this.productosService.obtenerVarianteDeProducto(
        item.productoId,
        nuevaVarianteId,
      );
    }

    return this.solicitudes.crear({
      pedidoId,
      pedidoItemId: item.id,
      tipo: datos.tipo,
      estado: 'solicitada',
      motivo: datos.motivo,
      nuevaVarianteId,
      metodoEntrega: datos.metodoEntrega,
    });
  }

  /** Devuelve las solicitudes asociadas a un pedido del usuario. */
  async obtenerSolicitudesDePedido(
    usuarioId: number,
    pedidoId: number,
  ): Promise<CambioDevolucionResponseDto[]> {
    const pedido = await this.pedidosService.obtenerPedido(usuarioId, pedidoId);
    return this.solicitudes.listarPorPedido(pedido.id);
  }

  /**
   * Devuelve el detalle de una solicitud del usuario.
   * La solicitud es suya si lo es el pedido al que pertenece.
   */
  async obtenerSolicitud(
    usuarioId: number,
    solicitudId: number,
  ): Promise<CambioDevolucionResponseDto> {
    const pedidosDelUsuario = (
      await this.pedidosService.obtenerPedidos(usuarioId)
    ).map((pedido) => pedido.id);
    const solicitud = await this.solicitudes.buscarPorId(solicitudId);
    if (!solicitud || !pedidosDelUsuario.includes(solicitud.pedidoId)) {
      throw new RecursoNoEncontradoError(
        `No existe la solicitud con id ${solicitudId}`,
      );
    }
    return solicitud;
  }
}
