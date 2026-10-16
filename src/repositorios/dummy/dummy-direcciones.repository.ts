import { Injectable } from '@nestjs/common';
import {
  DIRECCION_NUEVA_ID,
  DIRECCIONES_DUMMY,
  DireccionDummy,
} from '../../data/direcciones.dummy';
import { DireccionResponseDto } from '../../dto/direccion-response.dto';
import {
  DireccionesRepository,
  NuevaDireccion,
} from '../direcciones.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyDireccionesRepository
  extends DireccionesRepository
  implements RepositorioReiniciable
{
  private direcciones: DireccionDummy[] = [];
  private siguienteId = DIRECCION_NUEVA_ID;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.direcciones = copiar(DIRECCIONES_DUMMY);
    this.siguienteId = DIRECCION_NUEVA_ID;
  }

  listarPorUsuario(usuarioId: number): Promise<DireccionResponseDto[]> {
    return Promise.resolve(
      this.direcciones
        .filter((item) => item.usuarioId === usuarioId)
        .map((item) => copiar(item.direccion)),
    );
  }

  buscarDeUsuario(
    usuarioId: number,
    direccionId: number,
  ): Promise<DireccionResponseDto | null> {
    const encontrada = this.posicion(usuarioId, direccionId);
    return Promise.resolve(
      encontrada === -1 ? null : copiar(this.direcciones[encontrada].direccion),
    );
  }

  crear(
    usuarioId: number,
    datos: NuevaDireccion,
  ): Promise<DireccionResponseDto> {
    const direccion: DireccionResponseDto = {
      id: this.siguienteId,
      ...copiar(datos),
    };
    this.siguienteId += 1;
    this.direcciones.push({ usuarioId, direccion });
    return Promise.resolve(copiar(direccion));
  }

  actualizar(
    usuarioId: number,
    direccion: DireccionResponseDto,
  ): Promise<DireccionResponseDto | null> {
    const encontrada = this.posicion(usuarioId, direccion.id);
    if (encontrada === -1) return Promise.resolve(null);
    this.direcciones[encontrada] = { usuarioId, direccion: copiar(direccion) };
    return Promise.resolve(copiar(direccion));
  }

  eliminar(usuarioId: number, direccionId: number): Promise<boolean> {
    const encontrada = this.posicion(usuarioId, direccionId);
    if (encontrada === -1) return Promise.resolve(false);
    this.direcciones.splice(encontrada, 1);
    return Promise.resolve(true);
  }

  private posicion(usuarioId: number, direccionId: number): number {
    return this.direcciones.findIndex(
      (item) =>
        item.usuarioId === usuarioId && item.direccion.id === direccionId,
    );
  }
}
