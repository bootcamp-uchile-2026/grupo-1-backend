import { Injectable } from '@nestjs/common';
import { FavoritosRepository } from '../favoritos.repository';

/**
 * Favoritos en memoria. Los usuarios semilla parten sin favoritos, asi que
 * el estado inicial es vacio.
 */
@Injectable()
export class DummyFavoritosRepository extends FavoritosRepository {
  private readonly favoritos = new Set<string>();

  agregar(usuarioId: number, productoId: number): Promise<boolean> {
    const clave = `${usuarioId}:${productoId}`;
    if (this.favoritos.has(clave)) return Promise.resolve(false);
    this.favoritos.add(clave);
    return Promise.resolve(true);
  }
}
