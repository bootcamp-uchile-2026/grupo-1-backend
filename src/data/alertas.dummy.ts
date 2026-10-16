import { AlertaResponseDto } from '../dto/alerta-response.dto';

/**
 * Alerta tal como vive en la fase dummy: el contrato HTTP mas su dueno.
 * usuarioId equivale a la clave foranea que tendra la tabla.
 */
export interface AlertaDummy {
  usuarioId: number;
  alerta: AlertaResponseDto;
}

/** Alertas de ejemplo. Productos y variantes existen en el catalogo dummy. */
export const ALERTAS_DUMMY: AlertaDummy[] = [
  {
    usuarioId: 1,
    alerta: {
      id: 1,
      tipo: 'precio',
      productoId: 1,
      precioObjetivo: 29990,
      estado: 'activa',
    },
  },
  {
    usuarioId: 1,
    alerta: {
      id: 2,
      tipo: 'reposicion',
      productoId: 3,
      varianteId: 302,
      estado: 'activa',
    },
  },
  {
    usuarioId: 2,
    alerta: {
      id: 3,
      tipo: 'precio',
      productoId: 2,
      precioObjetivo: 19990,
      estado: 'activa',
    },
  },
];

/** Id de la primera alerta creada; las siguientes reciben ids consecutivos. */
export const ALERTA_NUEVA_ID = 4;
