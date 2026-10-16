import { Injectable } from '@nestjs/common';
import { FavoritosRepository } from '../favoritos.repository';
import { RepositorioReiniciable } from './reiniciable';

/**
 * Favoritos en memoria. Los usuarios semilla parten sin favoritos, asi que
 * el estado inicial es vacio y reiniciar lo vacia.
 */
@Injectable()
export class DummyFavoritosRepository
  extends FavoritosRepository
  implements RepositorioReiniciable
{
  private readonly favoritos = new Set<string>();

  reiniciar(): void {
    this.favoritos.clear();
  }

  agregar(usuarioId: number, productoId: number): Promise<boolean> {
    const clave = `${usuarioId}:${productoId}`;
    if (this.favoritos.has(clave)) return Promise.resolve(false);
    this.favoritos.add(clave);
    return Promise.resolve(true);
  }

  /** Solo para tests: indica si el par esta guardado. */
  contiene(usuarioId: number, productoId: number): boolean {
    return this.favoritos.has(`${usuarioId}:${productoId}`);
  }
}
