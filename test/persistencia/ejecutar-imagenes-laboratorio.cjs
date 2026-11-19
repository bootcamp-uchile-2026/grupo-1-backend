/** Solo crea recursos nuevos y exclusivos; nunca usa una DB del entorno del usuario. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const net = require('node:net');
const assert = require('node:assert/strict');

const repo = path.resolve(__dirname, '../..');
const id = crypto.randomBytes(6).toString('hex');
const name = 'stylenow-pr0-lab-' + id;
const volume = name + '-data';
const database = 'stylenow_pr0_' + id + '_test';
const username = 'lab_' + id;
const password = crypto.randomBytes(24).toString('hex');
const rootPassword = crypto.randomBytes(24).toString('hex');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const cuentaPersistente = { nombre: 'Persistencia P2', correoElectronico: 'persistencia.p2@example.invalid', contrasena: crypto.randomBytes(12).toString('hex') };
const root = process.env.EVIDENCIA_PILOTO_DIR
  ? path.resolve(process.env.EVIDENCIA_PILOTO_DIR)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-pr0-evidencia-'));
assert(root !== repo && !root.startsWith(repo + path.sep), 'Evidencias fuera del repositorio fuente');
fs.mkdirSync(root, { recursive: true });
const privateDir = process.env.PRIVADO_PILOTO_DIR
  ? path.resolve(process.env.PRIVADO_PILOTO_DIR)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'stylenow-pr0-privado-'));
assert(privateDir !== repo && !privateDir.startsWith(repo + path.sep), 'Credenciales fuera del repositorio fuente');
fs.mkdirSync(privateDir, { recursive: true });
const sanitize = value => String(value).replaceAll(password, '[REDACTED]').replaceAll(rootPassword, '[REDACTED]').replaceAll(jwtSecret, '[REDACTED]').replaceAll(cuentaPersistente.contrasena, '[REDACTED]');
const results = { id, container: name, volume, database, mode: 'P5: imagenes reales persistentes en volumen y galeria MySQL', checks: [] };
let started = false;
let tokenProceso1;
const processes = new Set();

function run(label, bin, args, env = process.env) {
  const start = new Date().toISOString();
  const r = cp.spawnSync(bin, args, { cwd: repo, env, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, windowsHide: true });
  fs.writeFileSync(path.join(root, label + '.log'), sanitize((r.stdout || '') + (r.stderr || '')));
  results.checks.push({ label, start, end: new Date().toISOString(), exit: r.status });
  if (r.status !== 0) throw new Error(label + ' fallo; consultar log sanitizado.');
  console.log(label + ': PASS');
  return r.stdout.trim();
}
function own() {
  const labels = JSON.parse(run('verificar-propiedad-' + results.checks.length, 'docker', ['inspect', '--format', '{{json .Config.Labels}}', name]));
  assert.equal(labels['stylenow.pr0.id'], id);
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function ready(config) {
  const mysql = require('mysql2/promise');
  let lastCode;
  for (let i = 0; i < 100; i++) {
    let connection;
    try {
      connection = await mysql.createConnection({ host: '127.0.0.1', port: Number(config.DB_PORT), user: username, password, database, connectTimeout: 1000 });
      const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS principal');
      assert.match(rows[0].version, /^8\.4\./);
      assert.equal(rows[0].db, database);
      assert(rows[0].principal.startsWith(username + '@'));
      results.mysqlVersion = rows[0].version;
      return;
    } catch (error) { lastCode = error.code; await pause(600); }
    finally { if (connection) await connection.end(); }
  }
  throw new Error('MySQL exclusivo no alcanzo disponibilidad: ' + String(lastCode));
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function startApi(config, mode, label) {
  const port = await freePort();
  const child = cp.spawn(process.execPath, ['dist/main.js'], {
    cwd: repo, env: { ...config, PERSISTENCIA: mode, PORT: String(port), APP_NAME: 'StyleNow P2 QA', APP_VERSION: '0.0.1', SWAGGER_PATH: 'api' }, windowsHide: true,
  });
  processes.add(child); let output = '';
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  child.on('close', () => { fs.writeFileSync(path.join(root, label + '.log'), sanitize(output)); processes.delete(child); });
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error('API no arranco: ' + label);
    try { if ((await fetch(`http://127.0.0.1:${port}/categorias`)).status === 200) return { child, port }; } catch {}
    await pause(200);
  }
  throw new Error('API no disponible: ' + label);
}
async function stopApi(child) {
  if (child.exitCode !== null) return;
  const closed = new Promise(resolve => child.once('close', resolve)); child.kill(); await closed;
}
async function persistentHttp(config, label) {
  const api = await startApi(config, 'mysql', label);
  try {
    const checks = [];
    for (const url of ['/categorias', '/colecciones', '/posts']) {
      const res = await fetch(`http://127.0.0.1:${api.port}${url}`);
      assert.equal(res.status, 200);
      const rows = await res.json(); assert(rows.some(r => r.id === 9001));
      checks.push({ url, status: res.status, sentinel9001: true, rows: rows.length });
    }
    const product = await fetch(`http://127.0.0.1:${api.port}/productos/9001`);
    assert.equal(product.status, 200);
    const detail = await product.json();
    assert.equal(detail.nombre, 'Persistencia producto P1');
    assert.deepEqual(detail.imagenes, ['https://example.invalid/persistente']);
    assert.deepEqual(detail.variantes, [{ id: 9001, color: 'Persistente', talla: 'SQL', stock: 7 }]);
    results.checks.push({ label: label + '-producto', exit: 0, producto: 9001, variante: 9001, imagenPersistida: true });
    const base = `http://127.0.0.1:${api.port}`;
    const json = { 'Content-Type': 'application/json' };
    if (!results.usuarioPersistente) {
      const reg = await fetch(base + '/auth/registro', { method: 'POST', headers: json, body: JSON.stringify(cuentaPersistente) });
      assert.equal(reg.status, 201); results.usuarioPersistente = (await reg.json()).id;
    }
    const login = await fetch(base + '/auth/login', { method: 'POST', headers: json, body: JSON.stringify({ correoElectronico: cuentaPersistente.correoElectronico, contrasena: cuentaPersistente.contrasena }) });
    assert.equal(login.status, 200);
    const sesion = await login.json(); const auth = { ...json, Authorization: 'Bearer ' + sesion.accessToken };
    const uid = results.usuarioPersistente;
    if (!results.direccionPersistente) {
      const dir = await fetch(`${base}/usuarios/${uid}/direcciones`, { method: 'POST', headers: auth, body: JSON.stringify({ nombre: 'Persistente', calle: 'SQL', numero: '1', comuna: 'P2', region: 'Lab', principal: true }) });
      assert.equal(dir.status, 201); results.direccionPersistente = (await dir.json()).id;
      tokenProceso1 = sesion.accessToken;
    }
    const dirs = await fetch(`${base}/usuarios/${uid}/direcciones`, { headers: auth }); assert.equal(dirs.status, 200);
    assert((await dirs.json()).some(d => d.id === results.direccionPersistente));
    // Token emitido por el primer proceso sigue valido (mismo JWT_SECRET), sin fallback de identidad.
    assert.equal((await fetch(`${base}/usuarios/${uid}`, { headers: { Authorization: 'Bearer ' + tokenProceso1 } })).status, 200);
    assert.equal((await fetch(`${base}/usuarios/${uid}`)).status, 401);
    assert.equal((await fetch(`${base}/usuarios/1`, { headers: auth })).status, 404);
    results.checks.push({ label: label + '-identidad', exit: 0, usuario: uid, direccion: results.direccionPersistente, loginTrasReinicio: true });
    if(!results.pedidoP3){
      const add = await fetch(base+'/usuarios/'+uid+'/carrito/items',{method:'POST',headers:auth,body:JSON.stringify({varianteId:101,cantidad:1})});assert.equal(add.status,201);const cart=await add.json();
      const fav=await fetch(base+'/usuarios/'+uid+'/favoritos',{method:'POST',headers:auth,body:JSON.stringify({productoId:1})});assert.equal(fav.status,201);
      const order=await fetch(base+'/pedidos',{method:'POST',headers:{...auth,'Idempotency-Key':'durable'},body:JSON.stringify({carritoId:cart.id,contacto:{nombre:'Lab',email:'lab@example.invalid',telefono:'000'},direccion:{calle:'Lab',numero:'1',comuna:'Lab',region:'Lab'},metodoPago:'webpay'})});assert.equal(order.status,201);results.pedidoP3=(await order.json()).id;
      const pending=await fetch(base+'/usuarios/'+uid+'/carrito/items',{method:'POST',headers:auth,body:JSON.stringify({varianteId:102,cantidad:1})});assert.equal(pending.status,201);
    }
    const saved=await fetch(base+'/usuarios/'+uid+'/pedidos/'+results.pedidoP3,{headers:auth});assert.equal(saved.status,200);assert.equal((await saved.json()).items[0].precioUnitario,39990);
    const favorites=await fetch(base+'/usuarios/'+uid+'/favoritos',{headers:auth});assert.equal(favorites.status,200);assert((await favorites.json()).some(p=>p.id===1));
    const cartSaved=await fetch(base+'/usuarios/'+uid+'/carrito',{headers:auth});assert.equal(cartSaved.status,200);assert((await cartSaved.json()).items.some(i=>i.varianteId===102));
    results.checks.push({label:label+'-comercio',exit:0,pedido:results.pedidoP3,carrito:true,favoritos:true});
    if(!results.lookP4){
      const look=await fetch(base+'/looks',{method:'POST',headers:auth,body:JSON.stringify({nombre:'Persistencia P4',productos:[{productoId:1,varianteId:101}]})});assert.equal(look.status,201);results.lookP4=(await look.json()).id;
      const alert=await fetch(base+'/usuarios/'+uid+'/alertas/precio',{method:'POST',headers:auth,body:JSON.stringify({productoId:1,precioObjetivo:100})});assert.equal(alert.status,201);results.alertaP4=(await alert.json()).id;
      const orderDetails=await(await fetch(base+'/usuarios/'+uid+'/pedidos/'+results.pedidoP3,{headers:auth})).json();
      const solicitud=await fetch(base+'/usuarios/'+uid+'/pedidos/'+results.pedidoP3+'/cambios-devoluciones',{method:'POST',headers:{...auth,'Idempotency-Key':'postventa-persistente'},body:JSON.stringify({pedidoItemId:orderDetails.items[0].id,tipo:'devolucion',motivo:'Lab',metodoEntrega:'simulado'})});assert.equal(solicitud.status,201);results.solicitudP4=(await solicitud.json()).id;
      const cancel=await fetch(base+'/usuarios/'+uid+'/pedidos/'+results.pedidoP3+'/cancelacion',{method:'POST',headers:auth,body:JSON.stringify({motivo:'Persistencia'})});assert.equal(cancel.status,201);
    }
    assert.equal((await fetch(base+'/looks/'+results.lookP4)).status,200);
    const alerts=await(await fetch(base+'/usuarios/'+uid+'/alertas',{headers:auth})).json();assert(alerts.some(a=>a.id===results.alertaP4));
    const events=await fetch(base+'/usuarios/'+uid+'/cambios-devoluciones/'+results.solicitudP4+'/eventos',{headers:auth});assert.equal(events.status,200);assert.equal((await events.json()).length,1);
    const tracking=await fetch(base+'/usuarios/'+uid+'/pedidos/'+results.pedidoP3+'/seguimiento',{headers:auth});assert.equal(tracking.status,200);assert.equal((await tracking.json()).estado,'CANCELLED');
    results.checks.push({label:label+'-p4',exit:0,look:results.lookP4,alerta:results.alertaP4,postventa:results.solicitudP4,cancelacion:true});
    if(!results.imagenP5){
      const permissionConnection=await require('mysql2/promise').createConnection({host:config.DB_HOST,port:Number(config.DB_PORT),user:username,password,database});
      try{await permissionConnection.query('INSERT INTO permiso_usuario(usuario_id,permiso) VALUES (?,?)',[uid,'productos.imagenes.gestionar']);}finally{await permissionConnection.end();}
      const bytes=await require('sharp')({create:{width:4,height:4,channels:3,background:'green'}}).png().toBuffer();
      const form=new FormData();form.append('imagen',new Blob([bytes]),'imagen.png');
      const upload=await fetch(base+'/administracion/productos/1/imagenes',{method:'POST',headers:{Authorization:'Bearer '+sesion.accessToken},body:form});assert.equal(upload.status,201);results.imagenP5=(await upload.json()).url;
      const published=await fetch(base+results.imagenP5);assert.equal(published.status,200);results.imagenP5Sha256=crypto.createHash('sha256').update(Buffer.from(await published.arrayBuffer())).digest('hex');
    }
    const published=await fetch(base+results.imagenP5);assert.equal(published.status,200);assert.equal(crypto.createHash('sha256').update(Buffer.from(await published.arrayBuffer())).digest('hex'),results.imagenP5Sha256);
    const catalog=await(await fetch(base+'/productos/1')).json();assert(catalog.imagenes.includes(results.imagenP5));
    results.checks.push({label:label+'-imagen',exit:0,url:results.imagenP5,sha256:results.imagenP5Sha256});
    const products = await fetch(`http://127.0.0.1:${api.port}/productos`); assert.equal(products.status, 200);
    const swagger = await fetch(`http://127.0.0.1:${api.port}/api`); assert.equal(swagger.status, 200);
    results.checks.push({ label, exit: 0, checks, productos: products.status, api: swagger.status });
  } finally { await stopApi(api.child); }
}

async function probarDocker(config){
  const image='stylenow-p5-'+id,network='stylenow-p5-red-'+id,filesVolume='stylenow-p5-imagenes-'+id;
  const containers=[];
  run('docker-compose-valido','docker',['compose','config','--quiet']);
  run('docker-build','docker',['build','--tag',image,'.']);
  run('docker-red','docker',['network','create','--label','stylenow.p5.id='+id,network]);
  own();run('docker-mysql-red','docker',['network','connect',network,name]);
  run('docker-volumen-imagenes','docker',['volume','create','--label','stylenow.p5.id='+id,filesVolume]);
  const envFile=path.join(privateDir,'backend-'+id+'.env');
  fs.writeFileSync(envFile,`PERSISTENCIA=mysql\nDB_HOST=${name}\nDB_PORT=3306\nDB_USERNAME=${username}\nDB_PASSWORD=${password}\nDB_DATABASE=${database}\nJWT_SECRET=${jwtSecret}\nIMAGENES_DIRECTORIO=/app/uploads/productos\nPORT=3000\n`,{mode:0o600});
  let imageUrl,sha;
  try{
    for(let n=1;n<=2;n++){
      const port=await freePort(),container='stylenow-p5-backend-'+id+'-'+n;
      run('docker-backend-'+n,'docker',['run','-d','--name',container,'--label','stylenow.p5.id='+id,'--network',network,'--env-file',envFile,'--publish','127.0.0.1:'+port+':3000','--mount','type=volume,source='+filesVolume+',target=/app/uploads',image]);
      containers.push(container);const base='http://127.0.0.1:'+port;
      let available=false;
      for(let attempt=0;attempt<80;attempt++){try{if((await fetch(base+'/productos/1')).status===200){available=true;break;}}catch{}await pause(250);}
      assert(available,'Backend Docker no disponible');
      if(n===1){
        const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correoElectronico:cuentaPersistente.correoElectronico,contrasena:cuentaPersistente.contrasena})});assert.equal(login.status,200);const token=(await login.json()).accessToken;
        const bytes=await require('sharp')({create:{width:4,height:4,channels:3,background:'blue'}}).webp().toBuffer();
        const form=new FormData();form.append('imagen',new Blob([bytes]),'docker.webp');
        const upload=await fetch(base+'/administracion/productos/1/imagenes',{method:'POST',headers:{Authorization:'Bearer '+token},body:form});assert.equal(upload.status,201);imageUrl=(await upload.json()).url;
        const res=await fetch(base+imageUrl);assert.equal(res.status,200);sha=crypto.createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
      }
      const res=await fetch(base+imageUrl);assert.equal(res.status,200);assert.equal(crypto.createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex'),sha);
      assert((await(await fetch(base+'/productos/1')).json()).imagenes.includes(imageUrl));
      const labels=JSON.parse(run('docker-backend-propiedad-'+n,'docker',['inspect','--format','{{json .Config.Labels}}',container]));assert.equal(labels['stylenow.p5.id'],id);
      run('docker-backend-stop-'+n,'docker',['stop',container]);
    }
    results.dockerImagenes={image,network,volume:filesVolume,url:imageUrl,sha256:sha,recreacionBackend:true,usuarioNoRoot:true};
  }finally{
    for(const container of containers){const inspect=cp.spawnSync('docker',['inspect','--format','{{json .Config.Labels}}',container],{encoding:'utf8',windowsHide:true});if(inspect.status===0&&JSON.parse(inspect.stdout)['stylenow.p5.id']===id)cp.spawnSync('docker',['stop',container],{windowsHide:true,encoding:'utf8'});}
  }
}

(async () => {
  try {
    if (process.env.DOCKER_HOST && !/^(unix|npipe):/.test(process.env.DOCKER_HOST)) {
      throw new Error('El harness solo admite Docker local, no DOCKER_HOST remoto.');
    }
    const dockerHost = run('docker-local', 'docker', ['context', 'inspect', '--format', '{{(index .Endpoints "docker").Host}}']);
    assert.match(dockerHost, /^(unix|npipe):/, 'Contexto Docker local requerido');
    for (const args of [['container', 'inspect', name], ['volume', 'inspect', volume]]) {
      const r = cp.spawnSync('docker', args, { encoding: 'utf8', windowsHide: true });
      assert.notEqual(r.status, 0, 'No reutilizar recurso existente');
    }
    run('build', process.execPath, ['node_modules/@nestjs/cli/bin/nest.js', 'build']);
    run('mysql-image', 'docker', ['pull', 'mysql:8.4']);
    run('crear-volumen', 'docker', ['volume', 'create', '--label', 'stylenow.pr0.id=' + id, volume]);
    const envFile = path.join(privateDir, 'mysql-' + id + '.env');
    fs.writeFileSync(envFile, `MYSQL_DATABASE=${database}\nMYSQL_USER=${username}\nMYSQL_PASSWORD=${password}\nMYSQL_ROOT_PASSWORD=${rootPassword}\n`, { mode: 0o600 });
    const stableDbPort = await freePort();
    run('crear-mysql', 'docker', ['run', '-d', '--name', name, '--label', 'stylenow.pr0.id=' + id, '--env-file', envFile,
      '--publish', `127.0.0.1:${stableDbPort}:3306`, '--mount', `type=volume,source=${volume},target=/var/lib/mysql`, 'mysql:8.4']);
    started = true; own();
    const bindings = JSON.parse(run('puerto-mysql', 'docker', ['inspect', '--format', '{{json .NetworkSettings.Ports}}', name]));
    const port = bindings['3306/tcp'][0].HostPort;
    const config = { ...process.env, PERSISTENCIA: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: port, DB_USERNAME: username, DB_PASSWORD: password, DB_DATABASE: database,
      MYSQL_LAB_DATABASE: database, MYSQL_LAB_GUARD: 'exclusive-disposable-pr0', STYLENOW_SQL_TEST: '1', JWT_SECRET: jwtSecret, IMAGENES_DIRECTORIO: path.join(root,'imagenes-host'), LOGISTICA_OPERADORES_IDS: '' };
    fs.writeFileSync(path.join(privateDir, 'conexion-' + id + '.json'), JSON.stringify({ DB_HOST: config.DB_HOST, DB_PORT: port, DB_USERNAME: username, DB_PASSWORD: password, DB_DATABASE: database }), { mode: 0o600 });
    results.host = '127.0.0.1'; results.port = port;
    await ready(config);
    run('p5-sql-e2e', process.execPath, ['node_modules/jest/bin/jest.js','--config','test/jest-e2e.json','--runInBand','--testTimeout=60000','--testPathPatterns','imagenes.mysql'], config);
    run('h2-e2e-hibrido', process.execPath, ['node_modules/jest/bin/jest.js','--config','test/jest-e2e.json','--runInBand','--testTimeout=60000','--testPathIgnorePatterns','(piloto|productos|identidad|comercio|p4|imagenes).mysql'], {...config,STYLENOW_SQL_TEST:'0',STYLENOW_REINICIO_SQL_POR_PRUEBA:'1'});
    const seedConnection = await require('mysql2/promise').createConnection({ host: config.DB_HOST, port: Number(port), user: username, password, database });
    try {
      await seedConnection.query("INSERT INTO categoria SELECT 9001,'Persistencia','persistencia','https://example.invalid',0,99");
      await seedConnection.query("INSERT INTO coleccion VALUES(9001,'Persistencia','Lab','https://example.invalid')");
      await seedConnection.query("INSERT INTO post VALUES(9001,'Persistencia','Lab','https://example.invalid')");
      await seedConnection.query("INSERT INTO producto (id,categoria_id,nombre,precio,imagen_url,novedad,oferta,descripcion,calificacion,guia_tallas) SELECT 9001,categoria_id,'Persistencia producto P1',precio,imagen_url,novedad,oferta,descripcion,calificacion,guia_tallas FROM producto WHERE id=1");
      await seedConnection.query("INSERT INTO variante (id,producto_id,posicion,color,talla,stock) VALUES (9001,9001,0,'Persistente','SQL',7)");
      await seedConnection.query("INSERT INTO producto_imagen VALUES (9001,0,'https://example.invalid/persistente')");
    } finally { await seedConnection.end(); }
    await persistentHttp(config, 'api-proceso-1');
    await persistentHttp(config, 'api-proceso-2');
    own(); run('reiniciar-mysql', 'docker', ['restart', name]); await ready(config);
    await persistentHttp(config, 'api-tras-reinicio-mysql');
    const mysql = require('mysql2/promise'); const connection = await mysql.createConnection({ host: config.DB_HOST, port: Number(port), user: username, password, database });
    try {
      const [tables] = await connection.query('SHOW TABLES');
      assert.deepEqual(tables.map(r => Object.values(r)[0]).sort(), ['alerta','carga_imagen','carrito','carrito_item','categoria','coleccion','credencial','direccion','envio','envio_evento','favorito','inventario_pedido','look_conjunto','look_guardado','look_ocurrencia','migrations','pedido','pedido_cancelacion','pedido_item','permiso_usuario','post','postventa_evento','postventa_idempotencia','producto','producto_color','producto_imagen','producto_talla','solicitud_postventa','usuario','variante']);
      const [counts] = await connection.query('SELECT (SELECT COUNT(*) FROM categoria) AS categorias, (SELECT COUNT(*) FROM coleccion) AS colecciones, (SELECT COUNT(*) FROM post) AS publicaciones');
      assert.deepEqual(counts[0], { categorias: 5, colecciones: 4, publicaciones: 4 });
      const [[sinTextoPlano]] = await connection.query('SELECT COUNT(*) AS n FROM credencial WHERE hash_contrasena NOT LIKE ?', ['scrypt$%']);
      assert.equal(Number(sinTextoPlano.n), 0);
      const [constraints] = await connection.query('SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME', [database]);
      results.sql = { tables, counts, constraints };
    } finally { await connection.end(); }
    run('cli-migration-show', process.execPath, ['node_modules/typeorm/cli.js', 'migration:show', '-d', 'dist/persistencia/data-source.cli.js'], config);
    const dummy = await startApi(config, 'dummy', 'api-dummy-real');
    const hybrid = await startApi(config, 'mysql', 'api-mysql-real');
    try {
      const a = await (await fetch(`http://127.0.0.1:${dummy.port}/api-json`)).json();
      const b = await (await fetch(`http://127.0.0.1:${hybrid.port}/api-json`)).json();
      assert.deepEqual(b, a); results.openapi = { equal: true, paths: Object.keys(a.paths).length };
    } finally { await stopApi(dummy.child); await stopApi(hybrid.child); }
    await probarDocker(config);
    own(); run('detener-para-prueba-fallo', 'docker', ['stop', name]); started = false;
    const bad = cp.spawnSync(process.execPath, ['dist/main.js'], { cwd: repo, env: { ...config, PORT: String(await freePort()) }, encoding: 'utf8', timeout: 15000, windowsHide: true });
    fs.writeFileSync(path.join(root, 'sin-fallback.log'), sanitize((bad.stdout || '') + (bad.stderr || '')));
    assert.equal(bad.status, 1); assert((bad.stdout + bad.stderr).includes('No se pudo inicializar MySQL'));
    results.noSilentFallback = true; results.status = 'PASS';
  } catch (error) { results.status = 'FAIL'; results.error = sanitize(error.message); console.error(results.error); process.exitCode = 1; }
  finally {
    for (const child of processes) await stopApi(child);
    if (started) { own(); run('detener-mysql-propio', 'docker', ['stop', name]); }
    results.cleanup = results.checks.some(check => check.label === 'crear-mysql' && check.exit === 0)
      ? 'Contenedor propio detenido, volumen conservado; no se toco ninguna base previa.'
      : 'No se creo contenedor MySQL; no se toco ninguna base previa.';
    fs.writeFileSync(path.join(root, 'resultado.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ status: results.status, container: name, database, mysqlVersion: results.mysqlVersion, noSilentFallback: results.noSilentFallback, evidenceDirectory: root }));
  }
})();
