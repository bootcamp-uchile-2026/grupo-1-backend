import snapshot from '../fixtures/contratos-http.json';
export function normalizarContrato(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const copy = { ...body } as Record<string, unknown>;
  if ('timestamp' in copy) copy.timestamp = 0;
  if ('requestId' in copy) copy.requestId = 0;
  return copy;
}
export function contratoHttp(url: string) {
  const cases = snapshot.cases as Record<
    string,
    { status: number; body: unknown }
  >;
  const expected = cases[url];
  if (!expected) throw new Error('Ruta sin contrato de prueba: ' + url);
  return expected;
}
export const direccionesEsperadas: unknown[] = snapshot.direcciones;
export const openapiEsperado = snapshot.openapi;
