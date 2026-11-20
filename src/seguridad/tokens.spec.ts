import { createHmac } from 'node:crypto';
import {
  AUDIENCIA_TOKEN,
  configuracionTokensDesdeEntorno,
  EMISOR_TOKEN,
  ServicioTokens,
  TokenInvalidoError,
} from './tokens';

const SECRETO = 'a'.repeat(32);
const b64 = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString('base64url');
const firmarCon = (secreto: string, cabecera: unknown, cuerpo: unknown) => {
  const base = `${b64(cabecera)}.${b64(cuerpo)}`;
  return `${base}.${createHmac('sha256', secreto).update(base).digest('base64url')}`;
};

describe('ServicioTokens (JWT HS256)', () => {
  let ahora = 1_800_000_000;
  const tokens = new ServicioTokens({
    secreto: SECRETO,
    expiracionSegundos: 3600,
    ahora: () => ahora,
  });
  const cuerpo = (extra: Record<string, unknown> = {}) => ({
    sub: '7',
    iss: EMISOR_TOKEN,
    aud: AUDIENCIA_TOKEN,
    iat: ahora,
    exp: ahora + 60,
    ...extra,
  });
  afterEach(() => {
    ahora = 1_800_000_000;
  });

  it('firma y verifica el sujeto con expiracion', () => {
    const { token, expiraEnSegundos } = tokens.firmar(7);
    expect(expiraEnSegundos).toBe(3600);
    expect(tokens.verificar(token)).toEqual({ usuarioId: 7 });
    const [h, c] = token.split('.');
    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({
      alg: 'HS256',
      typ: 'JWT',
    });
    expect(JSON.parse(Buffer.from(c, 'base64url').toString())).toEqual({
      sub: '7',
      iss: EMISOR_TOKEN,
      aud: AUDIENCIA_TOKEN,
      iat: ahora,
      exp: ahora + 3600,
    });
  });

  it('rechaza el token expirado (exp exacto incluido)', () => {
    const { token } = tokens.firmar(7);
    ahora += 3600;
    expect(() => tokens.verificar(token)).toThrow(TokenInvalidoError);
  });

  it.each([
    ['ausente', ''],
    ['basura', 'no-es-un-jwt'],
    ['dos partes', 'a.b'],
    ['demasiado largo', 'a.b.' + 'c'.repeat(3000)],
  ])('rechaza token %s', (_n, token) => {
    expect(() => tokens.verificar(token)).toThrow(TokenInvalidoError);
  });

  it('rechaza contenido manipulado aunque conserve la firma original', () => {
    const [h, , f] = tokens.firmar(7).token.split('.');
    const otro = b64({ ...cuerpo(), sub: '8' });
    expect(() => tokens.verificar(`${h}.${otro}.${f}`)).toThrow(
      TokenInvalidoError,
    );
  });

  it.each([
    [
      'otro secreto',
      firmarCon('b'.repeat(32), { alg: 'HS256', typ: 'JWT' }, cuerpo()),
    ],
    [
      'alg none sin firma',
      `${b64({ alg: 'none', typ: 'JWT' })}.${b64(cuerpo())}.`,
    ],
    [
      'alg HS512 declarado',
      firmarCon(SECRETO, { alg: 'HS512', typ: 'JWT' }, cuerpo()),
    ],
    [
      'cabecera con kid',
      firmarCon(SECRETO, { alg: 'HS256', typ: 'JWT', kid: 'x' }, cuerpo()),
    ],
    [
      'emisor ajeno',
      firmarCon(SECRETO, { alg: 'HS256', typ: 'JWT' }, cuerpo({ iss: 'otro' })),
    ],
    [
      'audiencia ajena',
      firmarCon(SECRETO, { alg: 'HS256', typ: 'JWT' }, cuerpo({ aud: 'otro' })),
    ],
    [
      'sub no canonico',
      firmarCon(SECRETO, { alg: 'HS256', typ: 'JWT' }, cuerpo({ sub: '07' })),
    ],
    [
      'sub numerico',
      firmarCon(SECRETO, { alg: 'HS256', typ: 'JWT' }, cuerpo({ sub: 7 })),
    ],
    [
      'sub no seguro',
      firmarCon(
        SECRETO,
        { alg: 'HS256', typ: 'JWT' },
        cuerpo({ sub: '9007199254740993' }),
      ),
    ],
    [
      'emitido en el futuro',
      firmarCon(
        SECRETO,
        { alg: 'HS256', typ: 'JWT' },
        cuerpo({ iat: 1_800_000_000 + 120 }),
      ),
    ],
    [
      'sin exp',
      firmarCon(
        SECRETO,
        { alg: 'HS256', typ: 'JWT' },
        { ...cuerpo(), exp: undefined },
      ),
    ],
  ])('rechaza %s', (_n, token) => {
    expect(() => tokens.verificar(token)).toThrow(TokenInvalidoError);
  });

  it('exige secreto de al menos 32 bytes y expiracion acotada', () => {
    expect(() => configuracionTokensDesdeEntorno({})).toThrow('JWT_SECRET');
    expect(() =>
      configuracionTokensDesdeEntorno({ JWT_SECRET: 'corto' }),
    ).toThrow('JWT_SECRET');
    expect(() =>
      configuracionTokensDesdeEntorno({
        JWT_SECRET: SECRETO,
        JWT_EXPIRACION_SEGUNDOS: '10',
      }),
    ).toThrow('JWT_EXPIRACION_SEGUNDOS');
    expect(configuracionTokensDesdeEntorno({ JWT_SECRET: SECRETO })).toEqual({
      secreto: SECRETO,
      expiracionSegundos: 3600,
    });
    expect(() =>
      configuracionTokensDesdeEntorno({ JWT_SECRET: ' '.repeat(32) }),
    ).toThrow('JWT_SECRET');
    expect(
      () =>
        new ServicioTokens({
          secreto: ' '.repeat(32),
          expiracionSegundos: 3600,
        }),
    ).toThrow('secreto JWT');
    expect(() => tokens.firmar(0)).toThrow();
  });
});
