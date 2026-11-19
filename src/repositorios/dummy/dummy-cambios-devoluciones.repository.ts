import type { SolicitudCambioDevolucion } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import {
  CAMBIOS_DEVOLUCIONES_DUMMY,
  SOLICITUD_NUEVA_FECHA,
  SOLICITUD_NUEVA_ID,
} from '../../data/cambios-devoluciones.dummy';

import {
  CambiosDevolucionesRepository,
  NuevaSolicitud,
} from '../cambios-devoluciones.repository';
import { copiar } from './reiniciable';

@Injectable()
export class DummyCambiosDevolucionesRepository extends CambiosDevolucionesRepository {
  private solicitudes: SolicitudCambioDevolucion[] = [];
  private siguienteId = SOLICITUD_NUEVA_ID;

  constructor() {
    super();
    this.solicitudes = copiar(CAMBIOS_DEVOLUCIONES_DUMMY);
    this.siguienteId = SOLICITUD_NUEVA_ID;
  }

  listarPorPedido(pedidoId: number): Promise<SolicitudCambioDevolucion[]> {
    return Promise.resolve(
      copiar(this.solicitudes.filter((item) => item.pedidoId === pedidoId)),
    );
  }

  buscarPorId(id: number): Promise<SolicitudCambioDevolucion | null> {
    const solicitud = this.solicitudes.find((item) => item.id === id);
    return Promise.resolve(solicitud ? copiar(solicitud) : null);
  }

  /** La fecha es fija en la fase dummy para que las respuestas sean estables. */
  crear(datos: NuevaSolicitud): Promise<SolicitudCambioDevolucion> {
    const solicitud: SolicitudCambioDevolucion = {
      id: this.siguienteId,
      ...copiar(datos),
      fechaSolicitud: SOLICITUD_NUEVA_FECHA,
    };
    this.siguienteId += 1;
    this.solicitudes.push(solicitud);
    return Promise.resolve(copiar(solicitud));
  }
}
