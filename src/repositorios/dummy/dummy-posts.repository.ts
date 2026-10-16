import { Injectable } from '@nestjs/common';
import { POSTS_DUMMY } from '../../data/posts.dummy';
import { PostResponseDto } from '../../dto/post-response.dto';
import { PostsRepository } from '../posts.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyPostsRepository extends PostsRepository {
  listar(): Promise<PostResponseDto[]> {
    return Promise.resolve(copiar(POSTS_DUMMY));
  }
}
