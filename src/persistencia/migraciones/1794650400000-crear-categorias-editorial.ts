import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearCategoriasEditorial1794650400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'CREATE TABLE `categoria` (id INT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(80) NOT NULL, slug VARCHAR(80) NOT NULL, imagen_url VARCHAR(500) NOT NULL, destacada TINYINT NOT NULL DEFAULT 0, orden SMALLINT UNSIGNED NOT NULL, PRIMARY KEY(id), UNIQUE KEY uq_categoria_slug(slug), KEY ix_categoria_destacada_orden(destacada, orden)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE `coleccion` (id INT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(150) NOT NULL, descripcion TEXT NOT NULL, imagen_url VARCHAR(500) NOT NULL, PRIMARY KEY(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE `post` (id INT UNSIGNED NOT NULL AUTO_INCREMENT, titulo VARCHAR(150) NOT NULL, contenido TEXT NOT NULL, imagen_url VARCHAR(500) NOT NULL, PRIMARY KEY(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    for (const table of ['post', 'coleccion', 'categoria'])
      await q.query('DROP TABLE ' + table);
  }
}
