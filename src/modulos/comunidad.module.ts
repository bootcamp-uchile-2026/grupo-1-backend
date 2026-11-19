import { TypeOrmPostsRepository } from '../repositorios/typeorm/typeorm-posts.repository';
import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { Module } from '@nestjs/common';
import { ComunidadController } from '../controllers/comunidad.controller';
import { ComunidadService } from '../services/comunidad.service';
import { PostsRepository } from '../repositorios/posts.repository';
import { DummyPostsRepository } from '../repositorios/dummy/dummy-posts.repository';

@Module({
  imports: [],
  controllers: [ComunidadController],
  providers: [
    ComunidadService,
    proveerDummy(DummyPostsRepository),
    proveerRepositorio(
      PostsRepository,
      DummyPostsRepository,
      TypeOrmPostsRepository,
    ),
  ],
  exports: [ComunidadService, PostsRepository],
})
export class ComunidadModule {}
