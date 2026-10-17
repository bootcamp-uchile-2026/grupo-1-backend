import { PedidoDetalleResponseDto } from '../dto/pedido-detalle-response.dto';
import type { SnapshotCheckout } from '../repositorios/pedidos.repository';

/**
 * Pedido tal como vive en la fase dummy: el contrato HTTP mas su dueno.
 * usuarioId no forma parte del DTO de salida; equivale a la clave foranea
 * que tendra la tabla de pedidos. checkout guarda la copia del contacto y
 * la direccion del checkout; los pedidos historicos de ejemplo no la tienen.
 */
export interface PedidoDummy {
  usuarioId: number;
  pedido: PedidoDetalleResponseDto;
  checkout?: SnapshotCheckout;
}

/**
 * Pedidos de ejemplo. Cada item tiene identidad propia (5001, 5002...) y
 * referencia un producto y una variante del catalogo dummy; nombre y
 * precioUnitario son la foto del catalogo al momento de la compra.
 */
export const PEDIDOS_DUMMY: PedidoDummy[] = [
  {
    usuarioId: 1,
    pedido: {
      id: 1001,
      numeroPedido: 'SN-2026-1001',
      estado: 'confirmado',
      fecha: '2026-10-04T20:30:00.000Z',
      subtotal: 39990,
      costoEnvio: 0,
      total: 39990,
      metodoPago: 'webpay',
      items: [
        {
          id: 5001,
          productoId: 1,
          varianteId: 102,
          nombre: 'Vestido de lino blanco',
          cantidad: 1,
          precioUnitario: 39990,
          subtotal: 39990,
        },
      ],
    },
  },
  {
    usuarioId: 1,
    pedido: {
      id: 1002,
      numeroPedido: 'SN-2026-1002',
      estado: 'entregado',
      fecha: '2026-09-20T15:00:00.000Z',
      subtotal: 54980,
      costoEnvio: 3990,
      total: 58970,
      metodoPago: 'transferencia',
      items: [
        {
          id: 5002,
          productoId: 2,
          varianteId: 201,
          nombre: 'Camisa oxford celeste',
          cantidad: 1,
          precioUnitario: 29990,
          subtotal: 29990,
        },
        {
          id: 5003,
          productoId: 3,
          varianteId: 301,
          nombre: 'Bolso tote de lona',
          cantidad: 1,
          precioUnitario: 24990,
          subtotal: 24990,
        },
      ],
    },
  },
  {
    usuarioId: 2,
    pedido: {
      id: 2001,
      numeroPedido: 'SN-2026-2001',
      estado: 'confirmado',
      fecha: '2026-10-02T11:15:00.000Z',
      subtotal: 29990,
      costoEnvio: 3990,
      total: 33980,
      metodoPago: 'webpay',
      items: [
        {
          id: 6001,
          productoId: 2,
          varianteId: 202,
          nombre: 'Camisa oxford celeste',
          cantidad: 1,
          precioUnitario: 29990,
          subtotal: 29990,
        },
      ],
    },
  },
];
