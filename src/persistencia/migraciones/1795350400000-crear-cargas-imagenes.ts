import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearCargasImagenes1795350400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE permiso_usuario (
    usuario_id INT UNSIGNED NOT NULL, permiso VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    PRIMARY KEY(usuario_id,permiso), FOREIGN KEY(usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q.query(`CREATE TABLE carga_imagen (
    archivo VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL, actor_id INT UNSIGNED NOT NULL,
    estado VARCHAR(20) NOT NULL, sha256 CHAR(64) CHARACTER SET ascii NOT NULL,
    bytes INT UNSIGNED NOT NULL, creada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY ix_carga_estado_fecha(estado,creada_en),
    FOREIGN KEY(producto_id) REFERENCES producto(id) ON DELETE RESTRICT,
    FOREIGN KEY(actor_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    CHECK(estado IN ('pendiente','publicada','fallida','colision')),
    CHECK(bytes BETWEEN 1 AND 5242880)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE carga_imagen');
    await q.query('DROP TABLE permiso_usuario');
  }
}
