import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
@Entity('categoria')
@Index('uq_categoria_slug', ['slug'], { unique: true })
@Index('ix_categoria_destacada_orden', ['destacada', 'orden'])
export class Categoria {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true }) id!: number;
  @Column({ type: 'varchar', length: 80 }) nombre!: string;
  @Column({ type: 'varchar', length: 80 }) slug!: string;
  @Column({ name: 'imagen_url', type: 'varchar', length: 500 })
  imagenUrl!: string;
  @Column({ type: 'boolean', default: false }) destacada!: boolean;
  @Column({ type: 'smallint', unsigned: true }) orden!: number;
}
@Entity('coleccion')
export class Coleccion {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true }) id!: number;
  @Column({ type: 'varchar', length: 150 }) nombre!: string;
  @Column({ type: 'text' }) descripcion!: string;
  @Column({ name: 'imagen_url', type: 'varchar', length: 500 })
  imagenUrl!: string;
}
@Entity('post')
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true }) id!: number;
  @Column({ type: 'varchar', length: 150 }) titulo!: string;
  @Column({ type: 'text' }) contenido!: string;
  @Column({ name: 'imagen_url', type: 'varchar', length: 500 })
  imagenUrl!: string;
}
