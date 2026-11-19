import type { Publicacion } from '../dominio/modelos';

/** Acceso de solo lectura a las publicaciones de Comunidad. */
export abstract class PostsRepository {
  abstract listar(): Promise<Publicacion[]>;
}
