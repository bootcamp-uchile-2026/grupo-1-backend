/** Solo crea recursos nuevos y exclusivos; nunca usa una DB del entorno del usuario. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const net = require('node:net');
const assert = require('node:assert/strict');
const { esquemaRegistrado } = require('./esquema-registrado.cjs');

const repo = path.resolve(__dirname, '../..');
const id = crypto.randomBytes(6).toString('hex');
const name = 'stylenow-pr0-lab-' + id;
const volume = name + '-data';
const database = 'stylenow_pr0_' + id + '_test';
const username = 'lab_' + id;
const password = crypto.randomBytes(24).toString('hex');
const rootPassword = crypto.randomBytes(24).toString('hex');
// Secreto JWT propio del laboratorio: aleatorio, 32 bytes, el mismo para todos sus procesos.
const jwtSecret = crypto.randomBytes(32).toString('hex');
const root = process.env.EVIDENCIA_PILOTO_DIR
  ? path.resolve(process.env.EVIDENCIA_PILOTO_DIR)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-pr0-evidencia-'));
assert(
  root !== repo && !root.startsWith(repo + path.sep),
  'Evidencias fuera del repositorio fuente',
);
fs.mkdirSync(root, { recursive: true });
const privateDir = process.env.PRIVADO_PILOTO_DIR
  ? path.resolve(process.env.PRIVADO_PILOTO_DIR)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-pr0-privado-'));
assert(
  privateDir !== repo && !privateDir.startsWith(repo + path.sep),
  'Credenciales fuera del repositorio fuente',
);
fs.mkdirSync(privateDir, { recursive: true });
const sanitize = (value) =>
  String(value)
    .replaceAll(password, '[REDACTED]')
    .replaceAll(rootPassword, '[REDACTED]')
    .replaceAll(jwtSecret, '[REDACTED]');
const results = {
  id,
  container: name,
  volume,
  database,
  mode: 'SQL-01: todas las E2E MySQL, sin adaptadores de memoria',
  checks: [],
};
let started = false;
const processes = new Set();

function run(label, bin, args, env = process.env) {
  const start = new Date().toISOString();
  const r = cp.spawnSync(bin, args, {
    cwd: repo,
    env,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
    windowsHide: true,
  });
  fs.writeFileSync(
    path.join(root, label + '.log'),
    sanitize((r.stdout || '') + (r.stderr || '')),
  );
  results.checks.push({
    label,
    start,
    end: new Date().toISOString(),
    exit: r.status,
  });
  if (r.status !== 0)
    throw new Error(label + ' fallo; consultar log sanitizado.');
  console.log(label + ': PASS');
  return r.stdout.trim();
}
function own() {
  const labels = JSON.parse(
    run('verificar-propiedad-' + results.checks.length, 'docker', [
      'inspect',
      '--format',
      '{{json .Config.Labels}}',
      name,
    ]),
  );
  assert.equal(labels['stylenow.pr0.id'], id);
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ready(config) {
  const mysql = require('mysql2/promise');
  let lastCode;
  for (let i = 0; i < 100; i++) {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: Number(config.DB_PORT),
        user: username,
        password,
        database,
        connectTimeout: 1000,
      });
      const [rows] = await connection.query(
        'SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS principal',
      );
      assert.match(rows[0].version, /^8\.4\./);
      assert.equal(rows[0].db, database);
      assert(rows[0].principal.startsWith(username + '@'));
      results.mysqlVersion = rows[0].version;
      return;
    } catch (error) {
      lastCode = error.code;
      await pause(600);
    } finally {
      if (connection) await connection.end();
    }
  }
  throw new Error(
    'MySQL exclusivo no alcanzo disponibilidad: ' + String(lastCode),
  );
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function startApi(config, mode, label) {
  const port = await freePort();
  const child = cp.spawn(process.execPath, ['dist/main.js'], {
    cwd: repo,
    env: {
      ...config,
      PERSISTENCIA: mode,
      PORT: String(port),
      APP_NAME: 'StyleNow PR0 QA',
      APP_VERSION: require(path.join(repo, 'package.json')).version,
      SWAGGER_PATH: 'api',
    },
    windowsHide: true,
  });
  processes.add(child);
  let output = '';
  child.stdout.on('data', (b) => {
    output += b;
  });
  child.stderr.on('data', (b) => {
    output += b;
  });
  child.on('close', () => {
    fs.writeFileSync(path.join(root, label + '.log'), sanitize(output));
    processes.delete(child);
  });
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error('API no arranco: ' + label);
    try {
      if ((await fetch(`http://127.0.0.1:${port}/categorias`)).status === 200)
        return { child, port };
    } catch {}
    await pause(200);
  }
  throw new Error('API no disponible: ' + label);
}
async function stopApi(child) {
  if (child.exitCode !== null) return;
  const closed = new Promise((resolve) => child.once('close', resolve));
  child.kill();
  await closed;
}
async function persistentHttp(config, label) {
  const api = await startApi(config, 'mysql', label);
  try {
    const checks = [];
    for (const url of ['/categorias', '/colecciones', '/posts']) {
      const res = await fetch(`http://127.0.0.1:${api.port}${url}`);
      assert.equal(res.status, 200);
      const rows = await res.json();
      assert(rows.some((r) => r.id === 9001));
      checks.push({
        url,
        status: res.status,
        sentinel9001: true,
        rows: rows.length,
      });
    }
    const products = await fetch(`http://127.0.0.1:${api.port}/productos`);
    assert.equal(products.status, 200);
    const swagger = await fetch(`http://127.0.0.1:${api.port}/api`);
    assert.equal(swagger.status, 200);
    results.checks.push({
      label,
      exit: 0,
      checks,
      productos: products.status,
      api: swagger.status,
    });
  } finally {
    await stopApi(api.child);
  }
}

(async () => {
  try {
    if (
      process.env.DOCKER_HOST &&
      !/^(unix|npipe):/.test(process.env.DOCKER_HOST)
    ) {
      throw new Error(
        'El harness solo admite Docker local, no DOCKER_HOST remoto.',
      );
    }
    const dockerHost = run('docker-local', 'docker', [
      'context',
      'inspect',
      '--format',
      '{{(index .Endpoints "docker").Host}}',
    ]);
    assert.match(
      dockerHost,
      /^(unix|npipe):/,
      'Contexto Docker local requerido',
    );
    for (const args of [
      ['container', 'inspect', name],
      ['volume', 'inspect', volume],
    ]) {
      const r = cp.spawnSync('docker', args, {
        encoding: 'utf8',
        windowsHide: true,
      });
      assert.notEqual(r.status, 0, 'No reutilizar recurso existente');
    }
    run('build', process.execPath, [
      'node_modules/@nestjs/cli/bin/nest.js',
      'build',
    ]);
    run('mysql-image', 'docker', ['pull', 'mysql:8.4']);
    run('crear-volumen', 'docker', [
      'volume',
      'create',
      '--label',
      'stylenow.pr0.id=' + id,
      volume,
    ]);
    const envFile = path.join(privateDir, 'mysql-' + id + '.env');
    fs.writeFileSync(
      envFile,
      `MYSQL_DATABASE=${database}\nMYSQL_USER=${username}\nMYSQL_PASSWORD=${password}\nMYSQL_ROOT_PASSWORD=${rootPassword}\n`,
      { mode: 0o600 },
    );
    const stableDbPort = await freePort();
    run('crear-mysql', 'docker', [
      'run',
      '-d',
      '--name',
      name,
      '--label',
      'stylenow.pr0.id=' + id,
      '--env-file',
      envFile,
      '--publish',
      `127.0.0.1:${stableDbPort}:3306`,
      '--mount',
      `type=volume,source=${volume},target=/var/lib/mysql`,
      'mysql:8.4',
    ]);
    started = true;
    own();
    const bindings = JSON.parse(
      run('puerto-mysql', 'docker', [
        'inspect',
        '--format',
        '{{json .NetworkSettings.Ports}}',
        name,
      ]),
    );
    const port = bindings['3306/tcp'][0].HostPort;
    const config = {
      ...process.env,
      PERSISTENCIA: 'mysql',
      DB_HOST: '127.0.0.1',
      DB_PORT: port,
      DB_USERNAME: username,
      DB_PASSWORD: password,
      DB_DATABASE: database,
      MYSQL_LAB_DATABASE: database,
      MYSQL_LAB_GUARD: 'exclusive-disposable-pr0',
      STYLENOW_SQL_TEST: '1',
      JWT_SECRET: jwtSecret,
    };
    fs.writeFileSync(
      path.join(privateDir, 'conexion-' + id + '.json'),
      JSON.stringify({
        DB_HOST: config.DB_HOST,
        DB_PORT: port,
        DB_USERNAME: username,
        DB_PASSWORD: password,
        DB_DATABASE: database,
      }),
      { mode: 0o600 },
    );
    results.host = '127.0.0.1';
    results.port = port;
    await ready(config);
    run(
      'arranque-fail-fast',
      process.execPath,
      ['test/persistencia/verificar-arranque-sql.cjs', root],
      config,
    );
    run(
      'sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'piloto.mysql',
      ],
      config,
    );
    run(
      'productos-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'productos.mysql',
      ],
      config,
    );
    run(
      'identidad-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'identidad.mysql',
      ],
      config,
    );
    run(
      'comercio-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'comercio.mysql',
      ],
      config,
    );
    run(
      'p4-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'p4.mysql',
      ],
      config,
    );
    run(
      'p5-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'imagenes.mysql',
      ],
      config,
    );
    run(
      'esquema-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'esquema.mysql',
      ],
      config,
    );
    run(
      'integridad-mp701-sql-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'integridad-mp701.mysql',
      ],
      config,
    );
    run(
      'sql01-factories-e2e',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathPatterns',
        'sql01.mysql',
      ],
      config,
    );
    run(
      'e2e-contratos-sql',
      process.execPath,
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-e2e.json',
        '--runInBand',
        '--testTimeout=60000',
        '--testPathIgnorePatterns',
        '.mysql.e2e-spec',
      ],
      { ...config, STYLENOW_REINICIO_SQL_POR_PRUEBA: '1' },
    );
    await persistentHttp(config, 'api-proceso-1');
    await persistentHttp(config, 'api-proceso-2');
    own();
    run('reiniciar-mysql', 'docker', ['restart', name]);
    await ready(config);
    await persistentHttp(config, 'api-tras-reinicio-mysql');
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: config.DB_HOST,
      port: Number(port),
      user: username,
      password,
      database,
    });
    try {
      const [tables] = await connection.query('SHOW TABLES');
      const registrado = await esquemaRegistrado(repo, config);
      assert.deepEqual(
        tables.map((r) => Object.values(r)[0]).sort(),
        [...registrado.tablas, 'migrations'].sort(),
      );
      const [aplicadas] = await connection.query(
        'SELECT name FROM migrations ORDER BY id',
      );
      assert.deepEqual(
        aplicadas.map((r) => r.name),
        registrado.migraciones,
      );
      const [counts] = await connection.query(
        'SELECT (SELECT COUNT(*) FROM categoria) AS categorias, (SELECT COUNT(*) FROM coleccion) AS colecciones, (SELECT COUNT(*) FROM post) AS publicaciones',
      );
      assert.deepEqual(counts[0], {
        categorias: 5,
        colecciones: 4,
        publicaciones: 4,
      });
      const [constraints] = await connection.query(
        'SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME',
        [database],
      );
      results.sql = { tables, counts, constraints };
    } finally {
      await connection.end();
    }
    run(
      'cli-migration-show',
      process.execPath,
      [
        'node_modules/typeorm/cli.js',
        'migration:show',
        '-d',
        'dist/persistencia/data-source.cli.js',
      ],
      config,
    );
    const contrato = await startApi(config, 'mysql', 'api-contrato-1');
    const hybrid = await startApi(config, 'mysql', 'api-mysql-real');
    try {
      const a = await (
        await fetch(`http://127.0.0.1:${contrato.port}/api-json`)
      ).json();
      const b = await (
        await fetch(`http://127.0.0.1:${hybrid.port}/api-json`)
      ).json();
      assert.deepEqual(b, a);
      results.openapi = { equal: true, paths: Object.keys(a.paths).length };
    } finally {
      await stopApi(contrato.child);
      await stopApi(hybrid.child);
    }
    own();
    run('detener-para-prueba-fallo', 'docker', ['stop', name]);
    started = false;
    const bad = cp.spawnSync(process.execPath, ['dist/main.js'], {
      cwd: repo,
      env: { ...config, PORT: String(await freePort()) },
      encoding: 'utf8',
      timeout: 15000,
      windowsHide: true,
    });
    fs.writeFileSync(
      path.join(root, 'sin-fallback.log'),
      sanitize((bad.stdout || '') + (bad.stderr || '')),
    );
    assert.equal(bad.status, 1);
    assert((bad.stdout + bad.stderr).includes('No se pudo inicializar MySQL'));
    results.noSilentFallback = true;
    results.status = 'PASS';
  } catch (error) {
    results.status = 'FAIL';
    results.error = sanitize(error.message);
    console.error(results.error);
    process.exitCode = 1;
  } finally {
    for (const child of processes) await stopApi(child);
    if (started) {
      own();
      run('detener-mysql-propio', 'docker', ['stop', name]);
    }
    results.cleanup = results.checks.some(
      (check) => check.label === 'crear-mysql' && check.exit === 0,
    )
      ? 'Contenedor propio detenido, volumen conservado; no se toco ninguna base previa.'
      : 'No se creo contenedor MySQL; no se toco ninguna base previa.';
    fs.writeFileSync(
      path.join(root, 'resultado.json'),
      JSON.stringify(results, null, 2),
    );
    console.log(
      JSON.stringify({
        status: results.status,
        container: name,
        database,
        mysqlVersion: results.mysqlVersion,
        noSilentFallback: results.noSilentFallback,
        evidenceDirectory: root,
      }),
    );
  }
})();
