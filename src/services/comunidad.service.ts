import { Injectable } from '@nestjs/common';
import { PostResponseDto } from '../dto/post-response.dto';
import { PostsRepository } from '../repositorios/posts.repository';

/** Publicaciones de la seccion Comunidad. Son de solo lectura. */
@Injectable()
export class ComunidadService {
  constructor(private readonly posts: PostsRepository) {}

  /** Devuelve las publicaciones que se muestran en Comunidad. */
  async obtenerPosts(): Promise<PostResponseDto[]> {
    return this.posts.listar();
  }
}
