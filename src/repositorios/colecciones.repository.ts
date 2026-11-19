import type { Coleccion } from '../dominio/modelos';

/** Acceso de solo lectura a las colecciones editoriales. */
export abstract class ColeccionesRepository {
  abstract listar(): Promise<Coleccion[]>;
}
