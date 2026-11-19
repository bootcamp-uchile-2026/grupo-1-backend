/** Tipos de alerta que un usuario puede registrar sobre un producto. */
export const TIPOS_ALERTA = ['precio', 'reposicion'] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

/** Estados por los que pasa una alerta. */
export const ESTADOS_ALERTA = ['activa', 'notificada', 'cancelada'] as const;
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number];
