import type { SolicitudCambioDevolucion } from '../dominio/modelos';

/**
 * Datos de una solicitud sin id ni fecha: los asigna el repositorio al
 * registrarla.
 */
export type NuevaSolicitud = Omit<
  SolicitudCambioDevolucion,
  'id' | 'fechaSolicitud'
>;

/**
 * Acceso a las solicitudes de cambio y devolucion. No guardan dueno propio:
 * la pertenencia al usuario la resuelve el Service a traves del pedido.
 */
export abstract class CambiosDevolucionesRepository {
  abstract historial(
    id: number,
  ): Promise<{ estado: string; fecha: Date; resolucion: string | null }[]>;

  abstract listarPorPedido(
    pedidoId: number,
  ): Promise<SolicitudCambioDevolucion[]>;

  abstract buscarPorId(id: number): Promise<SolicitudCambioDevolucion | null>;

  abstract crear(
    datos: NuevaSolicitud,
    actor?: number,
    clave?: string,
  ): Promise<SolicitudCambioDevolucion>;
}
