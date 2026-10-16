import {
  PedidoDetalleResponseDto,
  PedidoItemResponseDto,
} from '../dto/pedido-detalle-response.dto';

/** Contacto de quien recibe, copiado tal como llego al checkout. */
export interface ContactoCheckout {
  nombre: string;
  email: string;
  telefono: string;
}

/**
 * Direccion de despacho copiada del checkout. Es una foto: no referencia a
 * las direcciones del perfil, que el usuario puede cambiar despues.
 */
export interface DireccionCheckout {
  calle: string;
  numero: string;
  departamento?: string;
  comuna: string;
  region: string;
}

/** Copia del checkout que se guarda junto a un pedido creado. */
export interface SnapshotCheckout {
  contacto: ContactoCheckout;
  direccion: DireccionCheckout;
}

/** Linea de un pedido nuevo. El repositorio le asigna su id. */
export type NuevoPedidoItem = Omit<PedidoItemResponseDto, 'id'>;

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

/** Acceso a los pedidos. Toda lectura se limita al usuario indicado. */
export abstract class PedidosRepository {
  abstract listarPorUsuario(
    usuarioId: number,
  ): Promise<PedidoDetalleResponseDto[]>;

  abstract buscarDeUsuario(
    usuarioId: number,
    pedidoId: number,
  ): Promise<PedidoDetalleResponseDto | null>;

  /** Guarda un pedido nuevo y lo devuelve con sus ids asignados. */
  abstract crear(datos: NuevoPedido): Promise<PedidoDetalleResponseDto>;

  /** Compensa un checkout fallido, sin eliminar pedidos historicos. */
  abstract eliminarCreado(
    usuarioId: number,
    pedidoId: number,
  ): Promise<boolean>;
}
