import { SetMetadata } from '@nestjs/common';

export const RUTA_PUBLICA = 'stylenow:ruta-publica';

/** Marca un controller o handler que no exige token (catalogo, registro, login). */
export const Publico = (): MethodDecorator & ClassDecorator =>
  SetMetadata(RUTA_PUBLICA, true);
