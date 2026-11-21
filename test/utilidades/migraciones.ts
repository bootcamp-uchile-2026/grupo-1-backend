import { DataSource } from 'typeorm';
import { Categoria, Coleccion, Post } from '../../src/persistencia/entidades';
import {
  CredencialFila,
  DireccionFila,
  UsuarioFila,
} from '../../src/persistencia/identidad.entidades';
import { opcionesMysql } from '../../src/persistencia/mysql.datasource';
import {
  Producto,
  ProductoColor,
  ProductoImagen,
  ProductoTalla,
  Variante,
} from '../../src/persistencia/productos.entidades';
import { MIGRACIONES_ESPERADAS } from './esquema-esperado';

/**
 * Utilidades de migraciones para las suites SQL. Las pruebas comparan contra
 * las migraciones registradas en el DataSource y contra el contrato del
 * esquema, nunca contra cantidades fijas: una migracion nueva no rompe las
 * suites anteriores y una migracion faltante o desordenada si las rompe.
 */

/** Nombres de las migraciones registradas, en el orden en que se ejecutan. */
export function migracionesRegistradas(fuente: DataSource): string[] {
  return fuente.migrations.map((m) => m.name ?? m.constructor.name);
}

/** Nombres de las migraciones aplicadas en la base, en orden de aplicacion. */
export async function migracionesAplicadas(
  fuente: DataSource,
): Promise<string[]> {
  const filas = await fuente.query<{ name: string }[]>(
    'SELECT name FROM migrations ORDER BY id',
  );
  return filas.map((f) => f.name);
}

/**
 * Exige que las registradas coincidan con el contrato y que la base tenga
 * aplicadas exactamente esas, en el mismo orden.
 */
export async function verificarMigracionesCompletas(
  fuente: DataSource,
): Promise<void> {
  const registradas = migracionesRegistradas(fuente);
  expect(registradas).toEqual([...MIGRACIONES_ESPERADAS]);
  expect(await migracionesAplicadas(fuente)).toEqual(registradas);
}

/**
 * Revierte, desde la ultima hacia atras, todas las migraciones aplicadas a
 * partir de `primera` (incluida). Devuelve las revertidas en orden de
 * aplicacion, que es el orden en que runMigrations debe volver a aplicarlas.
 */
export async function revertirDesde(
  fuente: DataSource,
  primera: string,
): Promise<string[]> {
  const aplicadas = await migracionesAplicadas(fuente);
  const indice = aplicadas.indexOf(primera);
  if (indice < 0) throw new Error(`La migracion ${primera} no esta aplicada`);
  const revertidas = aplicadas.slice(indice);
  for (let i = 0; i < revertidas.length; i++) {
    await fuente.undoLastMigration();
  }
  expect(await migracionesAplicadas(fuente)).toEqual(
    aplicadas.slice(0, indice),
  );
  return revertidas;
}

/**
 * Entidades cuyo mapeo TypeORM declara todas sus FK e indices: para ellas el
 * schema builder no debe proponer cambios. Las demas entidades declaran solo
 * columnas a proposito (synchronize desactivado); su correspondencia con el
 * DDL la verifican esquema-typeorm.e2e-spec y esquema.mysql.e2e-spec.
 */
export const ENTIDADES_CON_MAPEO_COMPLETO = [
  Categoria,
  Coleccion,
  Post,
  Producto,
  Variante,
  ProductoImagen,
  ProductoColor,
  ProductoTalla,
  UsuarioFila,
  CredencialFila,
  DireccionFila,
];

/** Consultas que el schema builder propondria para esas entidades. */
export async function cambiosPendientesDeEsquema(): Promise<string[]> {
  const fuente = new DataSource({
    ...opcionesMysql(),
    entities: ENTIDADES_CON_MAPEO_COMPLETO,
    migrations: [],
  });
  await fuente.initialize();
  try {
    const registro = await fuente.driver.createSchemaBuilder().log();
    return registro.upQueries.map((q) => q.query);
  } finally {
    await fuente.destroy();
  }
}
