import type { Direccion } from '../dominio/modelos';

/** Datos de una direccion sin su id, que asigna el repositorio. */
export type NuevaDireccion = Omit<Direccion, 'id'>;

/**
 * Acceso a las direcciones. Toda operacion se limita a las direcciones del
 * usuario indicado: una direccion ajena se comporta como inexistente.
 */
export abstract class DireccionesRepository {
  abstract listarPorUsuario(usuarioId: number): Promise<Direccion[]>;

  abstract buscarDeUsuario(
    usuarioId: number,
    direccionId: number,
  ): Promise<Direccion | null>;

  abstract crear(usuarioId: number, datos: NuevaDireccion): Promise<Direccion>;

  /** Reemplaza la direccion. Devuelve null si no existe para ese usuario. */
  abstract actualizar(
    usuarioId: number,
    direccion: Direccion,
  ): Promise<Direccion | null>;

  /** Devuelve false si la direccion no existe para ese usuario. */
  abstract eliminar(usuarioId: number, direccionId: number): Promise<boolean>;
}
