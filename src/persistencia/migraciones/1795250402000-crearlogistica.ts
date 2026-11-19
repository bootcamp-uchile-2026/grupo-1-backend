import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearLogistica1795250402000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "CREATE TABLE envio(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,pedido_id INT UNSIGNED NOT NULL UNIQUE,estado VARCHAR(20) NOT NULL,despachado_en DATETIME(3) NULL,FOREIGN KEY(pedido_id) REFERENCES pedido(id),CHECK(estado IN ('PENDING','PREPARING','SHIPPED','DELIVERED','CANCELLED')),CHECK((estado IN ('SHIPPED','DELIVERED') AND despachado_en IS NOT NULL) OR (estado IN ('PENDING','PREPARING','CANCELLED') AND despachado_en IS NULL))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
    );
    await q.query(
      'CREATE TABLE envio_evento(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,envio_id INT UNSIGNED NOT NULL,anterior VARCHAR(20) NULL,nuevo VARCHAR(20) NOT NULL,actor_id INT UNSIGNED NOT NULL,fecha DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),motivo TEXT NULL,FOREIGN KEY(envio_id) REFERENCES envio(id),FOREIGN KEY(actor_id) REFERENCES usuario(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE pedido_cancelacion(pedido_id INT UNSIGNED PRIMARY KEY,actor_id INT UNSIGNED NOT NULL,fecha DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),motivo TEXT NULL,restituido BOOLEAN NOT NULL DEFAULT 0,FOREIGN KEY(pedido_id) REFERENCES pedido(id),FOREIGN KEY(actor_id) REFERENCES usuario(id),CHECK(restituido IN (0,1))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE inventario_pedido(pedido_id INT UNSIGNED NOT NULL,variante_id BIGINT UNSIGNED NOT NULL,cantidad BIGINT UNSIGNED NOT NULL,restituido BOOLEAN NOT NULL DEFAULT 0,PRIMARY KEY(pedido_id,variante_id),FOREIGN KEY(pedido_id) REFERENCES pedido(id),FOREIGN KEY(variante_id) REFERENCES variante(id),CHECK(cantidad BETWEEN 1 AND 9007199254740991),CHECK(restituido IN (0,1))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE inventario_pedido');
    await q.query('DROP TABLE pedido_cancelacion');
    await q.query('DROP TABLE envio_evento');
    await q.query('DROP TABLE envio');
  }
}
