import { DataSource } from 'typeorm';
import { Categoria, Coleccion, Post } from '../../persistencia/entidades';
import {
  Producto,
  ProductoColor,
  ProductoImagen,
  ProductoTalla,
  Variante,
} from '../../persistencia/productos.entidades';
import { DummyProductosRepository } from '../dummy/dummy-productos.repository';
import { TypeOrmProductosRepository } from './typeorm-productos.repository';

/** Construye metadatos sin abrir conexion (buildMetadatas es protegido). */
class MetadatosSinConexion extends DataSource {
  cargarMetadatos(): Promise<void> {
    return this.buildMetadatas();
  }
}

/** B1: ids positivos pero no representables en JavaScript. */
const NO_SEGUROS = [2 ** 53, 2 ** 53 + 2, 1e20, Number.MAX_VALUE];

describe('B1 TypeOrmProductosRepository con ids no seguros', () => {
  let source: MetadatosSinConexion;

  beforeAll(async () => {
    // Solo metadatos: sin conexion, cualquier consulta real fallaria.
    source = new MetadatosSinConexion({
      type: 'mysql',
      database: 'sin_conexion',
      entities: [
        Categoria,
        Coleccion,
        Post,
        Producto,
        Variante,
        ProductoImagen,
        ProductoColor,
        ProductoTalla,
      ],
    });
    await source.cargarMetadatos();
  });

  it('reproduce la causa: el transformer rechaza el id al construir el WHERE', () => {
    for (const id of NO_SEGUROS) {
      expect(() =>
        source
          .getRepository(Variante)
          .createQueryBuilder('v')
          .where({ id })
          .getQueryAndParameters(),
      ).toThrow('Entero de persistencia fuera de rango');
    }
  });

  it.each(NO_SEGUROS)(
    'buscarVariante(%p) y buscarPorId responden null sin consultar, igual que dummy',
    async (id) => {
      const sql = new TypeOrmProductosRepository(source);
      const dummy = new DummyProductosRepository();
      await expect(sql.buscarVariante(id)).resolves.toBeNull();
      await expect(sql.buscarPorId(id)).resolves.toBeNull();
      await expect(dummy.buscarVariante(id)).resolves.toBeNull();
      await expect(dummy.buscarPorId(id)).resolves.toBeNull();
    },
  );
});
