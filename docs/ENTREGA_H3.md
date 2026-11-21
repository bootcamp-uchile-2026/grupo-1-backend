# Entrega Backend Hito 3 — 0.3.0

## Arquitectura vigente

NestJS 11, TypeORM y MySQL 8.4.13. Trece puertos con binding SQL directo, transacciones y rollback sin reejecución del callback, inventario protegido e idempotencia. Los archivos de imagen se guardan en volumen y las asociaciones/publicaciones en MySQL. No hay adaptadores dummy ni fallback. SQL y JWT son obligatorios antes de escuchar HTTP; no hay migración/siembra automática.

La base SQL-04 certificó 148 unitarias, 161 E2E, 19 fail-fast y seis laboratorios. Ese resultado pertenece al snapshot previo. El cierre 0.3.0 incorpora pruebas adicionales de versión, límites de correo, MER y pipe SQL. La ejecución propia y sus hashes se registran en la carpeta externa h3-ejecucion-cierre-codex-20261120/03-RESULTADOS-QA.md. No se hereda la certificación de imagen de SQL-04 para código modificado.

## QA propia del cierre 0.3.0

**156 unitarias + 165 E2E = 321 pruebas PASS**, sin fallidas ni omitidas en la
regresión final. Se preservan las 309 originales y se agregan 12: tres del pipe,
dos de versión, tres de correo, tres SQL del pipe y una del MER. Veinte suites
unitarias y 27 E2E. TypeScript, build limpio, ESLint sin autofix, Prettier y
reproducibilidad del MER pasan.

Los seis laboratorios PR0–P5 y el integrado pasan sobre MySQL 8.4.13. Los
19 arranques pasan, incluidos Swagger y log con 0.3.0. La imagen local propia
se inspeccionó y ejecutó por digest; publicación de WebP y asociación SQL
persistieron tras recrear API y reiniciar MySQL. Sus 176 JavaScript equivalen
al build limpio normalizando solo CRLF/LF; el grafo principal tiene 172 módulos
locales y no importa adaptadores de memoria.

La primera regresión falló porque el fixture OpenAPI no contenía cinco cambios
de metadatos autorizados; se preserva ese resultado. Solo se actualizaron esos
cinco campos, sin cambiar cuerpos/rutas ni debilitar la comparación estricta.
La segunda regresión completa y la prueba de imagen son las aprobadas.

Las dos actualizaciones finales de README/este resumen no alteran código,
configuración o pruebas; tienen revisión documental y formato propios.

## Documentación

- [MER físico vigente](MER_FISICO_H3.md), con 29 tablas y 44 FK.
- [Endpoints principales y completos](ENDPOINTS_H3.md).
- README: instalación, entorno, JWT, errores, imágenes, privacidad y decisiones REST.
- MODELO_ENTIDAD_RELACION.md es antecedente H2, no el esquema físico actual.

## Validaciones y contratos

El correo de registro/login explicita la capacidad SQL 320, conservando el criterio IsEmail existente. No se introducen catálogos nuevos ni políticas de teléfono/contraseña incompatibles. Un pipe inyectable resuelve la lectura de producto una vez mediante el repositorio SQL: conserva 400/404 y el cuerpo HTTP. ErrorResponseDto y sus códigos 400, 401, 403, 404 y 409 continúan verificados por las suites de privacidad/OpenAPI/negocio.

## Demo local reproducible

Desde la raíz del backend, con Docker Linux operativo:

    npm ci
    node node_modules/typescript/bin/tsc --noEmit --incremental false
    node node_modules/eslint/bin/eslint.js "src/**/*.ts" "test/**/*.ts"
    node tools/generar-mer.cjs --check
    node test/persistencia/ejecutar-sql01-laboratorio.cjs

El último comando crea una base y volumen nuevos exclusivos. No usar migration:run con variables de una base compartida. Las credenciales del laboratorio quedan privadas; no grabarlas. Para la demo HTTP se entrega un script externo que verifica las etiquetas de los recursos propios antes de iniciarlos. Swagger queda en /api y su versión debe coincidir con el arranque. Los scripts no publican la imagen.

## Desviaciones y pendientes declarados

- Normalización BD-1 a BD-8 no implementada: checkout JSON, correo duplicado, precio almacenado en looks, relaciones derivables y unicidad natural de variante siguen pendientes. Integridad referencial no se presenta como 3FN completa.
- Método de pago/entrega siguen texto libre; catálogo y límites comerciales requieren decisión. Teléfonos históricos y contraseñas existentes impiden introducir nuevas políticas sin coordinar clientes.
- JWT Bearer se conserva; no hay cookie HttpOnly, refresh token ni revocación en logout. Se declara la desviación del requisito académico de cookie, no equivalencia.
- Reglas de propiedad y permisos están implementadas; no hay sistema uniforme de roles.
- Tres hallazgos moderados npm de producción en TypeORM/glob/minimatch; no se aplica fix ni salto mayor. No se certifica seguridad global del sistema operativo.
- No hay evidencia nueva de servidor remoto, publicación Docker Hub, tag SemVer remoto, tablero, wiki, PDF o video terminado. La integración React–NestJS–MySQL completa permanece pendiente.
- No se incorpora trazabilidad administrativa H4, ni reseñas, ni pasarelas de pago reales.

## Versionado y publicación

Paquete, lockfile, configuración predeterminada, Compose y .env.example identifican 0.3.0. APP_VERSION admite override por compatibilidad; debe identificar el artefacto real. La misión permite commits locales luego de QA; push, PR, merge, tag remoto y publicación siguen sujetos a autorización. La imagen local y el eventual servidor publicado se distinguen en las evidencias.
