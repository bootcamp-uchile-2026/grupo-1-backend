import { EntitySchema } from 'typeorm';
export const AlertaSql = new EntitySchema({
  name: 'alerta',
  tableName: 'alerta',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    usuario_id: { type: 'int', unsigned: true },
    tipo: { type: 'varchar', length: 20 },
    producto_id: { type: 'bigint', unsigned: true },
    variante_id: { type: 'bigint', unsigned: true, nullable: true },
    precio_objetivo: { type: 'double', nullable: true },
    estado: { type: 'varchar', length: 20 },
  },
});
export const LookSql = new EntitySchema({
  name: 'look_conjunto',
  tableName: 'look_conjunto',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    creador_usuario_id: { type: 'int', unsigned: true, nullable: true },
    nombre: { type: 'longtext' },
    precio_total: { type: 'decimal', precision: 20, scale: 0 },
  },
});
export const LookOcurrenciaSql = new EntitySchema({
  name: 'look_ocurrencia',
  tableName: 'look_ocurrencia',
  columns: {
    look_id: { type: 'int', unsigned: true, primary: true },
    posicion: { type: 'int', unsigned: true, primary: true },
    variante_id: { type: 'bigint', unsigned: true },
  },
});
export const LookGuardadoSql = new EntitySchema({
  name: 'look_guardado',
  tableName: 'look_guardado',
  columns: {
    usuario_id: { type: 'int', unsigned: true, primary: true },
    look_id: { type: 'int', unsigned: true, primary: true },
  },
});
export const EnvioSql = new EntitySchema({
  name: 'envio',
  tableName: 'envio',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    pedido_id: { type: 'int', unsigned: true },
    estado: { type: 'varchar', length: 20 },
    despachado_en: { type: 'datetime', nullable: true, precision: 3 },
  },
});
export const EnvioEventoSql = new EntitySchema({
  name: 'envio_evento',
  tableName: 'envio_evento',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    envio_id: { type: 'int', unsigned: true },
    anterior: { type: 'varchar', nullable: true, length: 20 },
    nuevo: { type: 'varchar', length: 20 },
    actor_id: { type: 'int', unsigned: true },
    fecha: { type: 'datetime', precision: 3 },
    motivo: { type: 'text', nullable: true },
  },
});
export const PedidoCancelacionSql = new EntitySchema({
  name: 'pedido_cancelacion',
  tableName: 'pedido_cancelacion',
  columns: {
    pedido_id: { type: 'int', unsigned: true, primary: true },
    actor_id: { type: 'int', unsigned: true },
    fecha: { type: 'datetime', precision: 3 },
    motivo: { type: 'text', nullable: true },
    restituido: { type: 'tinyint' },
  },
});
export const InventarioPedidoSql = new EntitySchema({
  name: 'inventario_pedido',
  tableName: 'inventario_pedido',
  columns: {
    pedido_id: { type: 'int', unsigned: true, primary: true },
    variante_id: { type: 'bigint', unsigned: true, primary: true },
    cantidad: { type: 'bigint', unsigned: true },
    restituido: { type: 'tinyint' },
  },
});
export const SolicitudPostventaSql = new EntitySchema({
  name: 'solicitud_postventa',
  tableName: 'solicitud_postventa',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    pedido_id: { type: 'int', unsigned: true },
    pedido_item_id: { type: 'int', unsigned: true },
    tipo: { type: 'varchar', length: 20 },
    estado: { type: 'varchar', length: 20 },
    motivo: { type: 'longtext' },
    nueva_variante_id: { type: 'bigint', unsigned: true, nullable: true },
    metodo_entrega: { type: 'longtext' },
    fecha_solicitud: { type: 'datetime', precision: 3 },
  },
});
export const PostventaEventoSql = new EntitySchema({
  name: 'postventa_evento',
  tableName: 'postventa_evento',
  columns: {
    id: { type: 'int', unsigned: true, primary: true, generated: 'increment' },
    solicitud_id: { type: 'int', unsigned: true },
    estado: { type: 'varchar', length: 20 },
    actor_id: { type: 'int', unsigned: true, nullable: true },
    fecha: { type: 'datetime', precision: 3 },
    resolucion: { type: 'text', nullable: true },
  },
});
export const PostventaIdempotenciaSql = new EntitySchema({
  name: 'postventa_idempotencia',
  tableName: 'postventa_idempotencia',
  columns: {
    usuario_id: { type: 'int', unsigned: true, primary: true },
    clave: {
      type: 'varchar',
      length: 128,
      primary: true,
      charset: 'ascii',
      collation: 'ascii_bin',
    },
    solicitud_id: { type: 'int', unsigned: true },
    huella: { type: 'char', length: 64 },
  },
});
export const ENTIDADES_P4 = [
  AlertaSql,
  LookSql,
  LookOcurrenciaSql,
  LookGuardadoSql,
  EnvioSql,
  EnvioEventoSql,
  PedidoCancelacionSql,
  InventarioPedidoSql,
  SolicitudPostventaSql,
  PostventaEventoSql,
  PostventaIdempotenciaSql,
];
