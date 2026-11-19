import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearLooks1795250401000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'CREATE TABLE look_conjunto(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,creador_usuario_id INT UNSIGNED NULL,nombre LONGTEXT NOT NULL,precio_total DECIMAL(20,0) NOT NULL,FOREIGN KEY(creador_usuario_id) REFERENCES usuario(id),CHECK(precio_total BETWEEN 0 AND 9007199254740991)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE look_ocurrencia(look_id INT UNSIGNED NOT NULL,posicion INT UNSIGNED NOT NULL,variante_id BIGINT UNSIGNED NOT NULL,PRIMARY KEY(look_id,posicion),FOREIGN KEY(look_id) REFERENCES look_conjunto(id),FOREIGN KEY(variante_id) REFERENCES variante(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE look_guardado(usuario_id INT UNSIGNED NOT NULL,look_id INT UNSIGNED NOT NULL,PRIMARY KEY(usuario_id,look_id),FOREIGN KEY(usuario_id) REFERENCES usuario(id),FOREIGN KEY(look_id) REFERENCES look_conjunto(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE look_guardado');
    await q.query('DROP TABLE look_ocurrencia');
    await q.query('DROP TABLE look_conjunto');
  }
}
