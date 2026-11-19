import type { Connection } from 'mysql2/promise';
import {
  conectarLaboratorio,
  laboratorioDesechable,
  reiniciarIdentidadSql,
} from './estado-identidad-sql';

/**
 * Solo para la bateria H2 en modo hibrido del laboratorio desechable
 * (STYLENOW_REINICIO_SQL_POR_PRUEBA=1): cada prueba parte del estado semilla,
 * igual que el adaptador dummy en una app nueva. En cualquier otro caso no
 * hace nada.
 */
if (
  process.env.STYLENOW_REINICIO_SQL_POR_PRUEBA === '1' &&
  laboratorioDesechable()
) {
  let conexion: Connection;
  beforeAll(async () => {
    conexion = await conectarLaboratorio();
  });
  beforeEach(async () => {
    await reiniciarIdentidadSql(conexion);
  });
  afterAll(async () => {
    await conexion?.end();
  });
}
