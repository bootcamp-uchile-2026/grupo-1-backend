import { DataSource } from 'typeorm';
import { Categoria } from '../../persistencia/entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
import { CategoriasRepository } from '../categorias.repository';
export class TypeOrmCategoriasRepository extends CategoriasRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  async listar({ destacada }: { destacada?: boolean }) {
    const rows = await gestorActual(this.source)
      .getRepository(Categoria)
      .find({
        where: destacada === undefined ? {} : { destacada },
        order: { orden: 'ASC', id: 'ASC' },
      });
    return rows.map(({ id, nombre, slug, imagenUrl, destacada }) => ({
      id,
      nombre,
      slug,
      imagenUrl,
      destacada,
    }));
  }
}
