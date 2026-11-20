import { DataSource, QueryRunner } from 'typeorm';
import { ESTADOS_SOLICITUD } from '../src/dominio/cambio-devolucion.tipos';
import { PEDIDOS_DUMMY } from './fixtures/historicos/pedidos.fixture';
import { crearDataSourceMysql } from '../src/persistencia/mysql.datasource';
import {
  ESTADOS_ENVIO_M_P7_01,
  ESTADOS_PEDIDO_M_P7_01,
  ESTADOS_POSTVENTA_M_P7_01,
} from '../src/persistencia/migraciones/1795450400000-integridad-comercio';
import { PEDIDOS_SEMILLA_P3 } from '../src/persistencia/migraciones/comercio-semilla-p3';
import { SEMILLA_P4 } from '../src/persistencia/migraciones/p4-semilla';
import { ESTADOS_ENVIO } from '../src/services/logistica.service';
import { laboratorioDesechable } from './utilidades/estado-identidad-sql';
import {
  migracionesAplicadas,
  revertirDesde,
  verificarMigracionesCompletas,
} from './utilidades/migraciones';

const MIGRACION = 'IntegridadComercio1795450400000';
const RESTRICCIONES = [
  'pedido_item.fk_pedido_item_variante_producto',
  'pedido.ck_pedido_estado',
  'envio_evento.ck_envio_evento_nuevo',
  'envio_evento.ck_envio_evento_anterior',
  'postventa_evento.ck_postventa_evento_estado',
];

describe('M-P7-01: catalogos de la migracion frente al codigo y las semillas', () => {
  it('los estados de envio son exactamente los del servicio de logistica', () => {
    expect([...ESTADOS_ENVIO_M_P7_01]).toEqual([...ESTADOS_ENVIO]);
  });

  it('los estados de postventa son exactamente los del dominio', () => {
    expect([...ESTADOS_POSTVENTA_M_P7_01]).toEqual([...ESTADOS_SOLICITUD]);
  });

  it('pedido.estado admite los estados que asignan los servicios y los historicos', () => {
    const admitidos = new Set<string>(ESTADOS_PEDIDO_M_P7_01);
    // pedidos.service crea 'confirmado'; logistica.service asigna 'cancelado'.
    for (const estado of ['confirmado', 'cancelado']) {
      expect(admitidos).toContain(estado);
    }
    for (const { pedido } of PEDIDOS_SEMILLA_P3) {
      expect(admitidos).toContain(pedido.estado);
    }
    for (const { pedido } of PEDIDOS_DUMMY) {
      expect(admitidos).toContain(pedido.estado);
    }
  });

  it('las semillas de postventa usan estados admitidos', () => {
    const admitidos = new Set<string>(ESTADOS_POSTVENTA_M_P7_01);
    for (const solicitud of SEMILLA_P4.solicitudes) {
      expect(admitidos).toContain(solicitud.estado);
    }
  });
});

const sql = describe;

sql('M-P7-01 en el laboratorio MySQL desechable', () => {
  let fuente: DataSource;

  const restriccionesPresentes = async (): Promise<string[]> => {
    const filas = await fuente.query<{ tabla: string; nombre: string }[]>(
      `SELECT TABLE_NAME tabla, CONSTRAINT_NAME nombre
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME IN (?)`,
      [RESTRICCIONES.map((r) => r.split('.')[1])],
    );
    return filas.map((f) => `${f.tabla}.${f.nombre}`).sort();
  };

  /** Ejecuta fn en una transaccion que siempre se revierte. */
  const enTransaccion = async (
    fn: (q: QueryRunner) => Promise<void>,
  ): Promise<void> => {
    const q = fuente.createQueryRunner();
    await q.startTransaction();
    try {
      await fn(q);
    } finally {
      await q.rollbackTransaction();
      await q.release();
    }
  };

  const rechaza = (promesa: Promise<unknown>, errno: number) =>
    expect(promesa).rejects.toMatchObject({ driverError: { errno } });

  beforeAll(async () => {
    if (!laboratorioDesechable()) throw new Error('Solo laboratorio');
    fuente = crearDataSourceMysql();
    await fuente.initialize();
    await fuente.runMigrations();
  });

  afterAll(async () => {
    if (fuente?.isInitialized) await fuente.destroy();
  });

  it('queda aplicada con el resto de migraciones y crea sus restricciones', async () => {
    await verificarMigracionesCompletas(fuente);
    expect((await migracionesAplicadas(fuente)).at(-1)).toBe(MIGRACION);
    expect(await restriccionesPresentes()).toEqual([...RESTRICCIONES].sort());
  });

  it('rechaza una linea de pedido cuyo producto no es el de su variante', async () => {
    const [variante] = await fuente.query<
      { id: string; producto_id: string }[]
    >('SELECT id, producto_id FROM variante ORDER BY id LIMIT 1');
    const [otro] = await fuente.query<{ id: string }[]>(
      'SELECT id FROM producto WHERE id <> ? ORDER BY id LIMIT 1',
      [variante.producto_id],
    );
    const [pedido] = await fuente.query<{ id: number }[]>(
      'SELECT id FROM pedido ORDER BY id LIMIT 1',
    );
    const insertar = (q: QueryRunner, productoId: string) =>
      q.query(
        `INSERT INTO pedido_item
           (pedido_id, producto_id, variante_id, posicion, nombre, cantidad, precio_unitario)
         VALUES (?, ?, ?, 999, 'Prueba', 1, 1)`,
        [pedido.id, productoId, variante.id],
      );
    await enTransaccion(async (q) => {
      await rechaza(insertar(q, otro.id), 1452);
    });
    await enTransaccion(async (q) => {
      await expect(insertar(q, variante.producto_id)).resolves.toBeDefined();
    });
  });

  it('pedido.estado admite el catalogo y rechaza otros valores', async () => {
    const [pedido] = await fuente.query<{ id: number }[]>(
      'SELECT id FROM pedido ORDER BY id LIMIT 1',
    );
    await enTransaccion(async (q) => {
      for (const estado of ESTADOS_PEDIDO_M_P7_01) {
        await q.query('UPDATE pedido SET estado = ? WHERE id = ?', [
          estado,
          pedido.id,
        ]);
      }
      await rechaza(
        q.query('UPDATE pedido SET estado = ? WHERE id = ?', [
          'enviado',
          pedido.id,
        ]),
        3819,
      );
    });
  });

  it('envio_evento admite estados logisticos y rechaza otros', async () => {
    const [pedido] = await fuente.query<{ id: number }[]>(
      `SELECT p.id FROM pedido p LEFT JOIN envio e ON e.pedido_id = p.id
       WHERE e.id IS NULL ORDER BY p.id LIMIT 1`,
    );
    const [actor] = await fuente.query<{ id: number }[]>(
      'SELECT id FROM usuario ORDER BY id LIMIT 1',
    );
    await enTransaccion(async (q) => {
      const envio = (await q.query(
        "INSERT INTO envio (pedido_id, estado) VALUES (?, 'PENDING')",
        [pedido.id],
      )) as { insertId: number };
      const evento = (anterior: string | null, nuevo: string) =>
        q.query(
          'INSERT INTO envio_evento (envio_id, anterior, nuevo, actor_id) VALUES (?, ?, ?, ?)',
          [envio.insertId, anterior, nuevo, actor.id],
        );
      await evento(null, 'PENDING');
      await evento('PENDING', 'PREPARING');
      await rechaza(evento('PREPARING', 'PERDIDO'), 3819);
      await rechaza(evento('EXTRAVIADO', 'SHIPPED'), 3819);
    });
  });

  it('postventa_evento admite el catalogo del dominio y rechaza otros', async () => {
    const [solicitud] = await fuente.query<{ id: number }[]>(
      'SELECT id FROM solicitud_postventa ORDER BY id LIMIT 1',
    );
    await enTransaccion(async (q) => {
      const evento = (estado: string) =>
        q.query(
          'INSERT INTO postventa_evento (solicitud_id, estado) VALUES (?, ?)',
          [solicitud.id, estado],
        );
      for (const estado of ESTADOS_POSTVENTA_M_P7_01) await evento(estado);
      await rechaza(evento('archivada'), 3819);
    });
  });

  it('se revierte y se vuelve a aplicar sin dejar la FK simple sin indice', async () => {
    const revertidas = await revertirDesde(fuente, MIGRACION);
    expect(revertidas).toEqual([MIGRACION]);
    expect(await restriccionesPresentes()).toEqual([]);
    const indices = await fuente.query<unknown[]>(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_item'
         AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = 'variante_id'`,
    );
    expect(indices.length).toBeGreaterThan(0);
    expect((await fuente.runMigrations()).map((m) => m.name)).toEqual([
      MIGRACION,
    ]);
    expect(await restriccionesPresentes()).toEqual([...RESTRICCIONES].sort());
    await verificarMigracionesCompletas(fuente);
  });

  it('aborta sin crear restricciones si hay datos fuera del dominio', async () => {
    await revertirDesde(fuente, MIGRACION);
    const [usuario] = await fuente.query<{ id: number }[]>(
      'SELECT id FROM usuario ORDER BY id LIMIT 1',
    );
    const insercion = await fuente.query<{ insertId: number }>(
      `INSERT INTO pedido (usuario_id, numero_pedido, estado, fecha, costo_envio, metodo_pago)
       VALUES (?, 'LAB-M-P7-01', 'enviado', CURRENT_TIMESTAMP(3), 0, 'webpay')`,
      [usuario.id],
    );
    try {
      await expect(fuente.runMigrations()).rejects.toThrow(
        'M-P7-01 no se aplica',
      );
      expect(await restriccionesPresentes()).toEqual([]);
      expect(await migracionesAplicadas(fuente)).not.toContain(MIGRACION);
    } finally {
      await fuente.query('DELETE FROM pedido WHERE id = ?', [
        insercion.insertId,
      ]);
    }
    expect((await fuente.runMigrations()).map((m) => m.name)).toEqual([
      MIGRACION,
    ]);
    await verificarMigracionesCompletas(fuente);
  });
});
