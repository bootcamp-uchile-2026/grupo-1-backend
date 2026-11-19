import type { Look } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { LOOK_NUEVO_ID, LOOKS_DUMMY } from '../../data/looks.dummy';

import { LooksRepository, NuevoLook } from '../looks.repository';
import { copiar } from './reiniciable';

@Injectable()
export class DummyLooksRepository extends LooksRepository {
  private looks: Look[] = [];
  private guardados = new Set<string>();
  private siguienteId = LOOK_NUEVO_ID;

  constructor() {
    super();
    this.looks = copiar(LOOKS_DUMMY);
    this.guardados = new Set();
    this.siguienteId = LOOK_NUEVO_ID;
  }

  listarPagina(
    desplazamiento: number,
    limite: number,
  ): Promise<{ looks: Look[]; total: number }> {
    return Promise.resolve({
      looks: copiar(this.looks.slice(desplazamiento, desplazamiento + limite)),
      total: this.looks.length,
    });
  }

  buscarPorId(id: number): Promise<Look | null> {
    const look = this.looks.find((item) => item.id === id);
    return Promise.resolve(look ? copiar(look) : null);
  }

  crear(datos: NuevoLook): Promise<Look> {
    const look: Look = { id: this.siguienteId, ...copiar(datos) };
    this.siguienteId += 1;
    this.looks.push(look);
    return Promise.resolve(copiar(look));
  }

  guardarParaUsuario(usuarioId: number, lookId: number): Promise<void> {
    this.guardados.add(`${usuarioId}:${lookId}`);
    return Promise.resolve();
  }
}
