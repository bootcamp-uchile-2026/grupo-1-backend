import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { TypeOrmLooksRepository } from '../repositorios/typeorm/typeorm-looks.repository';
import { Module } from '@nestjs/common';
import { LooksController } from '../controllers/looks.controller';
import { LooksService } from '../services/looks.service';
import { LooksRepository } from '../repositorios/looks.repository';
import { DummyLooksRepository } from '../repositorios/dummy/dummy-looks.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [LooksController],
  providers: [
    LooksService,
    proveerDummy(DummyLooksRepository),
    proveerRepositorio(
      LooksRepository,
      DummyLooksRepository,
      TypeOrmLooksRepository,
    ),
  ],
  exports: [LooksService, LooksRepository],
})
export class LooksModule {}
