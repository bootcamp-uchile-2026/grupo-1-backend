import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearAlertas1795250400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE variante ADD UNIQUE KEY uq_p4_variante_producto(id,producto_id)',
    );
    await q.query(
      "CREATE TABLE alerta (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,usuario_id INT UNSIGNED NOT NULL,tipo VARCHAR(20) NOT NULL,producto_id BIGINT UNSIGNED NOT NULL,variante_id BIGINT UNSIGNED NULL,precio_objetivo DOUBLE NULL,estado VARCHAR(20) NOT NULL,FOREIGN KEY(usuario_id) REFERENCES usuario(id),FOREIGN KEY(producto_id) REFERENCES producto(id),FOREIGN KEY(variante_id) REFERENCES variante(id),FOREIGN KEY(variante_id,producto_id) REFERENCES variante(id,producto_id),CHECK(tipo IN ('precio','reposicion')),CHECK(estado IN ('activa','notificada','cancelada')),CHECK(precio_objetivo IS NULL OR precio_objetivo>0),CHECK((tipo='precio' AND variante_id IS NULL) OR (tipo='reposicion' AND precio_objetivo IS NULL))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE alerta');
    await q.query('ALTER TABLE variante DROP INDEX uq_p4_variante_producto');
  }
}
