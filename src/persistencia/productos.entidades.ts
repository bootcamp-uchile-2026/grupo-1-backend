import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Categoria } from './entidades';

/** BIGINT/DECIMAL llegan como texto: nunca redondear fuera del rango HTTP. */
export const enteroSeguro = {
  to(value: number): number {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('Entero de persistencia fuera de rango');
    }
    return value;
  },
  from(value: string | number): number {
    const numero = Number(value);
    if (!Number.isSafeInteger(numero) || numero < 0) {
      throw new Error('Entero de persistencia fuera de rango');
    }
    return numero;
  },
};

@Entity('producto')
@Index('ix_producto_categoria', ['categoriaId'])
export class Producto {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: enteroSeguro })
  id!: number;
  @Column({ name: 'categoria_id', type: 'int', unsigned: true })
  categoriaId!: number;
  @ManyToOne(() => Categoria, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'categoria_id',
    foreignKeyConstraintName: 'fk_producto_categoria',
  })
  categoria!: Categoria;
  @Column({ type: 'longtext' }) nombre!: string;
  @Column({
    type: 'decimal',
    precision: 20,
    scale: 0,
    transformer: enteroSeguro,
  })
  precio!: number;
  @Column({ name: 'imagen_url', type: 'longtext' }) imagenUrl!: string;
  @Column({ type: 'boolean' }) novedad!: boolean;
  @Column({ type: 'boolean' }) oferta!: boolean;
  @Column({ type: 'longtext' }) descripcion!: string;
  @Column({ type: 'double' }) calificacion!: number;
  @Column({ name: 'guia_tallas', type: 'longtext' }) guiaTallas!: string;
}

@Entity('variante')
@Index('uq_variante_posicion', ['productoId', 'posicion'], { unique: true })
export class Variante {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: enteroSeguro })
  id!: number;
  @Column({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
  @ManyToOne(() => Producto, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'producto_id',
    foreignKeyConstraintName: 'fk_variante_producto',
  })
  producto!: Producto;
  @Column({ type: 'int', unsigned: true }) posicion!: number;
  @Column({ type: 'longtext' }) color!: string;
  @Column({ type: 'longtext' }) talla!: string;
  @Column({ type: 'bigint', unsigned: true, transformer: enteroSeguro })
  stock!: number;
}

@Entity('producto_imagen')
export class ProductoImagen {
  @PrimaryColumn({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
  @PrimaryColumn({ type: 'int', unsigned: true }) posicion!: number;
  @ManyToOne(() => Producto, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'producto_id',
    foreignKeyConstraintName: 'fk_producto_imagen_producto',
  })
  producto!: Producto;
  @Column({ type: 'longtext' }) url!: string;
}

@Entity('producto_color')
export class ProductoColor {
  @PrimaryColumn({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
  @PrimaryColumn({ type: 'int', unsigned: true }) posicion!: number;
  @ManyToOne(() => Producto, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'producto_id',
    foreignKeyConstraintName: 'fk_producto_color_producto',
  })
  producto!: Producto;
  @Column({ type: 'longtext' }) color!: string;
}

@Entity('producto_talla')
export class ProductoTalla {
  @PrimaryColumn({
    name: 'producto_id',
    type: 'bigint',
    unsigned: true,
    transformer: enteroSeguro,
  })
  productoId!: number;
  @PrimaryColumn({ type: 'int', unsigned: true }) posicion!: number;
  @ManyToOne(() => Producto, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'producto_id',
    foreignKeyConstraintName: 'fk_producto_talla_producto',
  })
  producto!: Producto;
  @Column({ type: 'longtext' }) talla!: string;
}
