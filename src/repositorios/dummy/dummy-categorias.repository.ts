import type { Categoria } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { CATEGORIAS_DUMMY } from '../../data/categorias.dummy';

import { CategoriasRepository } from '../categorias.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyCategoriasRepository extends CategoriasRepository {
  listar(filtro: { destacada?: boolean }): Promise<Categoria[]> {
    return Promise.resolve(
      CATEGORIAS_DUMMY.filter(
        (categoria) =>
          filtro.destacada === undefined ||
          categoria.destacada === filtro.destacada,
      ).map((categoria) => copiar(categoria)),
    );
  }
}
