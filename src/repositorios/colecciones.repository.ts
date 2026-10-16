import { ColeccionResponseDto } from '../dto/coleccion-response.dto';

/** Acceso de solo lectura a las colecciones editoriales. */
export abstract class ColeccionesRepository {
  abstract listar(): Promise<ColeccionResponseDto[]>;
}
