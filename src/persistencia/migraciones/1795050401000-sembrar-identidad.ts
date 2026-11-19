import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DIRECCIONES_SEMILLA_P2,
  USUARIOS_SEMILLA_P2,
} from './identidad-semilla-p2';

/**
 * P2 / S03: perfiles y direcciones sinteticos equivalentes a los fixtures H2.
 * Repetible: no sobrescribe filas existentes. Sin credenciales.
 */
export class SembrarIdentidad1795050401000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    for (const u of USUARIOS_SEMILLA_P2) {
      await q.query(
        'INSERT INTO usuario (id,nombre,apellido,email,telefono) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
        [u.id, u.nombre, u.apellido, u.email, u.telefono ?? null],
      );
    }
    for (const { usuarioId, direccion: d } of DIRECCIONES_SEMILLA_P2) {
      await q.query(
        'INSERT INTO direccion (id,usuario_id,nombre,calle,numero,departamento,comuna,region,principal) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
        [
          d.id,
          usuarioId,
          d.nombre,
          d.calle,
          d.numero,
          d.departamento ?? null,
          d.comuna,
          d.region,
          d.principal,
        ],
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DELETE FROM direccion WHERE id IN (1,2,3)');
    await q.query('DELETE FROM usuario WHERE id IN (1,2)');
  }
}
