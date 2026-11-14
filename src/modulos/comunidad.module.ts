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
    DummyPostsRepository,
    { provide: PostsRepository, useExisting: DummyPostsRepository },
  ],
  exports: [ComunidadService, PostsRepository],
})
export class ComunidadModule {}
