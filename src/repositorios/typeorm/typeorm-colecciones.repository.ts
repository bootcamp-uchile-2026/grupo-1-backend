import { DataSource } from 'typeorm';
import { Coleccion } from '../../persistencia/entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
import { ColeccionesRepository } from '../colecciones.repository';
export class TypeOrmColeccionesRepository extends ColeccionesRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  async listar() {
    const rows = await gestorActual(this.source)
      .getRepository(Coleccion)
      .find({ where: {}, order: { id: 'ASC' } });
    return rows.map(({ id, nombre, descripcion, imagenUrl }) => ({
      id,
      nombre,
      descripcion,
      imagenUrl,
    }));
  }
}
