import { SembrarP41795250404000 } from '../../src/persistencia/migraciones/1795250404000-sembrar-p4';
import type { QueryRunner } from 'typeorm';
import { PEDIDOS_SEMILLA_P3 } from '../../src/persistencia/migraciones/comercio-semilla-p3';
import { PRODUCTOS_SEMILLA_P1 } from '../../src/persistencia/migraciones/productos-semilla-p1';
import { createConnection, type Connection } from 'mysql2/promise';
import { CREDENCIALES_DUMMY } from '../../src/data/credenciales.dummy';
import {
  DIRECCIONES_SEMILLA_P2,
  USUARIOS_SEMILLA_P2,
} from '../../src/persistencia/migraciones/identidad-semilla-p2';

/** El laboratorio exclusivo y desechable es la unica base admitida. */
export function laboratorioDesechable(): boolean {
  return (
    process.env.MYSQL_LAB_GUARD === 'exclusive-disposable-pr0' &&
    process.env.DB_HOST === '127.0.0.1' &&
    /^stylenow_pr0_[a-f0-9]{12}_test$/.test(process.env.DB_DATABASE ?? '') &&
    process.env.DB_DATABASE === process.env.MYSQL_LAB_DATABASE
  );
}

/**
 * Devuelve usuario/credencial/direccion al estado semilla mas las
 * credenciales de prueba (hashes de los fixtures dummy), como hace el
 * adaptador dummy al crear una app nueva. Solo en el laboratorio.
 */
export async function reiniciarIdentidadSql(
  conexion: Connection,
): Promise<void> {
  if (!laboratorioDesechable()) {
    throw new Error('Reinicio SQL fuera del laboratorio desechable');
  }
  const [images] = await conexion.query("SHOW TABLES LIKE 'carga_imagen'");
  const tieneImagenes = (images as unknown[]).length > 0;
  await conexion.beginTransaction();
  try {
    if (tieneImagenes) {
      await conexion.query('DELETE FROM carga_imagen');
      await conexion.query('DELETE FROM permiso_usuario');
      await conexion.query(
        "DELETE FROM producto_imagen WHERE url LIKE '/imagenes/productos/%'",
      );
    }
    const [commerce] = await conexion.query("SHOW TABLES LIKE 'carrito'");
    const tieneComercio = (commerce as unknown[]).length > 0;
    const [p4] = await conexion.query("SHOW TABLES LIKE 'alerta'");
    const tieneP4 = (p4 as unknown[]).length > 0;
    if (tieneP4)
      for (const table of [
        'postventa_idempotencia',
        'postventa_evento',
        'solicitud_postventa',
        'pedido_cancelacion',
        'inventario_pedido',
        'envio_evento',
        'envio',
        'look_guardado',
        'look_ocurrencia',
        'look_conjunto',
        'alerta',
      ])
        await conexion.query('DELETE FROM ' + table);
    if (tieneComercio)
      for (const table of [
        'pedido_item',
        'pedido',
        'favorito',
        'carrito_item',
        'carrito',
      ])
        await conexion.query('DELETE FROM ' + table);
    await conexion.query('DELETE FROM credencial');
    await conexion.query('DELETE FROM direccion');
    await conexion.query('DELETE FROM usuario');
    for (const u of USUARIOS_SEMILLA_P2) {
      await conexion.query(
        'INSERT INTO usuario (id,nombre,apellido,email,telefono) VALUES (?,?,?,?,?)',
        [u.id, u.nombre, u.apellido, u.email, u.telefono ?? null],
      );
    }
    for (const { usuarioId, direccion: d } of DIRECCIONES_SEMILLA_P2) {
      await conexion.query(
        'INSERT INTO direccion (id,usuario_id,nombre,calle,numero,departamento,comuna,region,principal) VALUES (?,?,?,?,?,?,?,?,?)',
        [
          d.id,
          usuarioId,
          d.nombre,
          d.calle,
          d.numero,
          d.departamento ?? null,
          d.comuna,
          d.region,
          d.principal,
        ],
      );
    }
    for (const c of CREDENCIALES_DUMMY) {
      await conexion.query(
        'INSERT INTO credencial (usuario_id,correo,hash_contrasena) VALUES (?,?,?)',
        [c.usuarioId, c.correo, c.hashContrasena],
      );
    }
    if (tieneComercio) {
      await conexion.query(
        'INSERT INTO carrito(id,usuario_id) SELECT id,id FROM usuario',
      );
      for (const { usuarioId, pedido: p } of PEDIDOS_SEMILLA_P3) {
        await conexion.query(
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
          await conexion.query(
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
      for (const p of PRODUCTOS_SEMILLA_P1)
        for (const v of p.variantes)
          await conexion.query('UPDATE variante SET stock=? WHERE id=?', [
            v.stock,
            v.id,
          ]);
    }
    if (tieneP4)
      await new SembrarP41795250404000().up({
        query: async (sql: string, params?: unknown[]) => {
          await conexion.query(sql, params);
        },
      } as QueryRunner);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  }
  // AUTO_INCREMENT como el dummy: siguiente usuario 3, siguiente direccion 4.
  await conexion.query('ALTER TABLE usuario AUTO_INCREMENT = 3');
  await conexion.query('ALTER TABLE direccion AUTO_INCREMENT = 4');
}

export async function conectarLaboratorio(): Promise<Connection> {
  return createConnection({
    timezone: 'Z',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
}
