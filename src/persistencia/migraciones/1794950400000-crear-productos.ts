import { MigrationInterface, QueryRunner } from 'typeorm';

/** P1: esquema nuevo; M01/S01 permanecen intactas. DDL MySQL no es atomico. */
export class CrearProductos1794950400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE producto (
  id BIGINT UNSIGNED NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  nombre LONGTEXT NOT NULL,
  precio DECIMAL(20,0) NOT NULL,
  imagen_url LONGTEXT NOT NULL,
  novedad TINYINT NOT NULL,
  oferta TINYINT NOT NULL,
  descripcion LONGTEXT NOT NULL,
  calificacion DOUBLE NOT NULL,
  guia_tallas LONGTEXT NOT NULL,
  PRIMARY KEY (id),
  KEY ix_producto_categoria (categoria_id),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_producto_0 CHECK (id BETWEEN 1 AND 9007199254740991),
  CONSTRAINT ck_producto_1 CHECK (precio BETWEEN 0 AND 9007199254740991),
  CONSTRAINT ck_producto_2 CHECK (novedad IN (0,1)),
  CONSTRAINT ck_producto_3 CHECK (oferta IN (0,1)),
  CONSTRAINT ck_producto_4 CHECK (calificacion BETWEEN 0 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE variante (
  id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  color LONGTEXT NOT NULL,
  talla LONGTEXT NOT NULL,
  stock BIGINT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variante_posicion (producto_id, posicion),
  CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_variante_0 CHECK (id BETWEEN 1 AND 9007199254740991),
  CONSTRAINT ck_variante_1 CHECK (stock BETWEEN 0 AND 9007199254740991)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE producto_imagen (
  producto_id BIGINT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  url LONGTEXT NOT NULL,
  PRIMARY KEY (producto_id, posicion),
  CONSTRAINT fk_producto_imagen_producto FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE producto_color (
  producto_id BIGINT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  color LONGTEXT NOT NULL,
  PRIMARY KEY (producto_id, posicion),
  CONSTRAINT fk_producto_color_producto FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
    await q.query(
      `CREATE TABLE producto_talla (
  producto_id BIGINT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  talla LONGTEXT NOT NULL,
  PRIMARY KEY (producto_id, posicion),
  CONSTRAINT fk_producto_talla_producto FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE `producto_talla`');
    await q.query('DROP TABLE `producto_color`');
    await q.query('DROP TABLE `producto_imagen`');
    await q.query('DROP TABLE `variante`');
    await q.query('DROP TABLE `producto`');
  }
}
