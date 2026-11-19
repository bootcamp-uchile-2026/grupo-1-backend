import { DataSource } from 'typeorm';
import { FavoritosRepository } from '../favoritos.repository';
import { FavoritoFila } from '../../persistencia/comercio.entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
export class TypeOrmFavoritosRepository extends FavoritosRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  async listarProductos(usuarioId: number) {
    return (
      await gestorActual(this.source)
        .getRepository(FavoritoFila)
        .find({ where: { usuarioId }, order: { orden: 'ASC' } })
    ).map((r) => r.productoId);
  }
  async agregar(usuarioId: number, productoId: number) {
    try {
      await gestorActual(this.source)
        .getRepository(FavoritoFila)
        .insert({ usuarioId, productoId });
      return true;
    } catch (error) {
      if (
        (error as { driverError?: { errno: number } }).driverError?.errno ===
        1062
      )
        return false;
      throw error;
    }
  }
}
