import {
  aPedidoRespuesta,
  aPedidoResumenRespuesta,
  aPedidoItemRespuesta,
} from './respuestas.mapper';
import { Injectable } from '@nestjs/common';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { CrearPedidoDto } from '../dto/crear-pedido.dto';
import {
  PedidoDetalleResponseDto,
  PedidoItemResponseDto,
} from '../dto/pedido-detalle-response.dto';
import { PedidoResponseDto } from '../dto/pedido-response.dto';
import { PedidosRepository } from '../repositorios/pedidos.repository';
import { UsuariosService } from './usuarios.service';

/**
 * Pedidos del usuario.
 * Un pedido que no es del usuario de la ruta se trata igual que uno
 * inexistente (404), para no revelar pedidos ajenos.
 */
@Injectable()
export class PedidosService {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly usuariosService: UsuariosService,
  ) {}

  /** Confirma pedido, detalle, inventario y vaciado en la transaccion SQL. */
  async crearPedido(
    datos: CrearPedidoDto,
    usuarioAutenticado: number,
    clave?: string,
  ): Promise<PedidoDetalleResponseDto> {
    return aPedidoRespuesta(
      await this.pedidos.confirmarCheckout(datos, usuarioAutenticado, clave),
    );
  }

  /** Devuelve el resumen de los pedidos del usuario. */
  async obtenerPedidos(usuarioId: number): Promise<PedidoResponseDto[]> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const pedidos = await this.pedidos.listarPorUsuario(usuarioId);
    return pedidos.map(aPedidoResumenRespuesta);
  }

  /** Devuelve el detalle de un pedido del usuario, con sus items. */
  async obtenerPedido(
    usuarioId: number,
    pedidoId: number,
  ): Promise<PedidoDetalleResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const pedido = await this.pedidos.buscarDeUsuario(usuarioId, pedidoId);
    if (!pedido) {
      throw new RecursoNoEncontradoError(
        `No existe el pedido con id ${pedidoId}`,
      );
    }
    return aPedidoRespuesta(pedido);
  }

  /**
   * Devuelve un item comprobando la cadena usuario -> pedido -> item.
   * Lo usa CambiosDevolucionesService antes de registrar una solicitud.
   */
  async obtenerItemDePedido(
    usuarioId: number,
    pedidoId: number,
    pedidoItemId: number,
  ): Promise<PedidoItemResponseDto> {
    const pedido = await this.obtenerPedido(usuarioId, pedidoId);
    const item = pedido.items.find((linea) => linea.id === pedidoItemId);
    if (!item) {
      throw new RecursoNoEncontradoError(
        `El pedido ${pedidoId} no tiene el item ${pedidoItemId}`,
      );
    }
    return aPedidoItemRespuesta(item);
  }
}
