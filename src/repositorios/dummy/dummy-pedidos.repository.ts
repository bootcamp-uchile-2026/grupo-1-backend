import { Injectable } from '@nestjs/common';
import { PEDIDOS_DUMMY, PedidoDummy } from '../../data/pedidos.dummy';
import { PedidoDetalleResponseDto } from '../../dto/pedido-detalle-response.dto';
import {
  NuevoPedido,
  PedidosRepository,
  SnapshotCheckout,
} from '../pedidos.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

/**
 * Pedidos en memoria. Parte de los fixtures y agrega los pedidos que crea
 * el checkout. Los ids siguen al mayor existente y se asignan sin await,
 * por lo que dos creaciones nunca reciben el mismo id.
 */
@Injectable()
export class DummyPedidosRepository
  extends PedidosRepository
  implements RepositorioReiniciable
{
  private pedidos: PedidoDummy[] = [];
  private siguientePedidoId = 0;
  private siguienteItemId = 0;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.pedidos = copiar(PEDIDOS_DUMMY);
    this.siguientePedidoId =
      Math.max(0, ...this.pedidos.map(({ pedido }) => pedido.id)) + 1;
    this.siguienteItemId =
      Math.max(
        0,
        ...this.pedidos.flatMap(({ pedido }) =>
          pedido.items.map((item) => item.id),
        ),
      ) + 1;
  }

  listarPorUsuario(usuarioId: number): Promise<PedidoDetalleResponseDto[]> {
    return Promise.resolve(
      this.pedidos
        .filter((item) => item.usuarioId === usuarioId)
        .map((item) => copiar(item.pedido)),
    );
  }

  buscarDeUsuario(
    usuarioId: number,
    pedidoId: number,
  ): Promise<PedidoDetalleResponseDto | null> {
    const encontrado = this.pedidos.find(
      (item) => item.usuarioId === usuarioId && item.pedido.id === pedidoId,
    );
    return Promise.resolve(encontrado ? copiar(encontrado.pedido) : null);
  }

  crear(datos: NuevoPedido): Promise<PedidoDetalleResponseDto> {
    const id = this.siguientePedidoId;
    this.siguientePedidoId += 1;
    const pedido: PedidoDetalleResponseDto = {
      id,
      numeroPedido: `SN-${datos.fecha.slice(0, 4)}-${id}`,
      estado: datos.estado,
      fecha: datos.fecha,
      subtotal: datos.subtotal,
      costoEnvio: datos.costoEnvio,
      total: datos.total,
      metodoPago: datos.metodoPago,
      items: datos.items.map((item) => {
        const itemId = this.siguienteItemId;
        this.siguienteItemId += 1;
        return { id: itemId, ...copiar(item) };
      }),
    };
    this.pedidos.push({
      usuarioId: datos.usuarioId,
      pedido,
      checkout: copiar(datos.checkout),
    });
    return Promise.resolve(copiar(pedido));
  }

  /** Compensacion acotada: no toca fixtures ni reutiliza ids asignados. */
  eliminarCreado(usuarioId: number, pedidoId: number): Promise<boolean> {
    const posicion = this.pedidos.findIndex(
      (item) =>
        item.usuarioId === usuarioId &&
        item.pedido.id === pedidoId &&
        item.checkout !== undefined,
    );
    if (posicion === -1) return Promise.resolve(false);
    this.pedidos.splice(posicion, 1);
    return Promise.resolve(true);
  }

  /** Solo para tests: copia del checkout guardado con un pedido. */
  snapshotDe(pedidoId: number): SnapshotCheckout | undefined {
    const encontrado = this.pedidos.find((item) => item.pedido.id === pedidoId);
    return encontrado?.checkout ? copiar(encontrado.checkout) : undefined;
  }
}
