# StyleNow Backend — Hito 3

API REST de StyleNow con NestJS, TypeORM, MySQL 8.4 y Swagger/OpenAPI.
El Backend operativo requiere MySQL: todos los puertos usan TypeORM. No hay
adaptadores de memoria ni selector operativo de persistencia.

Versión de entrega: **0.3.0**. La base SQL-04 superó 309 pruebas, 19
comprobaciones de arranque y seis laboratorios MySQL 8.4.13. Las correcciones
posteriores tienen su propia regresión: ver docs/ENTREGA_H3.md. Esto no declara
Hito 3 cerrado ni sustituye los pendientes de normalización y entrega.

## Requisitos e instalación

Entorno de esta revisión: Node.js 24.13.0 y npm 11.6.2 en Windows.
Las unitarias no requieren MySQL. Las E2E utilizan Docker y MySQL desechable.

    npm ci
    Copy-Item .env.example .env

El lock está versionado. No ejecutar herramientas de actualización automática
de dependencias como parte de la instalación.

## Variables de entorno

| Variable                                       | Requisito y comportamiento                                                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PORT                                           | Puerto HTTP; 3000 por defecto. Debe ser un entero entre 1 y 65535.                                                                                                                           |
| APP_NAME                                       | Título de Swagger; StyleNow API por defecto.                                                                                                                                                 |
| APP_VERSION                                    | Versión publicada en Swagger y arranque; 0.3.0 por defecto, igual que paquete, lock y Compose. Un override de despliegue debe identificar el artefacto real.                                 |
| SWAGGER_PATH                                   | api por defecto; no puede colisionar con rutas de negocio.                                                                                                                                   |
| PERSISTENCIA                                   | No es necesario. Solo se tolera mysql como marca heredada; dummy y otros valores se rechazan.                                                                                                |
| JWT_SECRET                                     | Obligatorio; al menos 32 bytes y no solo espacios. Generar por entorno y no versionar.                                                                                                       |
| JWT_EXPIRACION_SEGUNDOS                        | Entero de 60 a 86400; 3600 por defecto.                                                                                                                                                      |
| DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE | Siempre obligatorios y no vacíos. No tienen valores predeterminados de conexión.                                                                                                             |
| DB_PORT                                        | Obligatorio y explícito; entero de 1 a 65535. Sin puerto implícito.                                                                                                                          |
| CORS_ORIGENES                                  | Orígenes exactos separados por comas. Fuera de producción, vacío habilita únicamente Vite local en 5173/4173 y sus equivalentes 127.0.0.1. En producción, vacío no admite orígenes cruzados. |
| LOGISTICA_OPERADORES_IDS                       | IDs explícitos autorizados para operar envíos; vacío deniega esa capacidad. No reemplaza el JWT.                                                                                             |
| IMAGENES_DIRECTORIO                            | uploads/productos por defecto; Compose utiliza /app/uploads/productos.                                                                                                                       |

.env.example contiene valores públicos de desarrollo y deja los secretos vacíos.
Copiarlo no configura SQL ni un JWT_SECRET válido. Para iniciar una
sesión de desarrollo en PowerShell sin guardar el secreto en un archivo:

    # Completar DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD y DB_DATABASE en .env
    $env:JWT_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
    npm run start:dev

La API escucha en http://localhost:3000. Swagger está en /api y su JSON en
/api-json. Las rutas de negocio no tienen prefijo global /api.

## Arquitectura y persistencia

La composición de módulos vive en AppModule. Los contratos de repositorio
usan modelos internos; los servicios y mappers proyectan las respuestas HTTP.

    Controller → Service → Puerto de repositorio → Adaptador TypeORM → MySQL

Logística utiliza servicios transaccionales SQL y la gestión de imágenes tiene
un repositorio específico para archivos, permisos y asociaciones de galería.

En MySQL persisten categorías, colecciones, publicaciones,
productos y variantes, usuarios, credenciales, direcciones, carrito, favoritos,
pedidos, looks, alertas, posventa y logística. Los archivos de imágenes residen
en el directorio persistente; MySQL almacena sus asociaciones y trazabilidad.

El arranque SQL falla si la conexión no está disponible. No hay fallback a
fixtures. synchronize y migrationsRun están desactivados. La preparación del
esquema requiere ejecutar explícitamente las migraciones en una base autorizada.

Las 14 migraciones históricas permanecen intactas. Las correcciones de entidades se incorporaron desde la base validada de Claude.
Este cierre conserva esas migraciones, M-P7-01 y cuatro snapshots byte a byte.
No aplica cambios a bases compartidas.

## Autenticación y autorización

POST /auth/registro crea usuario, credencial y carrito. En SQL forman parte de
la misma unidad de trabajo. Las contraseñas se derivan con scrypt y sal aleatoria;
solo se almacena el hash. Los fixtures y hashes de demostración se limitan a test; las migraciones
de identidad no crean contraseñas conocidas.

POST /auth/login recibe correoElectronico y contrasena. Devuelve mensaje,
usuario, accessToken, tipoToken Bearer y expiraEnSegundos. Las rutas privadas
requieren Authorization: Bearer <accessToken>. NestJS valida el token y la
propiedad de los recursos; un usuario ajeno en la ruta responde 404.

POST /auth/logout confirma el cierre, pero no revoca JWTs. El cliente descarta
su sesión; una copia del token conserva validez hasta expirar. No hay refresh
token ni recuperación de contraseña implementados.

Las capacidades administrativas son independientes: imágenes exige el permiso
SQL productos.imagenes.gestionar y logística la lista operativa del entorno.
Tener un JWT válido no concede esos permisos.

## Decisiones REST y de compatibilidad

**Excepción REST /auth/\*.** Registro, login y logout son acciones de autenticación.
POST /auth/registro coordina usuario, credencial y carrito en una transacción;
responde 201 con el perfil público o 409 por correo repetido. Login emite una
credencial temporal; logout confirma que el cliente debe descartarla, sin revocarla.
El recurso de perfil se consulta y modifica en /usuarios/{usuarioId}. Se preservan
estas rutas para Frontend/Mobile; no se convierte el registro en POST /usuarios.

Se conservan posts, carrito/items y search como nombres del contrato existente.
También se mantienen las rutas de alertas precio/reposicion y la creación global
de pedidos. La homogeneización REST y de idioma es deuda explícita; agregar aliases
requiere revisión de clientes y no forma parte de este cierre.

Las carpetas se organizan por responsabilidad técnica y los módulos Nest por
dominio. La suite test/ se conserva como regresión; no se copia a la imagen final.

## Funcionalidades y límites

- Catálogo público: productos, variantes, filtros, categorías, colecciones y posts.
- Perfil y direcciones del propietario autenticado.
- Carrito: agregar, modificar y eliminar variantes; no reserva ni descuenta stock.
- Checkout SQL: captura precios históricos del servidor, descuenta stock y vacía
  el carrito dentro de una transacción. No ejecuta pagos reales.
- Favoritos: consultar y agregar; el contrato actual no incluye DELETE.
- Looks: explorar, crear y guardar. SQL registra creador; la lectura es pública.
  No hay borradores, edición ni operación de publicación en comunidad.
- Alertas: registrar precio/reposición, consultar y eliminar. No se envían avisos.
- Posventa: recibir solicitudes e historial. No hay endpoint de aprobación,
  ejecución de reembolsos ni nuevas reglas de elegibilidad.
- Logística SQL: seguimiento, operaciones autorizadas y cancelación comercial.
  La restitución se limita a los débitos registrados por el checkout, según P4.

El envío comercial continúa con costo cero en el contrato actual. Método de
pago y método de entrega todavía son textos libres; sus catálogos y límites
comerciales requieren decisión. No hay rate limiting de login/registro.
Sin configuración SQL y JWT válida el proceso termina antes de escuchar,
también en desarrollo. La indisponibilidad de MySQL no activa otra persistencia.

## Transacciones

La unidad de trabajo usa transacciones TypeORM y rollback. Las operaciones
anidadas participan de la transacción existente, sin savepoints independientes.
Los conflictos MySQL 1213/1205 se traducen a error controlado sin repetir
automáticamente el callback.

AsyncLocalStorage presupone un DataSource lógico. Todo trabajo debe esperarse
antes de salir del callback; tareas desacopladas pueden conservar un manager
liberado. Un rollback SQL no revierte efectos externos ni garantiza atomicidad
del DDL MySQL.

## Imágenes

POST /administracion/productos/:productoId/imagenes recibe un archivo imagen
multipart. Valida contenido real JPEG, PNG o WebP estático, máximo 5 MiB y
16 millones de píxeles; recodifica y usa nombres UUID generados por el servidor.

GET /imagenes/productos/:archivo es público y sirve solo imágenes publicadas.
La carga añade una URL a imagenes; imagenUrl de portada se conserva independiente.
Las URLs relativas se resuelven contra el origen de la API. Las URLs remotas
de fixtures son ejemplos y no acreditan disponibilidad de un CDN.

La publicación coordina SQL y archivos con estados y reconciliación conservadora;
no es una transacción distribuida. No hay borrado/reemplazo de imágenes publicadas.
El volumen debe respaldarse junto con la base. Ver docs/p5-imagenes-productos.md.

## CORS, errores y privacidad

CORS utiliza orígenes exactos, sin cookies ni credenciales CORS. Admite
Authorization, Content-Type, X-Request-Id e Idempotency-Key. No sustituye
autenticación ni autorización.

Los errores incluyen statusCode, message (texto o lista), error, requestId,
timestamp y path. Los logs HTTP registran metadatos de entrada/salida sin
cuerpos ni cabeceras. Los errores inesperados de petición no publican detalles
internos. La sanitización de configuración se verifica mediante regresiones.
La omisión del body es intencional: contacto, dirección, teléfono y credenciales
son datos sensibles. RequestId permite correlacionar entrada, salida y error
sin registrar cuerpos, cookies, query ni Authorization.

## Pruebas y calidad

    node node_modules/typescript/bin/tsc --noEmit --incremental false
    npm run build
    node node_modules/eslint/bin/eslint.js "src/**/*.ts" "test/**/*.ts"
    node node_modules/prettier/bin/prettier.cjs --check "src/**/*.ts" "test/**/*.ts"
    npm test -- --runInBand
    node test/persistencia/ejecutar-sql01-laboratorio.cjs

Las E2E necesitan un laboratorio SQL protegido. El runner crea base, usuario,
contraseña, JWT, contenedor y volumen nuevos; verifica su propiedad y mantiene
las credenciales separadas de la evidencia pública. El helper de tests puede
generar un JWT efímero: esa facilidad no existe en la aplicación operativa.

npm run lint conserva --fix en el manifiesto recibido: utilizar el comando
explícito anterior para una revisión sin modificaciones.

Las suites no se omiten para aprobar. PR0 a P5 y el runner integrado crean
recursos nuevos y ejecutan migraciones exclusivamente en esos laboratorios.
La configuración SQL y el guard son obligatorios; test:e2e directo sin ellos falla.

El runner histórico de C1–C4 no acredita los lotes SQL y queda fuera del
paquete funcional. Sus archivos y evidencias anteriores se preservan en el
worktree sin incorporarlos a los commits de entrega.

## Docker y preparación del despliegue

El Dockerfile tiene etapas de build/producción y ejecuta la API como node.
Compose permite build local o BACKEND_IMAGE, puerto parametrizado y volumen
imagenes_productos. No contiene un servicio MySQL: la conexión debe configurarse
para el entorno autorizado.

La imagen utiliza NODE_ENV=production. Configurar JWT_SECRET, todos los DB_*
y CORS_ORIGENES antes de desplegar. Este cierre alinea Compose a 0.3.0 y utiliza únicamente imágenes y laboratorios
locales nuevos. Tags, imágenes publicadas, actualización del servidor y
correspondencia con una versión desplegada requieren evidencia independiente.
No se modifican AWS ni bases compartidas.

## Documentación y estado de integración

- [MER físico H3 vigente](docs/MER_FISICO_H3.md): 29 tablas de dominio y todas sus FK.
  Se genera desde el contrato contrastado con MySQL; no afirma 3FN completa.
- docs/MODELO_ENTIDAD_RELACION.md se conserva como antecedente conceptual H2.
- docs/ENTREGA_H3.md registra versión, evidencia, demo y pendientes.
- docs/p1-productos-mysql.md a docs/p4-modulos-restantes-mysql.md son registros
  históricos de cada incremento; no deben leerse como el estado completo actual.
- docs/p5-imagenes-productos.md documenta imágenes y sus límites.
- docs/p6-contrato-frontend.md describe los contratos actuales de integración.
- docs/calidad-codex/DECISIONES-SEGURIDAD.md conserva decisiones históricas
  identificadas como reemplazadas. Los resultados actuales están en docs/ENTREGA_H3.md.

La prueba completa React–NestJS–MySQL sigue pendiente. La existencia del módulo
React independiente o los adaptadores SQL no certifica ese flujo.
La normalización y la correspondencia MER–ORM–migraciones–MySQL requieren
validación conjunta con el trabajo de base de datos.

La licencia y sus avisos se conservan. La diferencia entre LICENSE MIT y
license UNLICENSED del manifiesto requiere decisión del equipo.
