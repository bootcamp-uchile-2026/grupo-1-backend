import { DataSource } from 'typeorm';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import {
  COTEJAMIENTO_TABLAS,
  ESQUEMA_ESPERADO,
  MIGRACIONES_ESPERADAS,
  claveForanea,
  normalizarAccion,
  normalizarTipoMysql,
} from './utilidades/esquema-esperado';
import { laboratorioDesechable } from './utilidades/estado-identidad-sql';

const sql = describe;
const ordenar = (valores: string[]): string[] => [...valores].sort();
const TABLAS = Object.keys(ESQUEMA_ESPERADO);

interface FilaColumna {
  tabla: string;
  columna: string;
  tipo: string;
  nulo: string;
  cotejamiento: string | null;
  extra: string;
}
interface FilaIndice {
  tabla: string;
  nombre: string;
  noUnico: number | string;
  columnas: string;
}
interface FilaForanea {
  tabla: string;
  nombre: string;
  columnas: string;
  tablaReferida: string;
  columnasReferidas: string;
  alBorrar: string;
  alActualizar: string;
}

/**
 * Compara INFORMATION_SCHEMA del laboratorio desechable con el contrato del
 * esquema. Solo ejecuta consultas de lectura sobre el catalogo.
 */
sql('Esquema MySQL real frente al contrato de migraciones', () => {
  let fuente: DataSource;
  const consultar = <T>(texto: string, parametros: unknown[] = []) =>
    fuente.query<T[]>(texto, parametros);

  beforeAll(async () => {
    if (!laboratorioDesechable()) throw new Error('Solo laboratorio');
    fuente = crearDataSourceMysql();
    await fuente.initialize();
    // Laboratorio recien creado: deja aplicadas las 14 migraciones.
    await fuente.runMigrations();
  });

  afterAll(async () => {
    if (fuente?.isInitialized) await fuente.destroy();
  });

  it('tiene aplicadas exactamente las 14 migraciones, en orden', async () => {
    const filas = await consultar<{ name: string }>(
      'SELECT name FROM migrations ORDER BY timestamp, id',
    );
    expect(filas.map((f) => f.name)).toEqual([...MIGRACIONES_ESPERADAS]);
  });

  it('contiene solo las tablas de dominio y la tabla tecnica migrations', async () => {
    const filas = await consultar<{
      tabla: string;
      motor: string;
      cotejamiento: string;
    }>(
      `SELECT TABLE_NAME tabla, ENGINE motor, TABLE_COLLATION cotejamiento
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
    );
    expect(ordenar(filas.map((f) => f.tabla))).toEqual(
      ordenar([...TABLAS, 'migrations']),
    );
    for (const fila of filas.filter((f) => f.tabla !== 'migrations')) {
      expect(`${fila.tabla}:${fila.motor}:${fila.cotejamiento}`).toBe(
        `${fila.tabla}:InnoDB:${COTEJAMIENTO_TABLAS}`,
      );
    }
  });

  it('coincide en columnas, tipos, nulabilidad, cotejamiento y AUTO_INCREMENT', async () => {
    const filas = await consultar<FilaColumna>(
      `SELECT TABLE_NAME tabla, COLUMN_NAME columna, COLUMN_TYPE tipo,
              IS_NULLABLE nulo, COLLATION_NAME cotejamiento, EXTRA extra
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
      [TABLAS],
    );
    const real = filas.map((f) => {
      const esperada = ESQUEMA_ESPERADO[f.tabla].columnas.find(
        (c) => c.nombre === f.columna,
      );
      const partes = [
        `${f.tabla}.${f.columna}`,
        normalizarTipoMysql(f.tipo),
        f.nulo === 'YES' ? 'NULL' : 'NOT NULL',
        /auto_increment/i.test(f.extra) ? 'AI' : '-',
      ];
      // El cotejamiento se compara solo donde el contrato lo fija.
      if (esperada?.cotejamiento) partes.push(f.cotejamiento ?? '');
      return partes.join(' ');
    });
    const esperado = Object.entries(ESQUEMA_ESPERADO).flatMap(([tabla, t]) =>
      t.columnas.map((c) => {
        const partes = [
          `${tabla}.${c.nombre}`,
          c.tipo,
          c.nulo ? 'NULL' : 'NOT NULL',
          c.autoIncremento ? 'AI' : '-',
        ];
        if (c.cotejamiento) partes.push(c.cotejamiento);
        return partes.join(' ');
      }),
    );
    expect(ordenar(real)).toEqual(ordenar(esperado));
  });

  it('coincide en claves primarias e indices UNIQUE o con nombre', async () => {
    const filas = await consultar<FilaIndice>(
      `SELECT TABLE_NAME tabla, INDEX_NAME nombre, NON_UNIQUE noUnico,
              GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) columnas
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)
       GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE`,
      [TABLAS],
    );
    const primarias = filas
      .filter((f) => f.nombre === 'PRIMARY')
      .map((f) => `${f.tabla}(${f.columnas})`);
    expect(ordenar(primarias)).toEqual(
      ordenar(
        TABLAS.map(
          (t) => `${t}(${ESQUEMA_ESPERADO[t].clavePrimaria.join(',')})`,
        ),
      ),
    );

    const unicos = filas
      .filter((f) => f.nombre !== 'PRIMARY' && Number(f.noUnico) === 0)
      .map((f) => `${f.tabla}.${f.nombre}(${f.columnas})`);
    expect(ordenar(unicos)).toEqual(
      ordenar(
        TABLAS.flatMap((t) =>
          ESQUEMA_ESPERADO[t].indices
            .filter((i) => i.unico)
            .map((i) => `${t}.${i.nombre}(${i.columnas.join(',')})`),
        ),
      ),
    );

    // Los indices no unicos sin nombre propio los crea InnoDB para las FK.
    const reales = new Set(
      filas.map((f) => `${f.tabla}.${f.nombre}(${f.columnas})`),
    );
    for (const t of TABLAS) {
      for (const i of ESQUEMA_ESPERADO[t].indices.filter((x) => !x.unico)) {
        expect(reales).toContain(`${t}.${i.nombre}(${i.columnas.join(',')})`);
      }
    }
  });

  it('coincide en claves foraneas, columnas referidas y acciones', async () => {
    const filas = await consultar<FilaForanea>(
      `SELECT k.TABLE_NAME tabla, k.CONSTRAINT_NAME nombre,
              GROUP_CONCAT(k.COLUMN_NAME ORDER BY k.ORDINAL_POSITION) columnas,
              k.REFERENCED_TABLE_NAME tablaReferida,
              GROUP_CONCAT(k.REFERENCED_COLUMN_NAME ORDER BY k.ORDINAL_POSITION) columnasReferidas,
              r.DELETE_RULE alBorrar, r.UPDATE_RULE alActualizar
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
        AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
       GROUP BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.REFERENCED_TABLE_NAME,
                r.DELETE_RULE, r.UPDATE_RULE`,
    );
    const real = filas.map((f) => {
      const clave = claveForanea(f.tabla, {
        columnas: f.columnas.split(','),
        tablaReferida: f.tablaReferida,
        columnasReferidas: f.columnasReferidas.split(','),
      });
      return `${clave} ${normalizarAccion(f.alBorrar)}/${normalizarAccion(f.alActualizar)}`;
    });
    const esperado = TABLAS.flatMap((t) =>
      ESQUEMA_ESPERADO[t].foraneas.map(
        (f) => `${claveForanea(t, f)} ${f.alBorrar}/${f.alActualizar}`,
      ),
    );
    expect(ordenar(real)).toEqual(ordenar(esperado));

    const nombres = new Set(filas.map((f) => `${f.tabla}.${f.nombre}`));
    for (const t of TABLAS) {
      for (const f of ESQUEMA_ESPERADO[t].foraneas.filter((x) => x.nombre)) {
        expect(nombres).toContain(`${t}.${f.nombre}`);
      }
    }
  });

  it('coincide en restricciones CHECK por tabla', async () => {
    const filas = await consultar<{ tabla: string; nombre: string }>(
      `SELECT TABLE_NAME tabla, CONSTRAINT_NAME nombre
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'`,
    );
    for (const t of TABLAS) {
      const deTabla = filas.filter((f) => f.tabla === t).map((f) => f.nombre);
      const definicion = ESQUEMA_ESPERADO[t];
      expect(`${t}:${deTabla.length}`).toBe(`${t}:${definicion.totalChecks}`);
      for (const nombre of definicion.checksConNombre) {
        expect(deTabla).toContain(nombre);
      }
    }
  });
});
