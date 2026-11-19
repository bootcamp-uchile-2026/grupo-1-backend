import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Peticion despues de pasar por AutenticacionGuard. */
export interface PeticionAutenticada {
  usuarioAutenticado?: number;
}

/**
 * Id del usuario del token verificado. Nunca proviene del body ni de la URL:
 * lo fija AutenticacionGuard.
 */
export const UsuarioAutenticado = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): number => {
    const id = contexto
      .switchToHttp()
      .getRequest<PeticionAutenticada>().usuarioAutenticado;
    if (id === undefined) {
      throw new Error('Ruta protegida sin usuario autenticado');
    }
    return id;
  },
);
