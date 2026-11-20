import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M-P7-01: integridad comercial.
 *
 * - FK compuesta pedido_item(variante_id, producto_id) -> variante(id,
 *   producto_id): el producto copiado en la linea debe ser el de su variante.
 *   producto_id se conserva como snapshot del contrato del pedido; la FK lo
 *   convierte en una desnormalizacion controlada, igual que en alerta.
 * - CHECK de dominio en pedido.estado, envio_evento.anterior/nuevo y
 *   postventa_evento.estado.
 *
 * Los catalogos se fijan aqui como copia inmutable: una migracion no importa
 * constantes vivas. integridad-mp701.mysql.e2e-spec verifica que coinciden
 * con los del codigo y con los datos sembrados.
 *
 * No modifica filas. Antes de alterar comprueba los datos y aborta si alguno
 * violaria las restricciones. El DDL de MySQL no es transaccional: si una
 * sentencia falla, se retiran las restricciones ya creadas antes de propagar
 * el error.
 */
export const ESTADOS_PEDIDO_M_P7_01 = [
  'confirmado',
  'entregado',
  'cancelado',
] as const;
export const ESTADOS_ENVIO_M_P7_01 = [
  'PENDING',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export const ESTADOS_POSTVENTA_M_P7_01 = [
  'solicitada',
  'aprobada',
  'rechazada',
  'completada',
] as const;

const lista = (valores: readonly string[]): string =>
  valores.map((v) => `'${v}'`).join(',');

const FK_ITEM_VARIANTE = 'fk_pedido_item_variante_producto';
/** Indice de reemplazo para la FK simple de variante_id si se revierte. */
const IX_ITEM_VARIANTE = 'ix_pedido_item_variante';

const CHECKS: { tabla: string; nombre: string; condicion: string }[] = [
  {
    tabla: 'pedido',
    nombre: 'ck_pedido_estado',
    condicion: `estado IN (${lista(ESTADOS_PEDIDO_M_P7_01)})`,
  },
  {
    tabla: 'envio_evento',
    nombre: 'ck_envio_evento_nuevo',
    condicion: `nuevo IN (${lista(ESTADOS_ENVIO_M_P7_01)})`,
  },
  {
    tabla: 'envio_evento',
    nombre: 'ck_envio_evento_anterior',
    condicion: `anterior IS NULL OR anterior IN (${lista(ESTADOS_ENVIO_M_P7_01)})`,
  },
  {
    tabla: 'postventa_evento',
    nombre: 'ck_postventa_evento_estado',
    condicion: `estado IN (${lista(ESTADOS_POSTVENTA_M_P7_01)})`,
  },
];

/** Comprobaciones previas: cada consulta cuenta filas que violarian una restriccion. */
const VERIFICACIONES: { descripcion: string; consulta: string }[] = [
  {
    descripcion: 'lineas de pedido cuyo producto no es el de su variante',
    consulta:
      'SELECT COUNT(*) AS n FROM pedido_item pi JOIN variante v ON v.id = pi.variante_id ' +
      'WHERE v.producto_id <> pi.producto_id',
  },
  ...CHECKS.map((c) => ({
    descripcion: `filas de ${c.tabla} fuera de ${c.nombre}`,
    consulta: `SELECT COUNT(*) AS n FROM ${c.tabla} WHERE NOT (${c.condicion})`,
  })),
];

async function existeRestriccion(
  q: QueryRunner,
  tabla: string,
  nombre: string,
  tipo: 'FOREIGN KEY' | 'CHECK',
): Promise<boolean> {
  const filas = (await q.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS ' +
      'WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? ' +
      'AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = ?',
    [tabla, nombre, tipo],
  )) as unknown[];
  return filas.length > 0;
}

/** Columnas iniciales de cada indice de pedido_item, salvo el indicado. */
async function indicesConVarianteInicial(
  q: QueryRunner,
  excepto: string,
): Promise<string[]> {
  const filas = (await q.query(
    'SELECT INDEX_NAME AS nombre FROM INFORMATION_SCHEMA.STATISTICS ' +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_item' " +
      "AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'variante_id' AND INDEX_NAME <> ?",
    [excepto],
  )) as { nombre: string }[];
  return filas.map((f) => f.nombre);
}

async function existeIndice(q: QueryRunner, nombre: string): Promise<boolean> {
  const filas = (await q.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS ' +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_item' AND INDEX_NAME = ?",
    [nombre],
  )) as unknown[];
  return filas.length > 0;
}

/** Retira lo que esta migracion haya creado; seguro de repetir. */
async function retirar(q: QueryRunner): Promise<void> {
  for (const c of [...CHECKS].reverse()) {
    if (await existeRestriccion(q, c.tabla, c.nombre, 'CHECK')) {
      await q.query(`ALTER TABLE ${c.tabla} DROP CHECK ${c.nombre}`);
    }
  }
  if (
    await existeRestriccion(q, 'pedido_item', FK_ITEM_VARIANTE, 'FOREIGN KEY')
  ) {
    await q.query(
      `ALTER TABLE pedido_item DROP FOREIGN KEY ${FK_ITEM_VARIANTE}`,
    );
  }
  // MySQL crea un indice con el nombre de la FK y puede descartar el indice
  // implicito de la FK simple sobre variante_id. Si ya no queda otro indice
  // que empiece por variante_id, se reemplaza en una sola sentencia para que
  // esa FK nunca quede sin indice.
  if (await existeIndice(q, FK_ITEM_VARIANTE)) {
    const otros = await indicesConVarianteInicial(q, FK_ITEM_VARIANTE);
    await q.query(
      otros.length > 0
        ? `ALTER TABLE pedido_item DROP INDEX ${FK_ITEM_VARIANTE}`
        : `ALTER TABLE pedido_item DROP INDEX ${FK_ITEM_VARIANTE}, ` +
            `ADD INDEX ${IX_ITEM_VARIANTE} (variante_id)`,
    );
  }
}

export class IntegridadComercio1795450400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const problemas: string[] = [];
    for (const v of VERIFICACIONES) {
      const [fila] = (await q.query(v.consulta)) as { n: number | string }[];
      if (Number(fila.n) > 0) problemas.push(`${fila.n} ${v.descripcion}`);
    }
    if (problemas.length > 0) {
      throw new Error(
        'M-P7-01 no se aplica; corrige los datos antes de reintentar: ' +
          problemas.join('; '),
      );
    }
    try {
      await q.query(
        `ALTER TABLE pedido_item ADD CONSTRAINT ${FK_ITEM_VARIANTE} ` +
          'FOREIGN KEY (variante_id, producto_id) REFERENCES variante (id, producto_id) ' +
          'ON DELETE RESTRICT ON UPDATE RESTRICT',
      );
      for (const c of CHECKS) {
        await q.query(
          `ALTER TABLE ${c.tabla} ADD CONSTRAINT ${c.nombre} CHECK (${c.condicion})`,
        );
      }
    } catch (error) {
      await retirar(q);
      throw error;
    }
  }

  async down(q: QueryRunner): Promise<void> {
    await retirar(q);
  }
}
