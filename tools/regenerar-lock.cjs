/** Reconstruye el lock sin node_modules ni metadatos opcionales heredados. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const repo = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
const previous = JSON.parse(fs.readFileSync(path.join(repo, 'package-lock.json'), 'utf8'));
const pinned = { ...pkg };
for (const group of ['dependencies', 'devDependencies']) {
  pinned[group] = Object.fromEntries(Object.entries(pkg[group] ?? {}).map(([name, range]) => {
    const version = previous.packages?.['node_modules/' + name]?.version;
    if (!version) throw new Error('Falta version resuelta: ' + name);
    return [name, version || range];
  }));
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-lock-'));
fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify(pinned, null, 2));
const result = cp.spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--package-lock-only', '--ignore-scripts'], {
  cwd: temp, stdio: 'inherit', shell: process.platform === 'win32',
});
if (result.status !== 0) process.exit(result.status ?? 1);
const lock = JSON.parse(fs.readFileSync(path.join(temp, 'package-lock.json'), 'utf8'));
// La resolucion fija versiones, pero el manifiesto raiz conserva los rangos del proyecto.
for (const group of ['dependencies', 'devDependencies']) lock.packages[''][group] = pkg[group];
fs.writeFileSync(path.join(repo, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
console.log('Lock reconstruido sin cambiar versiones directas; verificar con npm ci Windows/Linux.');
