import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * P2 / M03: usuario, credencial (solo hash) y direccion. M01/S01/M02/S02 no
 * se modifican. Textos libres en MEDIUMTEXT porque los DTO H2 aun no fijan
 * maximos (F5 pendiente): un texto aceptado por la API nunca falla en SQL.
 * DDL MySQL no es atomico: un fallo parcial requiere inspeccion manual.
 */
export class CrearIdentidad1795050400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE usuario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre MEDIUMTEXT NOT NULL,
  apellido MEDIUMTEXT NOT NULL,
  email VARCHAR(320) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  telefono MEDIUMTEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE credencial (
  usuario_id INT UNSIGNED NOT NULL,
  correo VARCHAR(320) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  hash_contrasena VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actualizada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (usuario_id),
  UNIQUE KEY uq_credencial_correo (correo),
  CONSTRAINT fk_credencial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_credencial_hash CHECK (hash_contrasena LIKE 'scrypt$%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE direccion (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  nombre MEDIUMTEXT NOT NULL,
  calle MEDIUMTEXT NOT NULL,
  numero MEDIUMTEXT NOT NULL,
  departamento MEDIUMTEXT NULL,
  comuna MEDIUMTEXT NOT NULL,
  region MEDIUMTEXT NOT NULL,
  principal TINYINT NOT NULL,
  PRIMARY KEY (id),
  KEY ix_direccion_usuario (usuario_id),
  CONSTRAINT fk_direccion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_direccion_principal CHECK (principal IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE `direccion`');
    await q.query('DROP TABLE `credencial`');
    await q.query('DROP TABLE `usuario`');
  }
}
