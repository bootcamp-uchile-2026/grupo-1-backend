import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ESQUEMA_ESPERADO,
  MIGRACIONES_ESPERADAS,
} from './utilidades/esquema-esperado';

describe('MER fisico vigente publicado', () => {
  it('representa exactamente las 29 tablas, 44 FK y la secuencia de migraciones contrastadas con MySQL', () => {
    const root = resolve(__dirname, '..');
    const published: unknown = JSON.parse(
      readFileSync(resolve(root, 'docs/mer-fisico-h3.schema.json'), 'utf8'),
    );
    expect(published).toEqual({
      migrations: MIGRACIONES_ESPERADAS,
      tables: ESQUEMA_ESPERADO,
    });
    const diagram = readFileSync(
      resolve(root, 'docs/MER_FISICO_H3.md'),
      'utf8',
    );
    expect(Object.keys(ESQUEMA_ESPERADO)).toHaveLength(29);
    expect(diagram.split(' : "').length - 1).toBe(44);
    for (const table of Object.keys(ESQUEMA_ESPERADO))
      expect(diagram).toContain('  ' + table + ' {');
    expect(diagram).toContain('NO implementada');
  });
});
