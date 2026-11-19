/** Tipos de solicitud sobre un item de un pedido. */
export const TIPOS_SOLICITUD = ['cambio', 'devolucion'] as const;
export type TipoSolicitud = (typeof TIPOS_SOLICITUD)[number];

/** Estados por los que pasa una solicitud de cambio o devolucion. */
export const ESTADOS_SOLICITUD = [
  'solicitada',
  'aprobada',
  'rechazada',
  'completada',
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];
