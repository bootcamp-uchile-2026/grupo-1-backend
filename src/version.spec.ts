import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VERSION_APLICACION } from './version';

describe('Version del entregable', () => {
  const root = resolve(__dirname, '..');
  it('coincide con el paquete y las dos versiones raiz del lock sin alterar dependencias', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8'),
    ) as { version: string };
    const lock = JSON.parse(
      readFileSync(resolve(root, 'package-lock.json'), 'utf8'),
    ) as { version: string; packages: Record<string, { version: string }> };
    expect(pkg.version).toBe(VERSION_APLICACION);
    expect(lock.version).toBe(VERSION_APLICACION);
    expect(lock.packages[''].version).toBe(VERSION_APLICACION);
  });
  it('alinea la plantilla y el valor predeterminado de Compose', () => {
    expect(readFileSync(resolve(root, '.env.example'), 'utf8')).toMatch(
      new RegExp(
        '^APP_VERSION=' + VERSION_APLICACION.replaceAll('.', '\\.') + '$',
        'm',
      ),
    );
    expect(readFileSync(resolve(root, 'docker-compose.yml'), 'utf8')).toContain(
      'APP_VERSION:-' + VERSION_APLICACION,
    );
  });
});
