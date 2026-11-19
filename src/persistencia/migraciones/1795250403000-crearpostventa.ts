import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearPostventa1795250403000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE pedido_item ADD UNIQUE KEY uq_p4_item_pedido(id,pedido_id)',
    );
    await q.query(
      "CREATE TABLE solicitud_postventa(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,pedido_id INT UNSIGNED NOT NULL,pedido_item_id INT UNSIGNED NOT NULL,tipo VARCHAR(20) NOT NULL,estado VARCHAR(20) NOT NULL,motivo LONGTEXT NOT NULL,nueva_variante_id BIGINT UNSIGNED NULL,metodo_entrega LONGTEXT NOT NULL,fecha_solicitud DATETIME(3) NOT NULL,FOREIGN KEY(pedido_id) REFERENCES pedido(id),FOREIGN KEY(pedido_item_id) REFERENCES pedido_item(id),FOREIGN KEY(pedido_item_id,pedido_id) REFERENCES pedido_item(id,pedido_id),FOREIGN KEY(nueva_variante_id) REFERENCES variante(id),CHECK(tipo IN ('cambio','devolucion')),CHECK(estado IN ('solicitada','aprobada','rechazada','completada')),CHECK((tipo='cambio' AND nueva_variante_id IS NOT NULL) OR (tipo='devolucion' AND nueva_variante_id IS NULL))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
    );
    await q.query(
      'CREATE TABLE postventa_evento(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,solicitud_id INT UNSIGNED NOT NULL,estado VARCHAR(20) NOT NULL,actor_id INT UNSIGNED NULL,fecha DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),resolucion TEXT NULL,FOREIGN KEY(solicitud_id) REFERENCES solicitud_postventa(id),FOREIGN KEY(actor_id) REFERENCES usuario(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE postventa_idempotencia(usuario_id INT UNSIGNED NOT NULL,clave VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,solicitud_id INT UNSIGNED NOT NULL,huella CHAR(64) NOT NULL,PRIMARY KEY(usuario_id,clave),FOREIGN KEY(usuario_id) REFERENCES usuario(id),FOREIGN KEY(solicitud_id) REFERENCES solicitud_postventa(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE postventa_idempotencia');
    await q.query('DROP TABLE postventa_evento');
    await q.query('DROP TABLE solicitud_postventa');
    await q.query('ALTER TABLE pedido_item DROP INDEX uq_p4_item_pedido');
  }
}
