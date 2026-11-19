import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ImagenesRepository } from './imagenes.repository';
import type { PeticionAutenticada } from '../seguridad/usuario-autenticado.decorator';
@Injectable()
export class AdministrarImagenesGuard implements CanActivate {
  constructor(private readonly repository: ImagenesRepository) {}
  async canActivate(context: ExecutionContext) {
    const actor = context
      .switchToHttp()
      .getRequest<PeticionAutenticada>().usuarioAutenticado;
    if (!actor || !(await this.repository.autorizado(actor)))
      throw new ForbiddenException(
        'Se requiere permiso administrativo de imagenes',
      );
    return true;
  }
}
