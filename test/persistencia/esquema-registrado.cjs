/**
 * Tablas y migraciones que registra la aplicacion compilada (dist). Los
 * arneses comparan MySQL contra esto en lugar de listas fijas, para que una
 * migracion nueva no invalide las verificaciones de fases anteriores.
 */
const path = require('node:path');

async function esquemaRegistrado(repo, config) {
  const { DataSource } = require(path.join(repo, 'node_modules', 'typeorm'));
  const { opcionesMysql } = require(path.join(repo, 'dist', 'persistencia', 'mysql.datasource.js'));
  const opciones = opcionesMysql(config);
  const fuente = new DataSource(opciones);
  // Solo construye metadatos; no abre conexion.
  await fuente.buildMetadatas();
  return {
    tablas: fuente.entityMetadatas.map((e) => e.tableName).sort(),
    migraciones: opciones.migrations.map((m) => m.name),
  };
}

module.exports = { esquemaRegistrado };
