import { Module } from '@nestjs/common';
import {
  AdministrarImagenesController,
  ImagenesPublicasController,
} from './imagenes.controller';
import { ImagenesService } from './imagenes.service';
import { ImagenesRepository } from './imagenes.repository';
import { AdministrarImagenesGuard } from './imagenes.guard';
@Module({
  controllers: [AdministrarImagenesController, ImagenesPublicasController],
  providers: [ImagenesService, ImagenesRepository, AdministrarImagenesGuard],
  exports: [ImagenesService, ImagenesRepository],
})
export class ImagenesModule {}
