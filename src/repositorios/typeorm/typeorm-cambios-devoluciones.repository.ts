import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { SolicitudCambioDevolucion } from '../../dominio/modelos';
import {
  CambiosDevolucionesRepository,
  NuevaSolicitud,
} from '../cambios-devoluciones.repository';
import { gestorActual } from '../../persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../../persistencia/unidad-de-trabajo';
import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
} from '../../dominio/errores-dominio';
type Row = {
  id: number;
  pedido_id: number;
  pedido_item_id: number;
  tipo: SolicitudCambioDevolucion['tipo'];
  estado: SolicitudCambioDevolucion['estado'];
  motivo: string;
  nueva_variante_id: string | null;
  metodo_entrega: string;
  fecha_solicitud: Date;
};
export class TypeOrmCambiosDevolucionesRepository extends CambiosDevolucionesRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  private get m() {
    return gestorActual(this.source);
  }
  private map(r: Row): SolicitudCambioDevolucion {
    return {
      id: r.id,
      pedidoId: r.pedido_id,
      pedidoItemId: r.pedido_item_id,
      tipo: r.tipo,
      estado: r.estado,
      motivo: r.motivo,
      ...(r.nueva_variante_id === null
        ? {}
        : { nuevaVarianteId: Number(r.nueva_variante_id) }),
      metodoEntrega: r.metodo_entrega,
      fechaSolicitud: r.fecha_solicitud.toISOString(),
    };
  }
  async listarPorPedido(pedidoId: number) {
    return (
      await this.m.query<Row[]>(
        'SELECT * FROM solicitud_postventa WHERE pedido_id=? ORDER BY id',
        [pedidoId],
      )
    ).map((r) => this.map(r));
  }
  async buscarPorId(id: number) {
    const rows = await this.m.query<Row[]>(
      'SELECT * FROM solicitud_postventa WHERE id=?',
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }
  async crear(d: NuevaSolicitud, actor?: number, clave?: string) {
    if (clave !== undefined && !/^[A-Za-z0-9._:-]{1,128}$/.test(clave))
      throw new ConflictoDominioError('Idempotency-Key invalida');
    const huella = createHash('sha256').update(JSON.stringify(d)).digest('hex');
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      const pedidos = await this.m.query<
        { usuario_id: number; estado: string }[]
      >('SELECT usuario_id,estado FROM pedido WHERE id=? FOR UPDATE', [
        d.pedidoId,
      ]);
      if (!pedidos[0] || pedidos[0].usuario_id !== actor)
        throw new RecursoNoEncontradoError('Pedido inexistente');
      if (clave) {
        const old = (
          await this.m.query<{ solicitud_id: number; huella: string }[]>(
            'SELECT solicitud_id,huella FROM postventa_idempotencia WHERE usuario_id=? AND clave=?',
            [actor, clave],
          )
        )[0];
        if (old) {
          if (old.huella !== huella)
            throw new ConflictoDominioError('Clave usada con otra solicitud');
          return (await this.buscarPorId(old.solicitud_id))!;
        }
      }
      if (pedidos[0].estado === 'cancelado')
        throw new ConflictoDominioError(
          'Pedido cancelado; no es una devolucion',
        );
      const items = await this.m.query<
        { producto_id: string; variante_id: string }[]
      >(
        'SELECT producto_id,variante_id FROM pedido_item WHERE id=? AND pedido_id=?',
        [d.pedidoItemId, d.pedidoId],
      );
      if (!items[0]) throw new RecursoNoEncontradoError('Articulo inexistente');
      if (d.nuevaVarianteId !== undefined) {
        const variants = await this.m.query<{ id: number }[]>(
          'SELECT id FROM variante WHERE id=? AND producto_id=?',
          [d.nuevaVarianteId, items[0].producto_id],
        );
        if (
          !variants.length ||
          Number(items[0].variante_id) === d.nuevaVarianteId
        )
          throw new ConflictoDominioError('Variante de cambio no valida');
      }
      const row = await this.m.query<{ insertId: number }>(
        'INSERT INTO solicitud_postventa(pedido_id,pedido_item_id,tipo,estado,motivo,nueva_variante_id,metodo_entrega,fecha_solicitud) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP(3))',
        [
          d.pedidoId,
          d.pedidoItemId,
          d.tipo,
          'solicitada',
          d.motivo,
          d.nuevaVarianteId ?? null,
          d.metodoEntrega,
        ],
      );
      await this.m.query(
        'INSERT INTO postventa_evento(solicitud_id,estado,actor_id) VALUES (?,?,?)',
        [row.insertId, 'solicitada', actor],
      );
      if (clave)
        await this.m.query(
          'INSERT INTO postventa_idempotencia(usuario_id,clave,solicitud_id,huella) VALUES (?,?,?,?)',
          [actor, clave, row.insertId, huella],
        );
      return (await this.buscarPorId(row.insertId))!;
    });
  }
  override async historial(id: number) {
    return this.m.query<
      { estado: string; fecha: Date; resolucion: string | null }[]
    >(
      'SELECT estado,fecha,resolucion FROM postventa_evento WHERE solicitud_id=? ORDER BY id',
      [id],
    );
  }
}
