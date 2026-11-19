import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { RUTA_PUBLICA } from './publico.decorator';
import { ServicioTokens } from './tokens';
import type { PeticionAutenticada } from './usuario-autenticado.decorator';

const BEARER = /^Bearer ([A-Za-z0-9._-]+)$/;
const ID_CANONICO = /^[1-9]\d*$/;

interface PeticionHttp extends PeticionAutenticada {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
}

/**
 * Guard global: toda ruta exige un JWT valido salvo las marcadas @Publico().
 * Si la ruta tiene :usuarioId canonico, debe coincidir con el usuario del
 * token. Un usuario ajeno responde igual que uno inexistente (404), como ya
 * hacia H2 con los recursos de otro usuario. Un :usuarioId no canonico sigue
 * llegando a IdPositivoPipe, que responde 400 como en H2.
 */
@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: ServicioTokens,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    if (contexto.getType() !== 'http') return true;
    const publica = this.reflector.getAllAndOverride<boolean>(RUTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;

    const peticion = contexto.switchToHttp().getRequest<PeticionHttp>();
    const cabecera = peticion.headers.authorization;
    const coincidencia =
      typeof cabecera === 'string' ? BEARER.exec(cabecera) : null;
    if (!coincidencia) {
      throw new UnauthorizedException('Se requiere un token de acceso');
    }
    let usuarioId: number;
    try {
      usuarioId = this.tokens.verificar(coincidencia[1]).usuarioId;
    } catch {
      throw new UnauthorizedException('Token de acceso invalido o expirado');
    }

    const enRuta = peticion.params?.usuarioId;
    if (
      typeof enRuta === 'string' &&
      ID_CANONICO.test(enRuta) &&
      Number.isSafeInteger(Number(enRuta)) &&
      Number(enRuta) !== usuarioId
    ) {
      throw new RecursoNoEncontradoError(
        `No existe el usuario con id ${enRuta}`,
      );
    }
    peticion.usuarioAutenticado = usuarioId;
    return true;
  }
}
