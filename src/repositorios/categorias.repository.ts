import { CategoriaResponseDto } from '../dto/categoria-response.dto';

/** Acceso a las categorias, en el orden del menu. */
export abstract class CategoriasRepository {
  abstract listar(filtro: {
    destacada?: boolean;
  }): Promise<CategoriaResponseDto[]>;
}
