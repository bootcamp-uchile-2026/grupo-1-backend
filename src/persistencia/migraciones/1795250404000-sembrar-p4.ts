import { MigrationInterface, QueryRunner } from 'typeorm';
import { SEMILLA_P4 } from './p4-semilla';
/** Solo fixtures sinteticos de compatibilidad; nunca despachos ni pagos. */
export class SembrarP41795250404000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    for (const { usuarioId, alerta: a } of SEMILLA_P4.alertas)
      await q.query(
        'INSERT INTO alerta(id,usuario_id,tipo,producto_id,variante_id,precio_objetivo,estado) VALUES (?,?,?,?,?,?,?)',
        [
          a.id,
          usuarioId,
          a.tipo,
          a.productoId,
          'varianteId' in a ? a.varianteId : null,
          'precioObjetivo' in a ? a.precioObjetivo : null,
          a.estado,
        ],
      );
    for (const l of SEMILLA_P4.looks) {
      await q.query(
        'INSERT INTO look_conjunto(id,nombre,precio_total) VALUES (?,?,?)',
        [l.id, l.nombre, l.precioTotal],
      );
      for (const [i, p] of l.productos.entries())
        await q.query(
          'INSERT INTO look_ocurrencia(look_id,posicion,variante_id) VALUES (?,?,?)',
          [l.id, i, p.varianteId],
        );
    }
    for (const s of SEMILLA_P4.solicitudes) {
      await q.query(
        'INSERT INTO solicitud_postventa(id,pedido_id,pedido_item_id,tipo,estado,motivo,nueva_variante_id,metodo_entrega,fecha_solicitud) VALUES (?,?,?,?,?,?,?,?,?)',
        [
          s.id,
          s.pedidoId,
          s.pedidoItemId,
          s.tipo,
          s.estado,
          s.motivo,
          'nuevaVarianteId' in s ? s.nuevaVarianteId : null,
          s.metodoEntrega,
          new Date(s.fechaSolicitud),
        ],
      );
      await q.query(
        'INSERT INTO postventa_evento(solicitud_id,estado,fecha,resolucion) VALUES (?,?,?,?)',
        [
          s.id,
          s.estado,
          new Date(s.fechaSolicitud),
          'Fixture sintetico legado; sin resolucion operativa real',
        ],
      );
    }
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DELETE FROM postventa_evento WHERE solicitud_id IN (1,2)');
    await q.query('DELETE FROM solicitud_postventa WHERE id IN (1,2)');
    await q.query('DELETE FROM look_ocurrencia WHERE look_id IN (1,2,3)');
    await q.query('DELETE FROM look_conjunto WHERE id IN (1,2,3)');
    await q.query('DELETE FROM alerta WHERE id IN (1,2,3)');
  }
}
