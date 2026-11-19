import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Producto, ProductoImagen } from '../persistencia/productos.entidades';
import {
  CargaImagen,
  PermisoUsuario,
} from '../persistencia/imagenes.entidades';
import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
} from '../dominio/errores-dominio';

export const PERMISO_IMAGENES = 'productos.imagenes.gestionar';
export const urlImagen = (archivo: string) => '/imagenes/productos/' + archivo;

@Injectable()
export class ImagenesRepository {
  constructor(@Inject(DataSource) private readonly source: DataSource | null) {}
  private db() {
    if (!this.source)
      throw new ServiceUnavailableException(
        'Carga persistente de imagenes requiere MySQL',
      );
    return this.source;
  }
  async autorizado(usuarioId: number) {
    return this.db()
      .getRepository(PermisoUsuario)
      .existsBy({ usuarioId, permiso: PERMISO_IMAGENES });
  }
  async reservar(
    carga: Pick<
      CargaImagen,
      'archivo' | 'productoId' | 'actorId' | 'sha256' | 'bytes'
    >,
  ) {
    return this.db().transaction(async (m) => {
      const producto = await m.getRepository(Producto).findOne({
        where: { id: Number(carga.productoId) },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) throw new RecursoNoEncontradoError('Producto inexistente');
      await m
        .getRepository(CargaImagen)
        .insert({ ...carga, estado: 'pendiente' });
    });
  }
  async publicar(carga: CargaImagen) {
    return this.db().transaction(async (m) => {
      const p = await m.getRepository(Producto).findOne({
        where: { id: Number(carga.productoId) },
        lock: { mode: 'pessimistic_write' },
      });
      if (!p) throw new RecursoNoEncontradoError('Producto inexistente');
      const row = await m.getRepository(CargaImagen).findOne({
        where: { archivo: carga.archivo },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row || row.estado !== 'pendiente')
        throw new ConflictoDominioError('Carga no disponible para publicar');
      const ultima = await m
        .getRepository(ProductoImagen)
        .findOne({ where: { productoId: p.id }, order: { posicion: 'DESC' } });
      const posicion = (ultima?.posicion ?? -1) + 1;
      if (posicion > 4294967295)
        throw new ConflictoDominioError('Galeria sin posiciones disponibles');
      await m
        .getRepository(ProductoImagen)
        .insert({ productoId: p.id, posicion, url: urlImagen(carga.archivo) });
      await m
        .getRepository(CargaImagen)
        .update(carga.archivo, { estado: 'publicada' });
      return { productoId: p.id, posicion, url: urlImagen(carga.archivo) };
    });
  }
  async fallar(
    carga: Pick<CargaImagen, 'archivo' | 'productoId'>,
    colision = false,
  ) {
    return this.db().transaction(async (m) => {
      await m.getRepository(Producto).findOne({
        where: { id: Number(carga.productoId) },
        lock: { mode: 'pessimistic_write' },
      });
      const row = await m.getRepository(CargaImagen).findOne({
        where: { archivo: carga.archivo },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row || row.estado === 'publicada' || row.estado === 'colision')
        return false;
      if (
        await m
          .getRepository(ProductoImagen)
          .existsBy({ url: urlImagen(carga.archivo) })
      )
        return false;
      await m
        .getRepository(CargaImagen)
        .update(carga.archivo, { estado: colision ? 'colision' : 'fallida' });
      return !colision;
    });
  }
  async publicada(archivo: string) {
    return (
      (await this.db()
        .getRepository(CargaImagen)
        .existsBy({ archivo, estado: 'publicada' })) &&
      (await this.db()
        .getRepository(ProductoImagen)
        .existsBy({ url: urlImagen(archivo) }))
    );
  }
  async pendientes() {
    return this.db()
      .getRepository(CargaImagen)
      .createQueryBuilder('carga')
      .where(
        'carga.estado = :fallida OR (carga.estado = :pendiente AND carga.creada_en < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 15 MINUTE))',
        { fallida: 'fallida', pendiente: 'pendiente' },
      )
      .orderBy('carga.creadaEn', 'ASC')
      .take(100)
      .getMany();
  }
}
