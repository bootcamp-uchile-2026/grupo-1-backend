import { PostResponseDto } from '../dto/post-response.dto';

/** Acceso de solo lectura a las publicaciones de Comunidad. */
export abstract class PostsRepository {
  abstract listar(): Promise<PostResponseDto[]>;
}
