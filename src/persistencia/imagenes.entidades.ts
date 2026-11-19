import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permiso_usuario')
export class PermisoUsuario {
  @PrimaryColumn({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
  @PrimaryColumn({ type: 'varchar', length: 80 }) permiso!: string;
}

@Entity('carga_imagen')
export class CargaImagen {
  @PrimaryColumn({ type: 'varchar', length: 50 }) archivo!: string;
  @Column({ name: 'producto_id', type: 'bigint', unsigned: true })
  productoId!: string;
  @Column({ name: 'actor_id', type: 'int', unsigned: true }) actorId!: number;
  @Column({ type: 'varchar', length: 20 }) estado!:
    'pendiente' | 'publicada' | 'fallida' | 'colision';
  @Column({ type: 'char', length: 64 }) sha256!: string;
  @Column({ type: 'int', unsigned: true }) bytes!: number;
  @Column({
    name: 'creada_en',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  creadaEn!: Date;
}
