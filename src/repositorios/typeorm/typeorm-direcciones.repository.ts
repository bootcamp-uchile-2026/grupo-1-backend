import { DataSource } from 'typeorm';
import type { Direccion } from '../../dominio/modelos';
import { gestorActual } from '../../persistencia/gestor-actual';
import { traducirErrorMysql } from '../../persistencia/errores-mysql';
import { DireccionFila } from '../../persistencia/identidad.entidades';
import {
  DireccionesRepository,
  NuevaDireccion,
} from '../direcciones.repository';

const ID_MAXIMO = 4294967295;
const valido = (id: number): boolean =>
  Number.isSafeInteger(id) && id >= 1 && id <= ID_MAXIMO;

const aDireccion = (fila: DireccionFila): Direccion => ({
  id: fila.id,
  nombre: fila.nombre,
  calle: fila.calle,
  numero: fila.numero,
  ...(fila.departamento === null ? {} : { departamento: fila.departamento }),
  comuna: fila.comuna,
  region: fila.region,
  principal: fila.principal,
});

const columnas = (d: NuevaDireccion) => ({
  nombre: d.nombre,
  calle: d.calle,
  numero: d.numero,
  departamento: d.departamento ?? null,
  comuna: d.comuna,
  region: d.region,
  principal: d.principal,
});

/**
 * Direcciones en MySQL. Toda consulta filtra por usuario: una direccion
 * ajena se comporta como inexistente, igual que el adaptador dummy.
 */
export class TypeOrmDireccionesRepository extends DireccionesRepository {
  constructor(private readonly source: DataSource) {
    super();
  }

  async listarPorUsuario(usuarioId: number): Promise<Direccion[]> {
    if (!valido(usuarioId)) return [];
    const filas = await gestorActual(this.source)
      .getRepository(DireccionFila)
      .find({ where: { usuarioId }, order: { id: 'ASC' } });
    return filas.map(aDireccion);
  }

  async buscarDeUsuario(
    usuarioId: number,
    direccionId: number,
  ): Promise<Direccion | null> {
    if (!valido(usuarioId) || !valido(direccionId)) return null;
    const fila = await gestorActual(this.source)
      .getRepository(DireccionFila)
      .findOneBy({ id: direccionId, usuarioId });
    return fila ? aDireccion(fila) : null;
  }

  async crear(usuarioId: number, datos: NuevaDireccion): Promise<Direccion> {
    const repositorio = gestorActual(this.source).getRepository(DireccionFila);
    try {
      const { identifiers } = await repositorio.insert({
        usuarioId,
        ...columnas(datos),
      });
      const id = Number((identifiers[0] as { id: number | string }).id);
      return aDireccion(await repositorio.findOneByOrFail({ id }));
    } catch (error) {
      traducirErrorMysql(error);
    }
  }

  async actualizar(
    usuarioId: number,
    direccion: Direccion,
  ): Promise<Direccion | null> {
    if (!valido(usuarioId) || !valido(direccion.id)) return null;
    const repositorio = gestorActual(this.source).getRepository(DireccionFila);
    const { id, ...datos } = direccion;
    await repositorio.update({ id, usuarioId }, columnas(datos));
    const fila = await repositorio.findOneBy({ id, usuarioId });
    return fila ? aDireccion(fila) : null;
  }

  async eliminar(usuarioId: number, direccionId: number): Promise<boolean> {
    if (!valido(usuarioId) || !valido(direccionId)) return false;
    const resultado = await gestorActual(this.source)
      .getRepository(DireccionFila)
      .delete({ id: direccionId, usuarioId });
    return (resultado.affected ?? 0) > 0;
  }
}
