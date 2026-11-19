import type { Look } from '../dominio/modelos';

/** Datos de un look sin su id, que asigna el repositorio. */
export type NuevoLook = Omit<Look, 'id'>;

/** Acceso a los looks y a los looks guardados por cada usuario. */
export abstract class LooksRepository {
  /** Devuelve una pagina de looks y el total existente. */
  abstract listarPagina(
    desplazamiento: number,
    limite: number,
  ): Promise<{ looks: Look[]; total: number }>;

  abstract buscarPorId(id: number): Promise<Look | null>;

  abstract crear(datos: NuevoLook, usuarioId?: number): Promise<Look>;

  /** Asocia un look existente al usuario. Guardarlo dos veces no duplica. */
  abstract guardarParaUsuario(usuarioId: number, lookId: number): Promise<void>;
}
