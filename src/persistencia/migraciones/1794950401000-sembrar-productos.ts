import { MigrationInterface, QueryRunner } from 'typeorm';
import { PRODUCTOS_SEMILLA_P1 } from './productos-semilla-p1';

export class SembrarProductos1794950401000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    for (const p of PRODUCTOS_SEMILLA_P1) {
      const categorias = (await q.query(
        'SELECT id FROM categoria WHERE slug = ?',
        [p.categoria],
      )) as { id: number }[];
      if (categorias.length !== 1)
        throw new Error('Categoria requerida por semilla P1 ausente');
      await q.query(
        'INSERT INTO producto (id,categoria_id,nombre,precio,imagen_url,novedad,oferta,descripcion,calificacion,guia_tallas) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
        [
          p.id,
          categorias[0].id,
          p.nombre,
          p.precio,
          p.imagenUrl,
          p.novedad,
          p.oferta,
          p.descripcion,
          p.calificacion,
          p.guiaTallas,
        ],
      );
      for (const [posicion, v] of p.variantes.entries()) {
        await q.query(
          'INSERT INTO variante (id,producto_id,posicion,color,talla,stock) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
          [v.id, p.id, posicion, v.color, v.talla, v.stock],
        );
      }
      for (const [posicion, url] of p.imagenes.entries()) {
        await q.query(
          'INSERT INTO producto_imagen (producto_id,posicion,url) VALUES (?,?,?) ON DUPLICATE KEY UPDATE producto_id=producto_id',
          [p.id, posicion, url],
        );
      }
      for (const [posicion, color] of p.colores.entries()) {
        await q.query(
          'INSERT INTO producto_color (producto_id,posicion,color) VALUES (?,?,?) ON DUPLICATE KEY UPDATE producto_id=producto_id',
          [p.id, posicion, color],
        );
      }
      for (const [posicion, talla] of p.tallas.entries()) {
        await q.query(
          'INSERT INTO producto_talla (producto_id,posicion,talla) VALUES (?,?,?) ON DUPLICATE KEY UPDATE producto_id=producto_id',
          [p.id, posicion, talla],
        );
      }
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DELETE FROM producto_talla WHERE producto_id IN (1,2,3)');
    await q.query('DELETE FROM producto_color WHERE producto_id IN (1,2,3)');
    await q.query('DELETE FROM producto_imagen WHERE producto_id IN (1,2,3)');
    await q.query(
      'DELETE FROM variante WHERE id IN (101,102,103,201,202,301,302)',
    );
    await q.query('DELETE FROM producto WHERE id IN (1,2,3)');
  }
}
