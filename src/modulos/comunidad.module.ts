import { DataSource } from 'typeorm';
import { TypeOrmPostsRepository } from '../repositorios/typeorm/typeorm-posts.repository';
import { Module } from '@nestjs/common';
import { ComunidadController } from '../controllers/comunidad.controller';
import { ComunidadService } from '../services/comunidad.service';
import { PostsRepository } from '../repositorios/posts.repository';

@Module({
  imports: [],
  controllers: [ComunidadController],
  providers: [
    ComunidadService,
    {
      provide: PostsRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeOrmPostsRepository(source),
    },
  ],
  exports: [ComunidadService, PostsRepository],
})
export class ComunidadModule {}
