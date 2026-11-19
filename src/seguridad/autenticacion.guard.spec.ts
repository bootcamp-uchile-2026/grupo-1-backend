import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { AutenticacionGuard } from './autenticacion.guard';
import { ServicioTokens } from './tokens';

const tokens = new ServicioTokens({
  secreto: 'z'.repeat(32),
  expiracionSegundos: 600,
});
const contexto = (peticion: object, publica = false): ExecutionContext => {
  const reflector = {
    getAllAndOverride: () => publica,
  } as unknown as Reflector;
  guard = new AutenticacionGuard(reflector, tokens);
  return {
    getType: () => 'http',
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as unknown as ExecutionContext;
};
let guard: AutenticacionGuard;
const conToken = (id: number, params: Record<string, string> = {}) => ({
  headers: { authorization: 'Bearer ' + tokens.firmar(id).token },
  params,
});

describe('AutenticacionGuard', () => {
  it('deja pasar rutas publicas sin token', () => {
    const c = contexto({ headers: {} }, true);
    expect(guard.canActivate(c)).toBe(true);
  });

  it.each([
    ['ausente', {}],
    ['esquema Basic', { authorization: 'Basic abc' }],
    ['Bearer vacio', { authorization: 'Bearer ' }],
    ['token invalido', { authorization: 'Bearer a.b.c' }],
  ])('responde 401 con token %s', (_n, headers) => {
    const c = contexto({ headers, params: { usuarioId: '1' } });
    expect(() => guard.canActivate(c)).toThrow(UnauthorizedException);
  });

  it('acepta al dueno y fija el usuario autenticado', () => {
    const peticion: Record<string, unknown> = conToken(1, { usuarioId: '1' });
    expect(guard.canActivate(contexto(peticion))).toBe(true);
    expect(peticion.usuarioAutenticado).toBe(1);
  });

  it('un usuario ajeno se ve como inexistente (404)', () => {
    expect(() =>
      guard.canActivate(contexto(conToken(1, { usuarioId: '2' }))),
    ).toThrow(RecursoNoEncontradoError);
  });

  it.each(['01', '0', 'abc', '9007199254740993'])(
    'id de ruta no canonico %s se deja al pipe (400 H2)',
    (usuarioId) => {
      expect(guard.canActivate(contexto(conToken(1, { usuarioId })))).toBe(
        true,
      );
    },
  );
});
