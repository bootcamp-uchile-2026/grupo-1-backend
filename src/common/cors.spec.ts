import {
  CABECERAS_PERMITIDAS,
  leerOrigenesCors,
  opcionesCors,
  ORIGENES_DESARROLLO,
} from './cors';

describe('leerOrigenesCors', () => {
  it('sin variable usa los origenes locales de Vite fuera de produccion', () => {
    expect(leerOrigenesCors(undefined, 'development')).toEqual([
      ...ORIGENES_DESARROLLO,
    ]);
    expect(leerOrigenesCors('  ', undefined)).toEqual([...ORIGENES_DESARROLLO]);
  });

  it('sin variable en produccion no admite origenes cruzados', () => {
    expect(leerOrigenesCors(undefined, 'production')).toEqual([]);
    expect(leerOrigenesCors('', 'production')).toEqual([]);
  });

  it('acepta una lista exacta, recorta espacios y elimina duplicados', () => {
    expect(
      leerOrigenesCors(
        ' https://app.example.cl , http://localhost:5173,https://app.example.cl',
        'production',
      ),
    ).toEqual(['https://app.example.cl', 'http://localhost:5173']);
    expect(
      leerOrigenesCors('https://app.example.cl:8443', 'production'),
    ).toEqual(['https://app.example.cl:8443']);
  });

  it.each([
    '*',
    'https://*.example.cl',
    'https://app.example.cl/',
    'https://app.example.cl/ruta',
    'https://app.example.cl?x=1',
    'app.example.cl',
    'ftp://app.example.cl',
    'https://usuario:clave@app.example.cl',
    'https://APP.example.cl',
    'https://app.example.cl,',
    'null',
  ])('rechaza el origen invalido %p', (valor) => {
    expect(() => leerOrigenesCors(valor, 'development')).toThrow(
      'CORS_ORIGENES contiene un origen invalido',
    );
  });
});

describe('opcionesCors', () => {
  it('no habilita credenciales y declara cabeceras, metodos y preflight', () => {
    const opciones = opcionesCors(['https://app.example.cl']);
    expect(opciones).toEqual({
      origin: ['https://app.example.cl'],
      methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: [...CABECERAS_PERMITIDAS],
      exposedHeaders: ['X-Request-Id'],
      credentials: false,
      maxAge: 600,
      optionsSuccessStatus: 204,
    });
    expect(CABECERAS_PERMITIDAS).toEqual([
      'Authorization',
      'Content-Type',
      'X-Request-Id',
      'Idempotency-Key',
    ]);
  });
});

describe('Privacidad de la configuracion CORS', () => {
  it.each(['credenciales', 'ruta', 'query', 'fragmento'])(
    'rechaza el origen con %s sin incluir contenido sensible en error o stack',
    (caso) => {
      const marcador = 'sensitive-test-marker';
      const origenes: Record<string, string> = {
        credenciales: 'https://usuario:' + marcador + '@example.invalid',
        ruta: 'https://example.invalid/' + marcador,
        query: 'https://example.invalid?token=' + marcador,
        fragmento: 'https://example.invalid#' + marcador,
      };
      let captured: Error | undefined;
      try {
        leerOrigenesCors(origenes[caso], 'production');
      } catch (error) {
        if (error instanceof Error) captured = error;
      }
      expect(captured).toBeInstanceOf(Error);
      expect(captured?.message).toContain(
        'CORS_ORIGENES contiene un origen invalido',
      );
      expect(captured?.message).not.toContain(marcador);
      expect(captured?.stack).not.toContain(marcador);
      expect(captured?.message).not.toContain(origenes[caso]);
    },
  );
});
