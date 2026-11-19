import { DataSource } from 'typeorm';
import {
  CarritosRepository,
  CarritoPersistido,
  LineaCarritoPersistida,
} from '../carritos.repository';
import {
  CarritoFila,
  CarritoItemFila,
} from '../../persistencia/comercio.entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../../persistencia/unidad-de-trabajo';

export class TypeOrmCarritosRepository extends CarritosRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  private get manager() {
    return gestorActual(this.source);
  }
  override ejecutarBloqueado<T>(
    id: number,
    trabajo: () => Promise<T>,
  ): Promise<T> {
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      await this.manager
        .getRepository(CarritoFila)
        .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      return trabajo();
    });
  }
  async buscarPorUsuario(usuarioId: number) {
    const row = await this.manager
      .getRepository(CarritoFila)
      .findOneBy({ usuarioId });
    return row ? this.buscarPorId(row.id) : null;
  }
  async buscarPorId(id: number): Promise<CarritoPersistido | null> {
    const row = await this.manager.getRepository(CarritoFila).findOneBy({ id });
    if (!row) return null;
    const items = await this.manager
      .getRepository(CarritoItemFila)
      .find({ where: { carritoId: id }, order: { posicion: 'ASC' } });
    return {
      ...row,
      items: items.map(({ varianteId, cantidad }) => ({
        varianteId,
        cantidad,
      })),
    };
  }
  async crearParaUsuario(usuarioId: number): Promise<CarritoPersistido> {
    await this.manager.query(
      'INSERT INTO carrito(usuario_id) VALUES (?) ON DUPLICATE KEY UPDATE usuario_id=usuario_id',
      [usuarioId],
    );
    return (await this.buscarPorUsuario(usuarioId))!;
  }
  async guardarCantidad(id: number, varianteId: number, cantidad: number) {
    return this.ejecutarBloqueado(id, async () => {
      const carrito = await this.buscarPorId(id);
      if (!carrito) return null;
      const repo = this.manager.getRepository(CarritoItemFila);
      const old = await repo.findOneBy({ carritoId: id, varianteId });
      const rows = await repo.find({ where: { carritoId: id } });
      await repo.save({
        carritoId: id,
        varianteId,
        cantidad,
        posicion:
          old?.posicion ?? Math.max(-1, ...rows.map((r) => r.posicion)) + 1,
      });
      return this.buscarPorId(id);
    });
  }
  async eliminarItem(id: number, varianteId: number) {
    return this.ejecutarBloqueado(
      id,
      async () =>
        !!(
          await this.manager
            .getRepository(CarritoItemFila)
            .delete({ carritoId: id, varianteId })
        ).affected,
    );
  }
  async vaciar(id: number) {
    return this.ejecutarBloqueado(id, async () => {
      if (!(await this.buscarPorId(id))) return false;
      await this.manager
        .getRepository(CarritoItemFila)
        .delete({ carritoId: id });
      return true;
    });
  }
  async restaurarItems(id: number, items: LineaCarritoPersistida[]) {
    return this.ejecutarBloqueado(id, async () => {
      if (!(await this.vaciar(id))) return false;
      for (const [posicion, item] of items.entries())
        await this.manager
          .getRepository(CarritoItemFila)
          .insert({ carritoId: id, posicion, ...item });
      return true;
    });
  }
}
