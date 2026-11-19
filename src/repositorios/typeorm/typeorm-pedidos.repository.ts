import { createHash, randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import type { Pedido } from '../../dominio/modelos';
import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../../dominio/errores-dominio';
import {
  PedidoFila,
  PedidoItemFila,
  CarritoFila,
  CarritoItemFila,
} from '../../persistencia/comercio.entidades';
import { DireccionFila } from '../../persistencia/identidad.entidades';
import { Producto, Variante } from '../../persistencia/productos.entidades';
import { gestorActual } from '../../persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../../persistencia/unidad-de-trabajo';
import {
  PedidosRepository,
  NuevoPedido,
  CheckoutPersistencia,
} from '../pedidos.repository';

/** Aritmetica exacta antes de convertir a los numeros del contrato HTTP. */
export function importeSeguro(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new ReglaNegocioError('Importe fuera del rango representable');
  return Number(value);
}
export class TypeOrmPedidosRepository extends PedidosRepository {
  constructor(private readonly source: DataSource) {
    super();
  }
  private get manager() {
    return gestorActual(this.source);
  }
  private async map(row: PedidoFila): Promise<Pedido> {
    const rows = await this.manager
      .getRepository(PedidoItemFila)
      .find({ where: { pedidoId: row.id }, order: { posicion: 'ASC' } });
    const items = rows.map(
      ({ id, productoId, varianteId, nombre, cantidad, precioUnitario }) => ({
        id,
        productoId,
        varianteId,
        nombre,
        cantidad,
        precioUnitario,
        subtotal: importeSeguro(BigInt(cantidad) * BigInt(precioUnitario)),
      }),
    );
    const subtotal = importeSeguro(
      items.reduce((t, r) => t + BigInt(r.subtotal), 0n),
    );
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      numeroPedido: row.numeroPedido,
      estado: row.estado,
      fecha: row.fecha.toISOString(),
      costoEnvio: row.costoEnvio,
      metodoPago: row.metodoPago,
      subtotal,
      total: importeSeguro(BigInt(subtotal) + BigInt(row.costoEnvio)),
      items,
      checkout: row.checkout ?? undefined,
    };
  }
  async listarPorUsuario(usuarioId: number) {
    const rows = await this.manager
      .getRepository(PedidoFila)
      .find({ where: { usuarioId }, order: { id: 'ASC' } });
    return Promise.all(rows.map((r) => this.map(r)));
  }
  async buscarDeUsuario(usuarioId: number, id: number) {
    const row = await this.manager
      .getRepository(PedidoFila)
      .findOneBy({ usuarioId, id });
    return row ? this.map(row) : null;
  }
  async crear(datos: NuevoPedido) {
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      const row = await this.manager.getRepository(PedidoFila).save({
        usuarioId: datos.usuarioId,
        numeroPedido: 'SN-' + randomUUID(),
        estado: datos.estado,
        fecha: new Date(datos.fecha),
        costoEnvio: datos.costoEnvio,
        metodoPago: datos.metodoPago,
        checkout: datos.checkout,
        claveIdempotencia: null,
        huella: null,
      });
      row.numeroPedido = `SN-${datos.fecha.slice(0, 4)}-${row.id}`;
      await this.manager.getRepository(PedidoFila).save(row);
      for (const [posicion, item] of datos.items.entries())
        await this.manager.getRepository(PedidoItemFila).insert({
          pedidoId: row.id,
          posicion,
          productoId: item.productoId,
          varianteId: item.varianteId,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        });
      return this.map(row);
    });
  }
  eliminarCreado(): Promise<boolean> {
    throw new Error(
      'Pedidos SQL se revierten solo mediante rollback transaccional',
    );
  }
  override confirmarCheckout(
    datos: CheckoutPersistencia,
    usuarioId: number,
    clave?: string,
  ): Promise<Pedido> {
    if (clave !== undefined && !/^[A-Za-z0-9._:-]{1,128}$/.test(clave))
      throw new ReglaNegocioError('Idempotency-Key invalida');
    const huella = createHash('sha256')
      .update(
        JSON.stringify({
          carritoId: datos.carritoId,
          contacto: datos.contacto,
          direccion: datos.direccion,
          metodoPago: datos.metodoPago,
          direccionId: datos.direccionId ?? null,
        }),
      )
      .digest('hex');
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      const m = this.manager;
      const carrito = await m.getRepository(CarritoFila).findOne({
        where: { id: datos.carritoId, usuarioId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!carrito)
        throw new RecursoNoEncontradoError(
          `No existe el carrito con id ${datos.carritoId}`,
        );
      if (clave) {
        const previous = await m
          .getRepository(PedidoFila)
          .findOneBy({ usuarioId, claveIdempotencia: clave });
        if (previous) {
          if (previous.huella !== huella)
            throw new ConflictoDominioError(
              'La clave ya fue usada con otro checkout',
            );
          return this.map(previous);
        }
      }
      let direccion = datos.direccion;
      if (datos.direccionId !== undefined) {
        const d = await m.getRepository(DireccionFila).findOne({
          where: { id: datos.direccionId, usuarioId },
          lock: { mode: 'pessimistic_read' },
        });
        if (!d)
          throw new RecursoNoEncontradoError('No existe la direccion indicada');
        direccion = {
          calle: d.calle,
          numero: d.numero,
          departamento: d.departamento ?? undefined,
          comuna: d.comuna,
          region: d.region,
        };
      }
      const lines = await m
        .getRepository(CarritoItemFila)
        .find({ where: { carritoId: carrito.id }, order: { posicion: 'ASC' } });
      if (!lines.length)
        throw new ReglaNegocioError('El carrito no tiene items');
      const variants = new Map<number, Variante>();
      for (const l of [...lines].sort((a, b) => a.varianteId - b.varianteId)) {
        const v = await m.getRepository(Variante).findOne({
          where: { id: l.varianteId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!v || v.stock < l.cantidad)
          throw new ReglaNegocioError('Stock insuficiente');
        variants.set(v.id, v);
      }
      const products = new Map<number, Producto>();
      for (const id of [
        ...new Set([...variants.values()].map((v) => v.productoId)),
      ].sort((a, b) => a - b)) {
        const p = await m
          .getRepository(Producto)
          .findOne({ where: { id }, lock: { mode: 'pessimistic_read' } });
        if (!p) throw new RecursoNoEncontradoError('Producto inexistente');
        products.set(id, p);
      }
      const items = lines.map((l) => {
        const v = variants.get(l.varianteId)!;
        const p = products.get(v.productoId)!;
        return {
          productoId: p.id,
          varianteId: v.id,
          nombre: p.nombre,
          cantidad: l.cantidad,
          precioUnitario: p.precio,
          subtotal: importeSeguro(BigInt(l.cantidad) * BigInt(p.precio)),
        };
      });
      const subtotal = importeSeguro(
        items.reduce((t, l) => t + BigInt(l.subtotal), 0n),
      );
      const pedido = await this.crear({
        usuarioId,
        estado: 'confirmado',
        fecha: new Date().toISOString(),
        costoEnvio: 0,
        metodoPago: datos.metodoPago,
        subtotal,
        total: subtotal,
        items,
        checkout: { contacto: datos.contacto, direccion },
      });
      await this.descontar(m, lines);
      for (const l of lines)
        await m.query(
          'INSERT INTO inventario_pedido(pedido_id,variante_id,cantidad) VALUES (?,?,?)',
          [pedido.id, l.varianteId, l.cantidad],
        );
      const envio = await m.query<{ insertId: number }>(
        'INSERT INTO envio(pedido_id,estado) VALUES (?,?)',
        [pedido.id, 'PENDING'],
      );
      await m.query(
        'INSERT INTO envio_evento(envio_id,anterior,nuevo,actor_id) VALUES (?,NULL,?,?)',
        [envio.insertId, 'PENDING', usuarioId],
      );
      await m.getRepository(CarritoItemFila).delete({ carritoId: carrito.id });
      if (clave)
        await m
          .getRepository(PedidoFila)
          .update(pedido.id, { claveIdempotencia: clave, huella });
      return pedido;
    });
  }
  private async descontar(
    m: EntityManager,
    lines: { varianteId: number; cantidad: number }[],
  ) {
    for (const l of [...lines].sort((a, b) => a.varianteId - b.varianteId)) {
      const result = await m
        .getRepository(Variante)
        .createQueryBuilder()
        .update()
        .set({ stock: () => 'stock - :cantidad' })
        .where('id = :id AND stock >= :cantidad', {
          id: l.varianteId,
          cantidad: l.cantidad,
        })
        .execute();
      if (result.affected !== 1)
        throw new ReglaNegocioError('Stock insuficiente');
    }
  }
}
