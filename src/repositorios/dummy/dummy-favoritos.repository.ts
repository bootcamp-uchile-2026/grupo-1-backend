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
  private readonly favoritos = new Map<number, Set<number>>();

  reiniciar(): void {
    this.favoritos.clear();
  }

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

  /** Solo para tests: indica si el par esta guardado. */
  contiene(usuarioId: number, productoId: number): boolean {
    return this.favoritos.get(usuarioId)?.has(productoId) ?? false;
  }
}
