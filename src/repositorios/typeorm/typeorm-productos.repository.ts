import { DataSource, EntityManager, In } from 'typeorm';
import type { ProductoDetalle } from '../../dominio/modelos';
import { gestores } from '../../persistencia/gestor-actual';
import {
  Producto,
  ProductoColor,
  ProductoImagen,
  ProductoTalla,
  Variante,
} from '../../persistencia/productos.entidades';
import {
  ProductosRepository,
  VarianteConProducto,
} from '../productos.repository';

export class TypeOrmProductosRepository extends ProductosRepository {
  constructor(private readonly source: DataSource) {
    super();
  }

  /** Una instantánea para las colecciones; participa de la UoW si existe. */
  private leer<T>(
    consulta: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const manager = gestores.getStore();
    return manager
      ? consulta(manager)
      : this.source.transaction('REPEATABLE READ', consulta);
  }

  listar(): Promise<ProductoDetalle[]> {
    return this.leer((manager) => this.cargar(manager));
  }

  buscarPorId(id: number): Promise<ProductoDetalle | null> {
    // Un id no representable no puede existir: mismo 404 que el adaptador dummy.
    if (!Number.isSafeInteger(id)) return Promise.resolve(null);
    return this.leer(
      async (manager) => (await this.cargar(manager, id))[0] ?? null,
    );
  }

  buscarVariante(varianteId: number): Promise<VarianteConProducto | null> {
    if (!Number.isSafeInteger(varianteId)) return Promise.resolve(null);
    return this.leer(async (manager) => {
      const row = await manager
        .getRepository(Variante)
        .findOneBy({ id: varianteId });
      if (!row) return null;
      const producto = (await this.cargar(manager, row.productoId))[0];
      const variante = producto?.variantes.find((v) => v.id === varianteId);
      if (!producto || !variante)
        throw new Error('Referencia de producto inconsistente');
      return { producto, variante };
    });
  }

  private async cargar(
    manager: EntityManager,
    id?: number,
  ): Promise<ProductoDetalle[]> {
    const productos = await manager.getRepository(Producto).find({
      where: id === undefined ? {} : { id },
      relations: { categoria: true },
      order: { id: 'ASC' },
    });
    if (!productos.length) return [];
    const where = { productoId: In(productos.map((p) => p.id)) };
    const order = { posicion: 'ASC' as const };
    // Consultas separadas: no multiplicar las ocurrencias de las cuatro listas.
    const imagenes = await manager
      .getRepository(ProductoImagen)
      .find({ where, order });
    const colores = await manager
      .getRepository(ProductoColor)
      .find({ where, order });
    const tallas = await manager
      .getRepository(ProductoTalla)
      .find({ where, order });
    const variantes = await manager
      .getRepository(Variante)
      .find({ where, order });
    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      imagenUrl: p.imagenUrl,
      categoria: p.categoria.slug,
      novedad: p.novedad,
      oferta: p.oferta,
      descripcion: p.descripcion,
      calificacion: p.calificacion,
      guiaTallas: p.guiaTallas,
      imagenes: imagenes.filter((r) => r.productoId === p.id).map((r) => r.url),
      colores: colores.filter((r) => r.productoId === p.id).map((r) => r.color),
      tallas: tallas.filter((r) => r.productoId === p.id).map((r) => r.talla),
      variantes: variantes
        .filter((r) => r.productoId === p.id)
        .map(({ id, color, talla, stock }) => ({ id, color, talla, stock })),
    }));
  }
}
