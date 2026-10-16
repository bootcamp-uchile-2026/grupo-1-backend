import { Injectable } from '@nestjs/common';
import {
  ALERTA_NUEVA_ID,
  AlertaDummy,
  ALERTAS_DUMMY,
} from '../../data/alertas.dummy';
import { AlertaResponseDto } from '../../dto/alerta-response.dto';
import { AlertasRepository, NuevaAlerta } from '../alertas.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyAlertasRepository
  extends AlertasRepository
  implements RepositorioReiniciable
{
  private alertas: AlertaDummy[] = [];
  private siguienteId = ALERTA_NUEVA_ID;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.alertas = copiar(ALERTAS_DUMMY);
    this.siguienteId = ALERTA_NUEVA_ID;
  }

  listarPorUsuario(usuarioId: number): Promise<AlertaResponseDto[]> {
    return Promise.resolve(
      this.alertas
        .filter((item) => item.usuarioId === usuarioId)
        .map((item) => copiar(item.alerta)),
    );
  }

  crear(usuarioId: number, datos: NuevaAlerta): Promise<AlertaResponseDto> {
    const alerta: AlertaResponseDto = {
      id: this.siguienteId,
      ...copiar(datos),
    };
    this.siguienteId += 1;
    this.alertas.push({ usuarioId, alerta });
    return Promise.resolve(copiar(alerta));
  }

  eliminar(usuarioId: number, alertaId: number): Promise<boolean> {
    const posicion = this.alertas.findIndex(
      (item) => item.usuarioId === usuarioId && item.alerta.id === alertaId,
    );
    if (posicion === -1) return Promise.resolve(false);
    this.alertas.splice(posicion, 1);
    return Promise.resolve(true);
  }
}
