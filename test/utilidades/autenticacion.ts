import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ServicioTokens } from '../../src/seguridad/tokens';

const DUENO_EN_RUTA = /^\/usuarios\/([1-9]\d*)(?:[/?]|$)/;

/** Cabecera Authorization firmada por la app para un usuario. */
export function bearer(app: INestApplication, usuarioId: number): string {
  return 'Bearer ' + app.get(ServicioTokens).firmar(usuarioId).token;
}

/**
 * Cliente supertest que actua como el dueno de cada ruta /usuarios/:id
 * (o como usuarioPorDefecto en las demas). Permite seguir probando los
 * contratos H2 con autenticacion real; el acceso cruzado se prueba aparte.
 */
export function solicitudAutenticada(
  app: INestApplication<App> | INestApplication,
  usuarioPorDefecto = 1,
) {
  const servidor = app.getHttpServer() as App;
  const como = (url: string): number => {
    const id = DUENO_EN_RUTA.exec(url)?.[1];
    return id && Number.isSafeInteger(Number(id))
      ? Number(id)
      : usuarioPorDefecto;
  };
  const metodo =
    (nombre: 'get' | 'post' | 'patch' | 'put' | 'delete') => (url: string) =>
      request(servidor)
        [nombre](url)
        .set('Authorization', bearer(app as INestApplication, como(url)));
  return {
    get: metodo('get'),
    post: metodo('post'),
    patch: metodo('patch'),
    put: metodo('put'),
    delete: metodo('delete'),
  };
}
