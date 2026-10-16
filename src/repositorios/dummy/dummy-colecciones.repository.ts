import { Injectable } from '@nestjs/common';
import { COLECCIONES_DUMMY } from '../../data/colecciones.dummy';
import { ColeccionResponseDto } from '../../dto/coleccion-response.dto';
import { ColeccionesRepository } from '../colecciones.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyColeccionesRepository extends ColeccionesRepository {
  listar(): Promise<ColeccionResponseDto[]> {
    return Promise.resolve(copiar(COLECCIONES_DUMMY));
  }
}
