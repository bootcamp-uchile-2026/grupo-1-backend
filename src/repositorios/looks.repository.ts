import { LookResponseDto } from '../dto/look-response.dto';

/** Datos de un look sin su id, que asigna el repositorio. */
export type NuevoLook = Omit<LookResponseDto, 'id'>;

/** Acceso a los looks y a los looks guardados por cada usuario. */
export abstract class LooksRepository {
  /** Devuelve una pagina de looks y el total existente. */
  abstract listarPagina(
    desplazamiento: number,
    limite: number,
  ): Promise<{ looks: LookResponseDto[]; total: number }>;

  abstract buscarPorId(id: number): Promise<LookResponseDto | null>;

  abstract crear(datos: NuevoLook): Promise<LookResponseDto>;

  /** Asocia un look existente al usuario. Guardarlo dos veces no duplica. */
  abstract guardarParaUsuario(usuarioId: number, lookId: number): Promise<void>;
}
