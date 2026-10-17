import { Injectable } from '@nestjs/common';
import { CategoriaResponseDto } from '../dto/categoria-response.dto';
import { CategoriasRepository } from '../repositorios/categorias.repository';

/**
 * Categorias del menu principal y de "Categorias populares" de la home.
 * El listado no depende de que la categoria tenga productos.
 */
@Injectable()
export class CategoriasService {
  constructor(private readonly categorias: CategoriasRepository) {}

  /**
   * Devuelve las categorias en el orden del menu.
   * Con destacada definido, solo las que tienen ese valor.
   */
  obtenerCategorias(destacada?: boolean): Promise<CategoriaResponseDto[]> {
    return this.categorias.listar({ destacada });
  }
}
