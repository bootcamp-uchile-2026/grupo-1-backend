const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  cp = require('node:child_process'),
  crypto = require('node:crypto'),
  net = require('node:net'),
  assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '../..'),
  root = path.resolve(process.argv[2] || '');
const config = { ...process.env },
  id = /^stylenow_pr0_([a-f0-9]{12})_test$/.exec(config.DB_DATABASE || '')?.[1];
assert(
  id &&
    config.DB_DATABASE === config.MYSQL_LAB_DATABASE &&
    config.MYSQL_LAB_GUARD === 'exclusive-disposable-pr0' &&
    config.DB_HOST === '127.0.0.1',
  'Arranque requiere laboratorio protegido',
);
assert(
  root !== repo && !root.startsWith(repo + path.sep),
  'Evidencia fuera del repositorio',
);
const labels = JSON.parse(
  cp.execFileSync(
    'docker',
    [
      'inspect',
      '--format',
      '{{json .Config.Labels}}',
      'stylenow-pr0-lab-' + id,
    ],
    { encoding: 'utf8', windowsHide: true },
  ),
);
assert.equal(labels['stylenow.pr0.id'], id);
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-arranque-'));
const results = { status: 'RUNNING', cases: [], schemaUntouched: false };
const secrets = [config.DB_PASSWORD, config.JWT_SECRET];
const scrub = (s) => {
  let text = String(s);
  for (const secret of secrets.filter((v) => typeof v === 'string' && v.trim()))
    text = text.replaceAll(secret, '[REDACTED]');
  return text.replace(
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    '[REDACTED_JWT]',
  );
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = async () => {
  const s = net.createServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const port = s.address().port;
  await new Promise((r) => s.close(r));
  return port;
};
async function check(label, modify, expectedField, success = false) {
  const port = await freePort(),
    env = {
      ...config,
      PORT: String(port),
      IMAGENES_DIRECTORIO: path.join(cwd, 'imagenes'),
    };
  delete env.PERSISTENCIA;
  modify(env);
  if (env.DB_PASSWORD) secrets.push(env.DB_PASSWORD);
  if (env.JWT_SECRET) secrets.push(env.JWT_SECRET);
  const child = cp.spawn(process.execPath, [path.join(repo, 'dist/main.js')], {
    cwd,
    env,
    windowsHide: true,
  });
  let output = '',
    closed = false,
    exit = null,
    listened = false,
    ready = false;
  child.stdout.on('data', (b) => (output += b));
  child.stderr.on('data', (b) => (output += b));
  const done = new Promise((resolve) =>
    child.on('close', (code) => {
      closed = true;
      exit = code;
      resolve();
    }),
  );
  try {
    const deadline = Date.now() + 15000;
    while (!closed && Date.now() < deadline) {
      try {
        const r = await fetch('http://127.0.0.1:' + port + '/api-json', {
          signal: AbortSignal.timeout(200),
        });
        listened = true;
        if (r.status === 200) ready = true;
      } catch {}
      if (ready || (!success && listened)) break;
      await pause(100);
    }
    if (success) {
      assert(ready, label + ': no inicio');
    } else {
      assert(closed, label + ': no termino fail-fast');
      assert.equal(exit, 1, label + ': salida inesperada');
      assert(
        !listened &&
          !output.includes('Backend escuchando') &&
          !output.includes('Nest application successfully started'),
        label + ': escucho HTTP',
      );
      assert(
        output.includes(expectedField),
        label + ': error distinto de la causa esperada',
      );
    }
    for (const secret of secrets.filter(
      (v) => typeof v === 'string' && v.trim(),
    ))
      assert(!output.includes(secret), label + ': dato sensible en log');
    results.cases.push({
      label,
      status: 'PASS',
      listened,
      exit: success ? 'detenido_por_prueba' : exit,
      expectedField: expectedField || null,
    });
  } finally {
    if (!closed) child.kill();
    await done;
    fs.writeFileSync(
      path.join(root, 'arranque-' + label + '.log'),
      scrub(output),
    );
  }
}
(async () => {
  const mysql = require('mysql2/promise'),
    conn = await mysql.createConnection({
      host: config.DB_HOST,
      port: Number(config.DB_PORT),
      user: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      database: config.DB_DATABASE,
    });
  try {
    const [before] = await conn.query('SHOW TABLES');
    assert.equal(before.length, 0, 'Fail-fast debe probarse antes de migrar');
    await check('correcto_sin_selector', () => {}, null, true);
    await check(
      'correcto_mysql_legado',
      (env) => {
        env.PERSISTENCIA = 'mysql';
      },
      null,
      true,
    );
    for (const key of [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
    ])
      await check(
        'ausente_' + key,
        (env) => {
          delete env[key];
        },
        key,
      );
    await check(
      'jwt_ausente',
      (env) => {
        delete env.JWT_SECRET;
      },
      'JWT_SECRET',
    );
    await check(
      'jwt_corto',
      (env) => {
        env.JWT_SECRET = crypto.randomBytes(6).toString('hex');
      },
      'JWT_SECRET',
    );
    await check(
      'jwt_espacios',
      (env) => {
        env.JWT_SECRET = ' '.repeat(32);
      },
      'JWT_SECRET',
    );
    for (const value of ['dummy', 'memory', '', 'MYSQL'])
      await check(
        'persistencia_' + (value || 'vacia'),
        (env) => {
          env.PERSISTENCIA = value;
        },
        'PERSISTENCIA',
      );
    await check(
      'puerto_invalido',
      (env) => {
        env.DB_PORT = 'abc';
      },
      'DB_PORT',
    );
    await check(
      'host_invalido',
      (env) => {
        env.DB_HOST = 'mysql://NO-PUBLICAR-SQL03@host';
      },
      'DB_HOST',
    );
    await check(
      'base_invalida',
      (env) => {
        env.DB_DATABASE = 'base/con/ruta';
      },
      'DB_DATABASE',
    );
    await check(
      'credenciales_incorrectas',
      (env) => {
        env.DB_PASSWORD = crypto.randomBytes(24).toString('hex');
      },
      'No se pudo inicializar MySQL',
    );
    const unavailable = await freePort();
    await check(
      'mysql_inaccesible',
      (env) => {
        env.DB_PORT = String(unavailable);
      },
      'No se pudo inicializar MySQL',
    );
    const [after] = await conn.query('SHOW TABLES');
    assert.deepEqual(after, before);
    results.schemaUntouched = true;
    results.status = 'PASS';
  } finally {
    await conn.end();
  }
})()
  .catch((error) => {
    results.status = 'FAIL';
    results.error = scrub(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.writeFileSync(
      path.join(root, 'arranque-fail-fast.json'),
      JSON.stringify(results, null, 2) + '\n',
    );
    console.log(
      'Fail-fast: ' + results.status + '; casos=' + results.cases.length,
    );
  });
