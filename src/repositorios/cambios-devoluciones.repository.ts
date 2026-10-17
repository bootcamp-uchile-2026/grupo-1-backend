import { CambioDevolucionResponseDto } from '../dto/cambio-devolucion-response.dto';

/**
 * Datos de una solicitud sin id ni fecha: los asigna el repositorio al
 * registrarla.
 */
export type NuevaSolicitud = Omit<
  CambioDevolucionResponseDto,
  'id' | 'fechaSolicitud'
>;

/**
 * Acceso a las solicitudes de cambio y devolucion. No guardan dueno propio:
 * la pertenencia al usuario la resuelve el Service a traves del pedido.
 */
export abstract class CambiosDevolucionesRepository {
  abstract listarPorPedido(
    pedidoId: number,
  ): Promise<CambioDevolucionResponseDto[]>;

  abstract buscarPorId(id: number): Promise<CambioDevolucionResponseDto | null>;

  abstract crear(datos: NuevaSolicitud): Promise<CambioDevolucionResponseDto>;
}
