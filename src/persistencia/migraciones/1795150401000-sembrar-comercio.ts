import { MigrationInterface, QueryRunner } from 'typeorm';
import { PEDIDOS_SEMILLA_P3 } from './comercio-semilla-p3';
export class SembrarComercio1795150401000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    for (const { usuarioId, pedido: p } of PEDIDOS_SEMILLA_P3) {
      await q.query(
        'INSERT INTO pedido(id,usuario_id,numero_pedido,estado,fecha,costo_envio,metodo_pago) VALUES (?,?,?,?,?,?,?)',
        [
          p.id,
          usuarioId,
          p.numeroPedido,
          p.estado,
          new Date(p.fecha),
          p.costoEnvio,
          p.metodoPago,
        ],
      );
      for (const [posicion, i] of p.items.entries())
        await q.query(
          'INSERT INTO pedido_item(id,pedido_id,producto_id,variante_id,posicion,nombre,cantidad,precio_unitario) VALUES (?,?,?,?,?,?,?,?)',
          [
            i.id,
            p.id,
            i.productoId,
            i.varianteId,
            posicion,
            i.nombre,
            i.cantidad,
            i.precioUnitario,
          ],
        );
    }
  }
  async down(q: QueryRunner): Promise<void> {
    for (const { pedido } of PEDIDOS_SEMILLA_P3) {
      await q.query('DELETE FROM pedido_item WHERE pedido_id=?', [pedido.id]);
      await q.query('DELETE FROM pedido WHERE id=?', [pedido.id]);
    }
  }
}
