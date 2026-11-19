import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Usuario (perfil). El email se guarda normalizado y es unico. */
@Entity('usuario')
export class UsuarioFila {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;
  @Column({ type: 'mediumtext' }) nombre!: string;
  @Column({ type: 'mediumtext' }) apellido!: string;
  @Index('uq_usuario_email', { unique: true })
  @Column({ type: 'varchar', length: 320, collation: 'utf8mb4_bin' })
  email!: string;
  @Column({ type: 'mediumtext', nullable: true }) telefono!: string | null;
}

/** Credencial 1:1 con el usuario. Solo guarda el hash, nunca la contrasena. */
@Entity('credencial')
export class CredencialFila {
  @PrimaryColumn({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
  @OneToOne(() => UsuarioFila, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'usuario_id',
    foreignKeyConstraintName: 'fk_credencial_usuario',
  })
  usuario!: UsuarioFila;
  @Index('uq_credencial_correo', { unique: true })
  @Column({ type: 'varchar', length: 320, collation: 'utf8mb4_bin' })
  correo!: string;
  @Column({
    name: 'hash_contrasena',
    type: 'varchar',
    length: 255,
    charset: 'ascii',
    collation: 'ascii_bin',
  })
  hashContrasena!: string;
  @Column({
    name: 'actualizada_en',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  actualizadaEn!: Date;
}

/** Direccion de despacho; pertenece a un usuario. */
@Entity('direccion')
@Index('ix_direccion_usuario', ['usuarioId'])
export class DireccionFila {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;
  @Column({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId!: number;
  @ManyToOne(() => UsuarioFila, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'usuario_id',
    foreignKeyConstraintName: 'fk_direccion_usuario',
  })
  usuario!: UsuarioFila;
  @Column({ type: 'mediumtext' }) nombre!: string;
  @Column({ type: 'mediumtext' }) calle!: string;
  @Column({ type: 'mediumtext' }) numero!: string;
  @Column({ type: 'mediumtext', nullable: true }) departamento!: string | null;
  @Column({ type: 'mediumtext' }) comuna!: string;
  @Column({ type: 'mediumtext' }) region!: string;
  @Column({ type: 'boolean' }) principal!: boolean;
}
