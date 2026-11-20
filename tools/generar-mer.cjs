(async function generarMer() {
  const fs = require('node:fs');
  const path = require('node:path');
  require('ts-node').register({ transpileOnly: true });
  const {
    ESQUEMA_ESPERADO,
    MIGRACIONES_ESPERADAS,
  } = require('../test/utilidades/esquema-esperado.ts');
  const root = path.resolve(__dirname, '..');
  const tables = Object.entries(ESQUEMA_ESPERADO);
  const fkCount = tables.reduce((n, [, t]) => n + t.foraneas.length, 0);
  const diagram = ['erDiagram'];
  for (const [name, t] of tables) {
    diagram.push('  ' + name + ' {');
    for (const c of t.columnas) {
      const flags = [];
      if (t.clavePrimaria.includes(c.nombre)) flags.push('PK');
      if (t.foraneas.some((f) => f.columnas.includes(c.nombre)))
        flags.push('FK');
      if (
        t.indices.some(
          (i) =>
            i.unico && i.columnas.length === 1 && i.columnas[0] === c.nombre,
        )
      )
        flags.push('UK');
      diagram.push(
        '    ' +
          c.tipo.split('(')[0].replaceAll(' ', '_') +
          ' ' +
          c.nombre +
          (flags.length ? ' ' + flags.join(', ') : '') +
          ' "' +
          c.tipo +
          (c.nulo ? ' NULL' : ' NOT NULL') +
          '"',
      );
    }
    diagram.push('  }');
  }
  for (const [name, t] of tables)
    for (const f of t.foraneas) {
      const optional = f.columnas.some(
        (col) => t.columnas.find((c) => c.nombre === col).nulo,
      );
      const unique =
        (t.clavePrimaria.length &&
          t.clavePrimaria.every((c) => f.columnas.includes(c))) ||
        t.indices.some(
          (i) => i.unico && i.columnas.every((c) => f.columnas.includes(c)),
        );
      diagram.push(
        '  ' +
          f.tablaReferida +
          ' ' +
          (optional ? '|o' : '||') +
          '--' +
          (unique ? 'o|' : 'o{') +
          ' ' +
          name +
          ' : "' +
          (f.nombre || 'FK') +
          ' (' +
          f.columnas.join(', ') +
          ')"',
      );
    }
  const lines = [
    '# MER físico H3 vigente — implementado',
    '',
    'Generado con node tools/generar-mer.cjs desde test/utilidades/esquema-esperado.ts.',
    'El contrato se contrasta con migraciones, metadatos TypeORM e INFORMATION_SCHEMA de MySQL 8.4.13 mediante las suites de esquema. Generar este documento no abre conexiones.',
    '',
    '**' +
      tables.length +
      ' tablas de dominio, ' +
      fkCount +
      ' claves foráneas y ' +
      MIGRACIONES_ESPERADAS.length +
      ' migraciones.** migrations es una tabla técnica adicional. Todas las FK vigentes son RESTRICT/RESTRICT.',
    '',
    'No se afirma normalización completa. Tipos exactos, nulabilidad, PK, índices y CHECK se describen en [el contrato JSON](mer-fisico-h3.schema.json). Algunas restricciones se declaran solo en migraciones, no como relaciones navegables TypeORM. Las pruebas explicitan esa distinción; migration:generate no debe eliminarlas.',
    '',
    '## Diagrama físico',
    '',
    'Cardinalidades SQL: cero hijos es posible aunque los servicios exijan líneas al crear pedidos/looks. FK nullable permite cero o un padre; PK/UNIQUE limitan el máximo a un hijo. Se incluyen todas las FK simples y compuestas, sin relaciones artificiales.',
    '',
    '```mermaid',
    ...diagram,
    '```',
    '',
    '## Correspondencia con migraciones',
    '',
    '| Tabla | PK | Migración indicada en contrato | FK | CHECK |',
    '|---|---|---|---:|---:|',
    ...tables.map(
      ([name, t]) =>
        '| ' +
        name +
        ' | ' +
        t.clavePrimaria.join(', ') +
        ' | ' +
        t.migracion +
        ' | ' +
        t.foraneas.length +
        ' | ' +
        t.totalChecks +
        ' |',
    ),
    '',
    'La secuencia completa de migraciones y semillas, incluida M-P7-01, está en el JSON. La migración indicada por tabla no sustituye ese historial. Ninguna migración o semilla se edita al generar el documento.',
    '',
    '## Correcciones docentes implementadas',
    '',
    '- MD-01: galería por producto con PK producto_id/posicion.',
    '- MD-03: producto.categoria_id referencia categoria.id, no el slug.',
    '- MD-06: PK compuestas en carrito_item y look_ocurrencia.',
    '- MD-10: DATETIME(3) en SQL; representación ISO date-time en HTTP.',
    '- MD-12: creador_usuario_id nullable en looks; NULL corresponde al contenido editorial histórico. Sin trazabilidad administrativa H4.',
    '- MD-05 parcial: look_ocurrencia no repite producto_id; pedido_item y alerta conservan redundancias protegidas por FK compuestas. Integridad no equivale a 3FN.',
    '',
    '## Decisiones vigentes y observaciones pendientes',
    '',
    '- MD-04: imagen_url es portada; producto_imagen es galería ordenada independiente. No existe obligación de igualarla a posición cero. Categoría, colección y post tienen una URL cada uno.',
    '- MD-02: producto_color y producto_talla siguen como listas ordenadas. Derivarlas requiere decisión y migración futura.',
    '- MD-07: subtotal y total del pedido se calculan; look_conjunto.precio_total aún se almacena. No se redefine como snapshot aprobado.',
    '- MD-08: pedido.checkout continúa JSON; la observación de atomicidad/normalización queda pendiente, sin presentar tablas propuestas como implementadas.',
    '- MD-09: usuario.email y credencial.correo siguen duplicados, con UNIQUE separados. No hay sincronización automática en el SGBD.',
    '- MD-11: calificacion es un dato del catálogo con CHECK 0–5; no existe sistema de reseñas. Su origen comercial definitivo sigue pendiente de decisión.',
    '- MD-13: variante tiene unicidad producto/posición y la clave id/producto necesaria para FK; no UNIQUE natural producto/color/talla.',
    '- pedido_item conserva nombre/precio_unitario históricos ante cambios del catálogo. solicitud_postventa repite pedido_id bajo FK compuesta: redundancia controlada.',
    '- coleccion y post son contenido editorial independiente, sin FK artificiales.',
    '- Pago y entrega continúan texto libre; no hay catálogo aprobado ni nuevos CHECK.',
    '',
    '## Propuesta BD-1 a BD-8 — NO implementada',
    '',
    'La propuesta externa contempla separar checkout, eliminar correo duplicado, revisar precio de looks y producto derivable, unicidad de variantes, listas de colores/tallas y catálogos comerciales. No está autorizada por este cierre y no integra el diagrama. pedido_despacho u otras tablas propuestas no existen actualmente.',
    '',
    'MODELO_ENTIDAD_RELACION.md se conserva como antecedente H2. Este es el MER físico H3, sin declarar cerradas las 43 observaciones.',
    '',
    'Reproducibilidad: node tools/generar-mer.cjs --check.',
    '',
  ];
  const outputs = {
    'docs/MER_FISICO_H3.md': lines.join('\n'),
    'docs/mer-fisico-h3.schema.json':
      JSON.stringify(
        { migrations: MIGRACIONES_ESPERADAS, tables: ESQUEMA_ESPERADO },
        null,
        2,
      ) + '\n',
  };
  for (const [rel, body] of Object.entries(outputs)) {
    const p = path.join(root, rel);
    const formatted = await require('prettier').format(body, {
      ...(await require('prettier').resolveConfig(p)),
      filepath: p,
    });
    if (process.argv.includes('--check')) {
      if (
        !fs.existsSync(p) ||
        fs.readFileSync(p, 'utf8').replaceAll('\r\n', '\n') !== formatted
      )
        throw Error('MER desactualizado: ' + rel);
    } else {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, formatted);
    }
  }
  console.log(
    JSON.stringify({
      mode: process.argv.includes('--check') ? 'check' : 'generate',
      tables: tables.length,
      foreignKeys: fkCount,
    }),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
