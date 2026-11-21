import { DataSource } from 'typeorm';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import type { EntityMetadata } from 'typeorm/metadata/EntityMetadata';
import { opcionesMysql } from '../src/persistencia/mysql.datasource';
import {
  ESQUEMA_ESPERADO,
  MIGRACIONES_ESPERADAS,
  claveForanea,
  type TablaEsperada,
} from './utilidades/esquema-esperado';

/** Construye metadatos sin abrir conexion (buildMetadatas es protegido). */
class MetadatosSinConexion extends DataSource {
  cargarMetadatos(): Promise<void> {
    return this.buildMetadatas();
  }
}

/** Valores ficticios: solo satisfacen la validacion; nunca se conecta. */
const ENTORNO_SIN_CONEXION = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USERNAME: 'sin_conexion',
  DB_PASSWORD: 'sin-conexion',
  DB_DATABASE: 'sin_conexion',
};

/**
 * Diferencias admitidas entre las entidades y el DDL. Vacia: toda diferencia
 * nueva hace fallar la prueba. Si alguna vez se admite una, debe quedar aqui
 * con su justificacion y un cambio previsto para eliminarla.
 */
const DIFERENCIAS_CONOCIDAS: string[] = [];

/** FK que las entidades declaran como relacion TypeORM. */
const FORANEAS_MAPEADAS_EN_TYPEORM = [
  'credencial(usuario_id)->usuario(id)',
  'direccion(usuario_id)->usuario(id)',
  'producto(categoria_id)->categoria(id)',
  'producto_color(producto_id)->producto(id)',
  'producto_imagen(producto_id)->producto(id)',
  'producto_talla(producto_id)->producto(id)',
  'variante(producto_id)->producto(id)',
];

const ordenar = (valores: string[]): string[] => [...valores].sort();

/** Tipo de la entidad expresado como COLUMN_TYPE normalizado de MySQL. */
function tipoDeEntidad(columna: ColumnMetadata): string {
  const tipo = String(columna.type).toLowerCase();
  let resultado = tipo === 'boolean' ? 'tinyint' : tipo;
  if (resultado === 'varchar' || resultado === 'char') {
    resultado += `(${columna.length})`;
  } else if (resultado === 'decimal') {
    resultado += `(${columna.precision ?? 10},${columna.scale ?? 0})`;
  } else if (resultado === 'datetime' && columna.precision != null) {
    resultado += `(${columna.precision})`;
  }
  return columna.unsigned ? resultado + ' unsigned' : resultado;
}

function diferenciasDeTabla(
  entidad: EntityMetadata,
  esperada: TablaEsperada,
): string[] {
  const tabla = entidad.tableName;
  const diferencias: string[] = [];
  const columnasEsperadas = new Map(
    esperada.columnas.map((c) => [c.nombre, c]),
  );
  const columnasEntidad = new Map(
    entidad.columns.map((c) => [c.databaseName, c]),
  );

  for (const nombre of columnasEsperadas.keys()) {
    if (!columnasEntidad.has(nombre)) {
      diferencias.push(`${tabla}.${nombre}: columna sin mapear en la entidad`);
    }
  }
  for (const [nombre, columna] of columnasEntidad) {
    const esperadaColumna = columnasEsperadas.get(nombre);
    if (!esperadaColumna) {
      diferencias.push(`${tabla}.${nombre}: columna inexistente en el DDL`);
      continue;
    }
    const tipo = tipoDeEntidad(columna);
    if (tipo !== esperadaColumna.tipo) {
      diferencias.push(
        `${tabla}.${nombre}: tipo ${tipo} frente a ${esperadaColumna.tipo}`,
      );
    }
    if (columna.isNullable !== (esperadaColumna.nulo ?? false)) {
      diferencias.push(`${tabla}.${nombre}: nulabilidad distinta`);
    }
    const autoIncremento = columna.generationStrategy === 'increment';
    if (autoIncremento !== (esperadaColumna.autoIncremento ?? false)) {
      diferencias.push(`${tabla}.${nombre}: AUTO_INCREMENT distinto`);
    }
    if (
      esperadaColumna.cotejamiento &&
      columna.collation !== esperadaColumna.cotejamiento
    ) {
      diferencias.push(
        `${tabla}.${nombre}: cotejamiento ${columna.collation ?? '(no declarado)'} ` +
          `frente a ${esperadaColumna.cotejamiento}`,
      );
    }
  }

  const pkEntidad = ordenar(entidad.primaryColumns.map((c) => c.databaseName));
  const pkEsperada = ordenar(esperada.clavePrimaria);
  if (pkEntidad.join() !== pkEsperada.join()) {
    diferencias.push(
      `${tabla}: clave primaria [${pkEntidad.join(',')}] frente a [${pkEsperada.join(',')}]`,
    );
  }

  for (const indice of entidad.indices) {
    const columnas = indice.columns.map((c) => c.databaseName);
    const esperado = esperada.indices.find((i) => i.nombre === indice.name);
    if (
      !esperado ||
      esperado.unico !== indice.isUnique ||
      esperado.columnas.join() !== columnas.join()
    ) {
      diferencias.push(
        `${tabla}: indice ${indice.name ?? '(sin nombre)'} (${columnas.join(',')}) sin equivalente en el DDL`,
      );
    }
  }

  for (const foranea of entidad.foreignKeys) {
    const clave = claveForanea(tabla, {
      columnas: foranea.columnNames,
      tablaReferida: foranea.referencedTablePath,
      columnasReferidas: foranea.referencedColumnNames,
    });
    const esperada2 = esperada.foraneas.find(
      (f) => claveForanea(tabla, f) === clave,
    );
    if (!esperada2) {
      diferencias.push(`${clave}: FK de la entidad inexistente en el DDL`);
      continue;
    }
    const alBorrar = foranea.onDelete ?? 'RESTRICT';
    const alActualizar = foranea.onUpdate ?? 'RESTRICT';
    if (
      alBorrar !== esperada2.alBorrar ||
      alActualizar !== esperada2.alActualizar
    ) {
      diferencias.push(`${clave}: acciones referenciales distintas`);
    }
    // Los nombres generados por TypeORM empiezan por FK_; solo se comparan
    // los declarados con foreignKeyConstraintName.
    if (
      foranea.name &&
      !foranea.name.startsWith('FK_') &&
      foranea.name !== esperada2.nombre
    ) {
      diferencias.push(
        `${clave}: nombre ${foranea.name} frente a ${esperada2.nombre}`,
      );
    }
  }
  return diferencias;
}

describe('Correspondencia entre entidades TypeORM y DDL de las migraciones', () => {
  let entidades: EntityMetadata[];
  const opciones = opcionesMysql(ENTORNO_SIN_CONEXION);

  beforeAll(async () => {
    const fuente = new MetadatosSinConexion(opciones);
    await fuente.cargarMetadatos();
    entidades = fuente.entityMetadatas;
  });

  it('registra las migraciones del contrato en su orden', () => {
    const nombres = (opciones.migrations as { name: string }[]).map(
      (m) => m.name,
    );
    expect(nombres).toEqual([...MIGRACIONES_ESPERADAS]);
  });

  it('mapea una entidad por cada tabla de dominio y ninguna adicional', () => {
    expect(ordenar(entidades.map((e) => e.tableName))).toEqual(
      ordenar(Object.keys(ESQUEMA_ESPERADO)),
    );
  });

  it('coincide en columnas, tipos, PK, indices y FK sin diferencias no admitidas', () => {
    const diferencias = entidades.flatMap((entidad) =>
      diferenciasDeTabla(entidad, ESQUEMA_ESPERADO[entidad.tableName]),
    );
    expect(ordenar(diferencias)).toEqual(ordenar(DIFERENCIAS_CONOCIDAS));
  });

  it('favorito usa la PK (usuario_id, producto_id) y orden como AUTO_INCREMENT unico', () => {
    const favorito = entidades.find((e) => e.tableName === 'favorito');
    expect(favorito).toBeDefined();
    expect(
      ordenar(favorito!.primaryColumns.map((c) => c.databaseName)),
    ).toEqual(['producto_id', 'usuario_id']);
    const orden = favorito!.findColumnWithDatabaseName('orden');
    expect(orden?.isPrimary).toBe(false);
    expect(orden?.generationStrategy).toBe('increment');
    expect(orden?.isInsert).toBe(false);
    expect(
      favorito!.indices.map((i) => [
        i.name,
        i.isUnique,
        i.columns.map((c) => c.databaseName).join(),
      ]),
    ).toContainEqual(['orden', true, 'orden']);
  });

  it('declara como relacion solo las FK documentadas; el resto existe solo en MySQL', () => {
    const mapeadas = entidades.flatMap((entidad) =>
      entidad.foreignKeys.map((f) =>
        claveForanea(entidad.tableName, {
          columnas: f.columnNames,
          tablaReferida: f.referencedTablePath,
          columnasReferidas: f.referencedColumnNames,
        }),
      ),
    );
    expect(ordenar(mapeadas)).toEqual(ordenar(FORANEAS_MAPEADAS_EN_TYPEORM));
    const total = Object.entries(ESQUEMA_ESPERADO).reduce(
      (suma, [, tabla]) => suma + tabla.foraneas.length,
      0,
    );
    expect(total - mapeadas.length).toBeGreaterThan(0);
  });

  it('el contrato es internamente coherente', () => {
    for (const [tabla, definicion] of Object.entries(ESQUEMA_ESPERADO)) {
      const columnas = new Set(definicion.columnas.map((c) => c.nombre));
      const usadas = [
        ...definicion.clavePrimaria,
        ...definicion.indices.flatMap((i) => i.columnas),
        ...definicion.foraneas.flatMap((f) => f.columnas),
      ];
      for (const nombre of usadas) {
        expect(`${tabla}.${nombre}:${columnas.has(nombre)}`).toBe(
          `${tabla}.${nombre}:true`,
        );
      }
      for (const f of definicion.foraneas) {
        const referida = ESQUEMA_ESPERADO[f.tablaReferida];
        expect(referida).toBeDefined();
        const clavesReferidas = [
          referida.clavePrimaria,
          ...referida.indices.filter((i) => i.unico).map((i) => i.columnas),
        ].map((c) => c.join());
        // Toda FK apunta a la PK o a un UNIQUE de la tabla referida.
        expect(clavesReferidas).toContain(f.columnasReferidas.join());
      }
      expect(definicion.checksConNombre.length).toBeLessThanOrEqual(
        definicion.totalChecks,
      );
    }
  });
});
