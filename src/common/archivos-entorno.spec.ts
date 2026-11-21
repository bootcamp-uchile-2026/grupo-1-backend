import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('Exclusion de archivos de entorno sensibles', () => {
  const repo = resolve(__dirname, '../..');

  it('ignora variantes sensibles en la raiz y en subdirectorios', () => {
    const names = [
      '.env',
      '.env.production',
      '.env.development',
      '.env.test',
      '.env.staging',
      '.env.local',
      '.env.production.local',
      'config/.env.staging',
      'config/.env.private',
    ];
    const result = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], {
      cwd: repo,
      input: names.join('\n') + '\n',
      encoding: 'utf8',
      windowsHide: true,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split(/\r?\n/)).toEqual(names);
  });

  it('mantiene versionable la plantilla publica .env.example', () => {
    const result = spawnSync(
      'git',
      ['check-ignore', '--no-index', '.env.example'],
      {
        cwd: repo,
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
  });
});
