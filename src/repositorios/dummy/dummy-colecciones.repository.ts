import type { Coleccion } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { COLECCIONES_DUMMY } from '../../data/colecciones.dummy';

import { ColeccionesRepository } from '../colecciones.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyColeccionesRepository extends ColeccionesRepository {
  listar(): Promise<Coleccion[]> {
    return Promise.resolve(copiar(COLECCIONES_DUMMY));
  }
}
