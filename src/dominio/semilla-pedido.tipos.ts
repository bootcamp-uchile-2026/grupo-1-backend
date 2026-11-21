import type { Pedido, SnapshotCheckout } from './modelos';

/** Forma del snapshot historico de pedidos; no almacena ni crea datos. */
export interface PedidoSemillaHistorica {
  usuarioId: number;
  pedido: Omit<Pedido, 'usuarioId' | 'checkout'>;
  checkout?: SnapshotCheckout;
}
