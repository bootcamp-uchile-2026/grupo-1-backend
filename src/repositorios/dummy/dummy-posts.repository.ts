import type { Publicacion } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { POSTS_DUMMY } from '../../data/posts.dummy';

import { PostsRepository } from '../posts.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyPostsRepository extends PostsRepository {
  listar(): Promise<Publicacion[]> {
    return Promise.resolve(copiar(POSTS_DUMMY));
  }
}
