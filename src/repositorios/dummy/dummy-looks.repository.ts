import { Injectable } from '@nestjs/common';
import { LOOK_NUEVO_ID, LOOKS_DUMMY } from '../../data/looks.dummy';
import { LookResponseDto } from '../../dto/look-response.dto';
import { LooksRepository, NuevoLook } from '../looks.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyLooksRepository
  extends LooksRepository
  implements RepositorioReiniciable
{
  private looks: LookResponseDto[] = [];
  private guardados = new Set<string>();
  private siguienteId = LOOK_NUEVO_ID;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.looks = copiar(LOOKS_DUMMY);
    this.guardados = new Set();
    this.siguienteId = LOOK_NUEVO_ID;
  }

  listarPagina(
    desplazamiento: number,
    limite: number,
  ): Promise<{ looks: LookResponseDto[]; total: number }> {
    return Promise.resolve({
      looks: copiar(this.looks.slice(desplazamiento, desplazamiento + limite)),
      total: this.looks.length,
    });
  }

  buscarPorId(id: number): Promise<LookResponseDto | null> {
    const look = this.looks.find((item) => item.id === id);
    return Promise.resolve(look ? copiar(look) : null);
  }

  crear(datos: NuevoLook): Promise<LookResponseDto> {
    const look: LookResponseDto = { id: this.siguienteId, ...copiar(datos) };
    this.siguienteId += 1;
    this.looks.push(look);
    return Promise.resolve(copiar(look));
  }

  guardarParaUsuario(usuarioId: number, lookId: number): Promise<void> {
    this.guardados.add(`${usuarioId}:${lookId}`);
    return Promise.resolve();
  }

  /** Solo para tests: indica si el usuario tiene guardado el look. */
  estaGuardado(usuarioId: number, lookId: number): boolean {
    return this.guardados.has(`${usuarioId}:${lookId}`);
  }
}
