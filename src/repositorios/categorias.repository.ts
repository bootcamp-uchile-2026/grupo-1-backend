import type { Categoria } from '../dominio/modelos';

/** Acceso a las categorias, en el orden del menu. */
export abstract class CategoriasRepository {
  abstract listar(filtro: { destacada?: boolean }): Promise<Categoria[]>;
}
