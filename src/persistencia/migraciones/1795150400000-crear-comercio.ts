import { MigrationInterface, QueryRunner } from 'typeorm';
export class CrearComercio1795150400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'CREATE TABLE carrito (id int unsigned NOT NULL AUTO_INCREMENT,usuario_id int unsigned NOT NULL,PRIMARY KEY(id),UNIQUE KEY uq_carrito_usuario (usuario_id),FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE carrito_item (carrito_id int unsigned NOT NULL,variante_id bigint unsigned NOT NULL,cantidad bigint unsigned NOT NULL,posicion int unsigned NOT NULL,PRIMARY KEY(carrito_id,variante_id),UNIQUE KEY uq_carrito_posicion (carrito_id,posicion),FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE RESTRICT,FOREIGN KEY (variante_id) REFERENCES variante(id) ON DELETE RESTRICT,CHECK(cantidad BETWEEN 1 AND 9007199254740991)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE favorito (orden int unsigned NOT NULL AUTO_INCREMENT UNIQUE,usuario_id int unsigned NOT NULL,producto_id bigint unsigned NOT NULL,PRIMARY KEY(usuario_id,producto_id),FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE pedido (id int unsigned NOT NULL AUTO_INCREMENT,usuario_id int unsigned NOT NULL,numero_pedido varchar(80) NOT NULL,estado varchar(30) NOT NULL,fecha datetime(3) NOT NULL,costo_envio decimal(20,0) NOT NULL,metodo_pago longtext NOT NULL,checkout json NULL,clave_idempotencia varchar(128) CHARACTER SET ascii COLLATE ascii_bin NULL,huella varchar(64) NULL,PRIMARY KEY(id),UNIQUE KEY uq_pedido_numero(numero_pedido),UNIQUE KEY uq_pedido_idempotencia(usuario_id,clave_idempotencia),FOREIGN KEY(usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,CHECK(costo_envio BETWEEN 0 AND 9007199254740991)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query(
      'CREATE TABLE pedido_item (id int unsigned NOT NULL AUTO_INCREMENT,pedido_id int unsigned NOT NULL,producto_id bigint unsigned NOT NULL,variante_id bigint unsigned NOT NULL,posicion int unsigned NOT NULL,nombre longtext NOT NULL,cantidad bigint unsigned NOT NULL,precio_unitario decimal(20,0) NOT NULL,PRIMARY KEY(id),UNIQUE KEY uq_pedido_posicion(pedido_id,posicion),FOREIGN KEY(pedido_id) REFERENCES pedido(id) ON DELETE RESTRICT,FOREIGN KEY(producto_id) REFERENCES producto(id) ON DELETE RESTRICT,FOREIGN KEY(variante_id) REFERENCES variante(id) ON DELETE RESTRICT,CHECK(cantidad BETWEEN 1 AND 9007199254740991),CHECK(precio_unitario BETWEEN 0 AND 9007199254740991)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    );
    await q.query('INSERT INTO carrito(usuario_id) SELECT id FROM usuario');
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE pedido_item');
    await q.query('DROP TABLE pedido');
    await q.query('DROP TABLE favorito');
    await q.query('DROP TABLE carrito_item');
    await q.query('DROP TABLE carrito');
  }
}
