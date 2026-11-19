import { DataSource } from 'typeorm';
import { Post } from '../../persistencia/entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
import { PostsRepository } from '../posts.repository';
export class TypeOrmPostsRepository extends PostsRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  async listar() {
    const rows = await gestorActual(this.source)
      .getRepository(Post)
      .find({ where: {}, order: { id: 'ASC' } });
    return rows.map(({ id, titulo, contenido, imagenUrl }) => ({
      id,
      titulo,
      contenido,
      imagenUrl,
    }));
  }
}
