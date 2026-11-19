import { DataSource } from 'typeorm';
import { AlertasRepository, NuevaAlerta } from '../alertas.repository';
import type { Alerta } from '../../dominio/modelos';
import { gestorActual } from '../../persistencia/gestor-actual';
export class TypeOrmAlertasRepository extends AlertasRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  private get m() {
    return gestorActual(this.source);
  }
  async listarPorUsuario(usuarioId: number): Promise<Alerta[]> {
    const rows = await this.m.query<
      (Alerta & { varianteId: number | null; precioObjetivo: number | null })[]
    >(
      'SELECT id,tipo,producto_id productoId,variante_id varianteId,precio_objetivo precioObjetivo,estado FROM alerta WHERE usuario_id=? ORDER BY id',
      [usuarioId],
    );
    return rows.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      productoId: Number(r.productoId),
      estado: r.estado,
      ...(r.varianteId === null ? {} : { varianteId: Number(r.varianteId) }),
      ...(r.precioObjetivo === null
        ? {}
        : { precioObjetivo: r.precioObjetivo }),
    }));
  }
  async crear(usuarioId: number, d: NuevaAlerta) {
    const r = await this.m.query<{ insertId: number }>(
      'INSERT INTO alerta(usuario_id,tipo,producto_id,variante_id,precio_objetivo,estado) VALUES (?,?,?,?,?,?)',
      [
        usuarioId,
        d.tipo,
        d.productoId,
        d.varianteId ?? null,
        d.precioObjetivo ?? null,
        d.estado,
      ],
    );
    return { id: r.insertId, ...d };
  }
  async eliminar(usuarioId: number, id: number) {
    return (
      (
        await this.m.query<{ affectedRows: number }>(
          'DELETE FROM alerta WHERE id=? AND usuario_id=?',
          [id, usuarioId],
        )
      ).affectedRows === 1
    );
  }
}
