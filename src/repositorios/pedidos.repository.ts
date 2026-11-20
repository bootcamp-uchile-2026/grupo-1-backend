import type { Pedido, PedidoItem, SnapshotCheckout } from '../dominio/modelos';

export type {
  ContactoCheckout,
  DireccionCheckout,
  SnapshotCheckout,
} from '../dominio/modelos';
/** Linea de un pedido nuevo. El repositorio le asigna su id. */
export type NuevoPedidoItem = Omit<PedidoItem, 'id'>;

/**
 * Pedido calculado por el checkout transaccional. El repositorio le asigna
 * id, numeroPedido e ids de items, y lo guarda.
 */
export interface NuevoPedido {
  usuarioId: number;
  estado: string;
  fecha: string;
  subtotal: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
  items: NuevoPedidoItem[];
  checkout: SnapshotCheckout;
}

export interface CheckoutPersistencia extends SnapshotCheckout {
  carritoId: number;
  metodoPago: string;
  direccionId?: number;
}

/** Acceso a los pedidos. Toda lectura se limita al usuario indicado. */
export abstract class PedidosRepository {
  abstract confirmarCheckout(
    datos: CheckoutPersistencia,
    usuarioId: number,
    clave?: string,
  ): Promise<Pedido>;
  abstract listarPorUsuario(usuarioId: number): Promise<Pedido[]>;

  abstract buscarDeUsuario(
    usuarioId: number,
    pedidoId: number,
  ): Promise<Pedido | null>;

  /** Guarda un pedido nuevo y lo devuelve con sus ids asignados. */
  abstract crear(datos: NuevoPedido): Promise<Pedido>;

  /** Compensa un checkout fallido, sin eliminar pedidos historicos. */
  abstract eliminarCreado(
    usuarioId: number,
    pedidoId: number,
  ): Promise<boolean>;
}
