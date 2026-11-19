import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import type { SnapshotCheckout } from '../dominio/modelos';
import { enteroSeguro } from './productos.entidades';
@Entity('carrito')
export class CarritoFila {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id!: number;
  @Column({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
}
@Entity('carrito_item')
export class CarritoItemFila {
  @PrimaryColumn({ name: 'carrito_id', type: 'int', unsigned: true })
  carritoId!: number;
  @PrimaryColumn({
    name: 'variante_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  varianteId!: number;
  @Column({
    name: 'cantidad',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  cantidad!: number;
  @Column({ name: 'posicion', type: 'int', unsigned: true }) posicion!: number;
}
@Entity('favorito')
export class FavoritoFila {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true }) orden!: number;
  @PrimaryColumn({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
  @PrimaryColumn({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
}
@Entity('pedido')
export class PedidoFila {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id!: number;
  @Column({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
  @Column({ name: 'numero_pedido', type: 'varchar', length: 80 })
  numeroPedido!: string;
  @Column({ name: 'estado', type: 'varchar', length: 30 }) estado!: string;
  @Column({ name: 'fecha', type: 'datetime', precision: 3 }) fecha!: Date;
  @Column({
    name: 'costo_envio',
    type: 'decimal',
    precision: 20,
    scale: 0,
    transformer: enteroSeguro,
  })
  costoEnvio!: number;
  @Column({ name: 'metodo_pago', type: 'longtext' }) metodoPago!: string;
  @Column({ name: 'checkout', type: 'json', nullable: true })
  checkout!: SnapshotCheckout | null;
  @Column({
    name: 'clave_idempotencia',
    type: 'varchar',
    length: 128,
    nullable: true,
    charset: 'ascii',
    collation: 'ascii_bin',
  })
  claveIdempotencia!: string | null;
  @Column({ name: 'huella', type: 'varchar', length: 64, nullable: true })
  huella!: string | null;
}
@Entity('pedido_item')
export class PedidoItemFila {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id!: number;
  @Column({ name: 'pedido_id', type: 'int', unsigned: true }) pedidoId!: number;
  @Column({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
  @Column({
    name: 'variante_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  varianteId!: number;
  @Column({ name: 'posicion', type: 'int', unsigned: true }) posicion!: number;
  @Column({ name: 'nombre', type: 'longtext' }) nombre!: string;
  @Column({
    name: 'cantidad',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  cantidad!: number;
  @Column({
    name: 'precio_unitario',
    type: 'decimal',
    precision: 20,
    scale: 0,
    transformer: enteroSeguro,
  })
  precioUnitario!: number;
}
