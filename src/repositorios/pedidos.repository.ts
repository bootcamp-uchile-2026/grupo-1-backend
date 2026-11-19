import type { Pedido, PedidoItem, SnapshotCheckout } from '../dominio/modelos';

export type {
  ContactoCheckout,
  DireccionCheckout,
  SnapshotCheckout,
} from '../dominio/modelos';
/** Linea de un pedido nuevo. El repositorio le asigna su id. */
export type NuevoPedidoItem = Omit<PedidoItem, 'id'>;

/**
 * Pedido ya calculado por PedidosService. El repositorio solo le asigna
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
  confirmarCheckout(
    _datos: CheckoutPersistencia,
    _usuarioId: number,
    _clave?: string,
  ): Promise<Pedido | null> {
    void _datos;
    void _usuarioId;
    void _clave;
    return Promise.resolve(null);
  }
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
