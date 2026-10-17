import { CambioDevolucionResponseDto } from '../dto/cambio-devolucion-response.dto';

/**
 * Solicitudes de ejemplo. No guardan dueno propio: una solicitud es de quien
 * es dueno de su pedido.
 * - 1: usuario 1, pedido 1001, item 5001. Cambio del vestido talla M
 *   (variante 102) por la talla S (variante 101).
 * - 2: usuario 2, pedido 2001, item 6001. Devolucion de la camisa.
 */
export const CAMBIOS_DEVOLUCIONES_DUMMY: CambioDevolucionResponseDto[] = [
  {
    id: 1,
    pedidoId: 1001,
    pedidoItemId: 5001,
    tipo: 'cambio',
    estado: 'aprobada',
    motivo: 'La talla me quedo grande',
    nuevaVarianteId: 101,
    metodoEntrega: 'retiro_domicilio',
    fechaSolicitud: '2026-10-06T12:00:00.000Z',
  },
  {
    id: 2,
    pedidoId: 2001,
    pedidoItemId: 6001,
    tipo: 'devolucion',
    estado: 'solicitada',
    motivo: 'No era el color que esperaba',
    metodoEntrega: 'sucursal',
    fechaSolicitud: '2026-10-05T16:45:00.000Z',
  },
];

/** Id de la primera solicitud creada; las siguientes reciben ids consecutivos. */
export const SOLICITUD_NUEVA_ID = 3;

/** Fecha fija de toda solicitud creada en la fase dummy. */
export const SOLICITUD_NUEVA_FECHA = '2026-10-07T09:00:00.000Z';
