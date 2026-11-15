import { Injectable } from '@nestjs/common';
import { FavoritosRepository } from '../favoritos.repository';

/**
 * Favoritos en memoria. Los usuarios semilla parten sin favoritos, asi que
 * el estado inicial es vacio.
 */
@Injectable()
export class DummyFavoritosRepository extends FavoritosRepository {
  private readonly favoritos = new Map<number, Set<number>>();

  listarProductos(usuarioId: number): Promise<number[]> {
    return Promise.resolve(Array.from(this.favoritos.get(usuarioId) ?? []));
  }

  agregar(usuarioId: number, productoId: number): Promise<boolean> {
    const productos = this.favoritos.get(usuarioId) ?? new Set<number>();
    if (productos.has(productoId)) return Promise.resolve(false);
    productos.add(productoId);
    this.favoritos.set(usuarioId, productos);
    return Promise.resolve(true);
  }
}
