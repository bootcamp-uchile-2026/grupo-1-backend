import { DataSource } from 'typeorm';
import type { Look } from '../../dominio/modelos';
import { LooksRepository, NuevoLook } from '../looks.repository';
import { gestorActual } from '../../persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../../persistencia/unidad-de-trabajo';
import { importeSeguro } from './typeorm-pedidos.repository';
export class TypeOrmLooksRepository extends LooksRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  private get m() {
    return gestorActual(this.source);
  }
  async listarPagina(offset: number, limit: number) {
    const rows = await this.m.query<{ id: number }[]>(
      'SELECT id FROM look_conjunto ORDER BY id LIMIT ? OFFSET ?',
      [limit, offset],
    );
    const count = await this.m.query<{ n: number }[]>(
      'SELECT COUNT(*) n FROM look_conjunto',
    );
    return {
      looks: await Promise.all(
        rows.map(async (r) => (await this.buscarPorId(r.id))!),
      ),
      total: Number(count[0].n),
    };
  }
  async buscarPorId(id: number): Promise<Look | null> {
    const rows = await this.m.query<
      { id: number; nombre: string; precioTotal: string }[]
    >(
      'SELECT id,nombre,precio_total precioTotal FROM look_conjunto WHERE id=?',
      [id],
    );
    if (!rows[0]) return null;
    const productos = await this.m.query<
      { productoId: string; varianteId: string }[]
    >(
      'SELECT v.producto_id productoId,o.variante_id varianteId FROM look_ocurrencia o JOIN variante v ON v.id=o.variante_id WHERE look_id=? ORDER BY o.posicion',
      [id],
    );
    return {
      id: rows[0].id,
      nombre: rows[0].nombre,
      precioTotal: importeSeguro(BigInt(rows[0].precioTotal)),
      productos: productos.map((p) => ({
        productoId: Number(p.productoId),
        varianteId: Number(p.varianteId),
      })),
    };
  }
  async crear(d: NuevoLook, usuarioId?: number) {
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      if (!usuarioId) throw new Error('Autor autenticado requerido');
      const row = await this.m.query<{ insertId: number }>(
        'INSERT INTO look_conjunto(creador_usuario_id,nombre,precio_total) VALUES (?,?,?)',
        [usuarioId, d.nombre, d.precioTotal],
      );
      for (const [i, p] of d.productos.entries())
        await this.m.query(
          'INSERT INTO look_ocurrencia(look_id,posicion,variante_id) VALUES (?,?,?)',
          [row.insertId, i, p.varianteId],
        );
      return (await this.buscarPorId(row.insertId))!;
    });
  }
  async guardarParaUsuario(usuarioId: number, lookId: number) {
    await this.m.query(
      'INSERT INTO look_guardado(usuario_id,look_id) VALUES (?,?) ON DUPLICATE KEY UPDATE look_id=look_id',
      [usuarioId, lookId],
    );
  }
}
