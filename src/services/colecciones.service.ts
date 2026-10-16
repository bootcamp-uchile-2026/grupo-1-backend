import { Injectable } from '@nestjs/common';
import { ColeccionResponseDto } from '../dto/coleccion-response.dto';
import { ColeccionesRepository } from '../repositorios/colecciones.repository';

/**
 * Colecciones editoriales usadas en "Inspiracion para ti" y en la
 * navegacion de Looks. Son de solo lectura.
 */
@Injectable()
export class ColeccionesService {
  constructor(private readonly colecciones: ColeccionesRepository) {}

  /** Devuelve todas las colecciones publicadas. */
  async obtenerColecciones(): Promise<ColeccionResponseDto[]> {
    return this.colecciones.listar();
  }
}
