import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { gestorActual } from '../persistencia/gestor-actual';
import { UnidadDeTrabajoTypeorm } from '../persistencia/unidad-de-trabajo';
import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
} from '../dominio/errores-dominio';

export const ESTADOS_ENVIO = [
  'PENDING',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number];
export function validarTransicion(
  actual: EstadoEnvio,
  nuevo: EstadoEnvio,
  despachado: boolean,
): void {
  const siguiente: Partial<Record<EstadoEnvio, EstadoEnvio>> = {
    PENDING: 'PREPARING',
    PREPARING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
  };
  if (
    nuevo === 'CANCELLED' &&
    ['PENDING', 'PREPARING'].includes(actual) &&
    !despachado
  )
    return;
  if (siguiente[actual] !== nuevo)
    throw new ConflictoDominioError('Transicion logistica no permitida');
}
export interface Envio {
  id: number;
  pedido_id: number;
  estado: EstadoEnvio;
  despachado_en: Date | null;
}
@Injectable()
export class LogisticaService {
  constructor(
    @Inject(DataSource) private readonly source: DataSource,
    private readonly config: ConfigService,
  ) {}
  private db() {
    return this.source;
  }
  private get m() {
    return gestorActual(this.db());
  }
  private operador(actor: number) {
    const ids = (this.config.get<string>('LOGISTICA_OPERADORES_IDS') ?? '')
      .split(',')
      .filter((v) => /^[1-9]\d*$/.test(v))
      .map(Number);
    if (!ids.includes(actor))
      throw new ForbiddenException('Operacion reservada a personal autorizado');
  }
  private async pedido(id: number, usuarioId?: number) {
    const rows = await this.m.query<
      { id: number; usuario_id: number; estado: string }[]
    >('SELECT id,usuario_id,estado FROM pedido WHERE id=? FOR UPDATE', [id]);
    const p = rows[0];
    if (!p || (usuarioId !== undefined && p.usuario_id !== usuarioId))
      throw new RecursoNoEncontradoError('Pedido inexistente');
    return p;
  }
  private async envio(id: number) {
    return (
      await this.m.query<Envio[]>(
        'SELECT id,pedido_id,estado,despachado_en FROM envio WHERE pedido_id=? FOR UPDATE',
        [id],
      )
    )[0];
  }
  async crearEnvio(pedidoId: number, actor: number) {
    this.operador(actor);
    return new UnidadDeTrabajoTypeorm(this.db()).ejecutar(async () => {
      const p = await this.pedido(pedidoId);
      if (p.estado !== 'confirmado')
        throw new ConflictoDominioError('Pedido no disponible para despacho');
      const old = await this.envio(pedidoId);
      if (old) return old;
      const r = await this.m.query<{ insertId: number }>(
        'INSERT INTO envio(pedido_id,estado) VALUES (?,?)',
        [pedidoId, 'PENDING'],
      );
      await this.evento(r.insertId, null, 'PENDING', actor);
      return await this.envio(pedidoId);
    });
  }
  async transicionar(pedidoId: number, nuevo: EstadoEnvio, actor: number) {
    this.operador(actor);
    return new UnidadDeTrabajoTypeorm(this.db()).ejecutar(async () => {
      const p = await this.pedido(pedidoId);
      if (p.estado === 'cancelado')
        throw new ConflictoDominioError('Pedido cancelado');
      const e = await this.envio(pedidoId);
      if (!e) throw new RecursoNoEncontradoError('Envio inexistente');
      validarTransicion(e.estado, nuevo, e.despachado_en !== null);
      await this.m.query(
        'UPDATE envio SET estado=?,despachado_en=CASE WHEN ?=? THEN CURRENT_TIMESTAMP(3) ELSE despachado_en END WHERE id=?',
        [nuevo, nuevo, 'SHIPPED', e.id],
      );
      await this.evento(e.id, e.estado, nuevo, actor);
      return await this.envio(pedidoId);
    });
  }
  private async evento(
    envioId: number,
    anterior: EstadoEnvio | null,
    nuevo: EstadoEnvio,
    actor: number,
    motivo?: string,
  ) {
    await this.m.query(
      'INSERT INTO envio_evento(envio_id,anterior,nuevo,actor_id,motivo) VALUES (?,?,?,?,?)',
      [envioId, anterior, nuevo, actor, motivo ?? null],
    );
  }
  async seguimiento(pedidoId: number, usuarioId: number) {
    return new UnidadDeTrabajoTypeorm(this.db()).ejecutar(async () => {
      await this.pedido(pedidoId, usuarioId);
      const e = await this.envio(pedidoId);
      if (!e) throw new RecursoNoEncontradoError('Envio inexistente');
      const eventos = await this.m.query<
        { anterior: EstadoEnvio | null; nuevo: EstadoEnvio; fecha: Date }[]
      >(
        'SELECT anterior,nuevo,fecha FROM envio_evento WHERE envio_id=? ORDER BY id',
        [e.id],
      );
      return {
        pedidoId,
        estado: e.estado,
        despachadoEn: e.despachado_en,
        eventos,
      };
    });
  }
  async cancelar(pedidoId: number, usuarioId: number, motivo?: string) {
    return new UnidadDeTrabajoTypeorm(this.db()).ejecutar(async () => {
      const p = await this.pedido(pedidoId, usuarioId);
      const old = (
        await this.m.query<{ restituido: number; fecha: Date }[]>(
          'SELECT restituido,fecha FROM pedido_cancelacion WHERE pedido_id=?',
          [pedidoId],
        )
      )[0];
      if (old)
        return {
          pedidoId,
          estado: 'cancelado',
          stockRestituido: !!old.restituido,
          fecha: old.fecha,
        };
      const e = await this.envio(pedidoId);
      if (!e)
        throw new ConflictoDominioError(
          'No existe evidencia logistica suficiente para cancelar',
        );
      if (p.estado !== 'confirmado')
        throw new ConflictoDominioError('Pedido no cancelable');
      validarTransicion(e.estado, 'CANCELLED', e.despachado_en !== null);
      const debitos = await this.m.query<
        { variante_id: string; cantidad: string; restituido: number }[]
      >(
        'SELECT variante_id,cantidad,restituido FROM inventario_pedido WHERE pedido_id=? ORDER BY variante_id FOR UPDATE',
        [pedidoId],
      );
      for (const d of debitos) {
        if (d.restituido)
          throw new ConflictoDominioError('Compensacion inconsistente');
        await this.m.query('SELECT id FROM variante WHERE id=? FOR UPDATE', [
          d.variante_id,
        ]);
        await this.m.query('UPDATE variante SET stock=stock+? WHERE id=?', [
          d.cantidad,
          d.variante_id,
        ]);
      }
      await this.m.query(
        'UPDATE inventario_pedido SET restituido=1 WHERE pedido_id=?',
        [pedidoId],
      );
      await this.m.query('UPDATE envio SET estado=? WHERE id=?', [
        'CANCELLED',
        e.id,
      ]);
      await this.evento(e.id, e.estado, 'CANCELLED', usuarioId, motivo);
      await this.m.query('UPDATE pedido SET estado=? WHERE id=?', [
        'cancelado',
        pedidoId,
      ]);
      await this.m.query(
        'INSERT INTO pedido_cancelacion(pedido_id,actor_id,motivo,restituido) VALUES (?,?,?,?)',
        [pedidoId, usuarioId, motivo ?? null, debitos.length > 0],
      );
      const r = (
        await this.m.query<{ restituido: number; fecha: Date }[]>(
          'SELECT restituido,fecha FROM pedido_cancelacion WHERE pedido_id=?',
          [pedidoId],
        )
      )[0];
      return {
        pedidoId,
        estado: 'cancelado',
        stockRestituido: !!r.restituido,
        fecha: r.fecha,
      };
    });
  }
}
