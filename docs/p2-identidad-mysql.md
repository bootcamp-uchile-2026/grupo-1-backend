# H3-P2 — Identidad, credenciales, direcciones y JWT en MySQL

Fecha: 17-11-2026. Rama de laboratorio `lab/h3-integracion-20261115`, sin commit.

## Alcance

- **B1:** `TypeOrmProductosRepository.buscarPorId/buscarVariante` devuelven `null` ante un id
  positivo no representable (`!Number.isSafeInteger`). Antes, el transformer `enteroSeguro`
  lanzaba `Error` al construir el `WHERE` y la API respondía 500 en modo mysql y 404 en dummy.
- **Persistencia:** `usuario`, `credencial` (1:1, solo hash) y `direccion` (N:1) con adaptadores
  TypeORM de los puertos existentes (`UsuariosRepository`, `CredencialesRepository`,
  `DireccionesRepository`) y el mismo selector `proveerRepositorio` de PR0/P1.
- **Migraciones nuevas:** M03 `1795050400000-crear-identidad` y S03
  `1795050401000-sembrar-identidad`. M01/S01/M02/S02 sin cambios. `synchronize` y
  `migrationsRun` siguen en `false`.
- **Seguridad:** hash scrypt, JWT HS256 y guard global de autenticación y propiedad.

## Esquema M03

| Tabla | Claves | Notas |
|---|---|---|
| `usuario` | PK `id` INT UNSIGNED AUTO_INCREMENT; `uq_usuario_email` | email `VARCHAR(320) utf8mb4_bin`, ya normalizado; textos `MEDIUMTEXT` (F5 pendiente) |
| `credencial` | PK/FK `usuario_id` → usuario RESTRICT; `uq_credencial_correo` | `hash_contrasena` ASCII con `CHECK LIKE 'scrypt$%'`: el texto plano es imposible a nivel de base |
| `direccion` | PK `id`; FK `usuario_id` → usuario RESTRICT; `ix_direccion_usuario` | `CHECK principal IN (0,1)`; toda consulta filtra por usuario |

S03 siembra solo los perfiles y direcciones sintéticos de H2 (usuarios 1–2, direcciones 1–3),
para que los dominios que siguen en memoria conserven sus referencias. **No siembra
credenciales:** ninguna migración crea cuentas con contraseña conocida.

## Seguridad

- **Contraseñas:** scrypt de `node:crypto`, N=2^15, r=8, p=3 (≈32 MiB; es una de las
  configuraciones que recomienda OWASP), sal de 16 bytes, comparación de tiempo constante.
  Formato: `scrypt$N=..,r=..,p=..$sal$clave`. Se eligió en vez de Argon2id para **no añadir
  una dependencia nativa** mientras la política npm sigue pendiente; `package.json` y el lock
  no cambian. Si Fran aprueba Argon2id, el formato con prefijo permite migrar al iniciar sesión.
- **Login:** mismo 401 y mensaje si el correo no existe o la contraseña falla; ante un correo
  inexistente se gasta el mismo trabajo de scrypt.
- **JWT:** HS256 con algoritmo fijo (rechaza `none`, otros `alg` o campos extra en la cabecera),
  `iss=stylenow-api`, `aud=stylenow-clientes`, `sub` canónico, `iat`/`exp` y tolerancia de 60 s.
  Firma comparada en tiempo constante; tamaño máximo 2048 caracteres. `JWT_SECRET` (≥ 32 bytes)
  es obligatorio y `JWT_EXPIRACION_SEGUNDOS` va de 60 a 86400 (3600 por defecto); sin secreto
  válido la API no arranca.
- **Guard global (`APP_GUARD`):** toda ruta exige token salvo las marcadas `@Publico()`
  (catálogo, categorías, colecciones, posts, `GET /looks`, `GET /looks/:id` y auth). Si la ruta
  tiene `:usuarioId` canónico distinto del `sub`, responde **404 «No existe el usuario con id N»**,
  igual que H2 respondía a recursos de otro usuario: no revela qué cuentas existen. Un id no
  canónico sigue llegando al pipe (400, como en H2).
- **`POST /pedidos`:** el dueño sale del token; un carrito ajeno responde 404 «No existe el
  carrito con id N». No se confía en ningún id del cliente.
- **Registro:** usuario + credencial dentro de la `UnidadDeTrabajo` existente (un solo commit o
  rollback en MySQL); el hash se calcula fuera de la transacción. El carrito, que sigue en
  memoria hasta P3, se crea después del commit.

## Cambios de contrato (documentados y probados)

| Cambio | Tipo | Motivo |
|---|---|---|
| `POST /auth/login` 200 agrega `accessToken`, `tipoToken`, `expiraEnSegundos` | Aditivo | Requisito JWT; `mensaje` y `usuario` no cambian |
| Rutas `/usuarios/{id}/...`, `POST /pedidos` y `POST /looks` responden 401 sin token o con token inválido | Nuevo error | Seguridad obligatoria |
| Acceso a otro `usuarioId` → 404 | Igual semántica H2 para recursos ajenos | Propiedad |
| OpenAPI de `main.ts` declara `bearer` | Documentación | — |

## Decisiones no aprobadas, aisladas (no inventadas)

1. Revocación de tokens en logout o al cambiar la contraseña (lista de revocación o versión de
   token). Hoy el JWT vence por expiración; `POST /auth/logout` sigue sin estado.
2. Refresh tokens, roles o administrador: no implementados.
3. Política de contraseña (F4: mayúscula + número, máximo), límites de texto (F5) y cambio de
   email (D6/UX-24): sin cambios respecto de H2.
4. Rate limiting o bloqueo por intentos fallidos: no implementado (riesgo de fuerza bruta y del
   costo de memoria de scrypt bajo carga).
5. Autoría de looks (F11/UX-02): `POST /looks` exige sesión, pero no guarda autor.
6. Dirección principal única por usuario: H2 no la impone y P2 tampoco.
7. Cuentas demo con contraseña en una base real: no se siembran.
8. Recuperación de contraseña (`recuperacion_credencial`): fuera de P2.

## Pruebas

- **Unitarias:** `src/seguridad/*.spec.ts` (JWT: expirado, manipulado, otro secreto,
  `alg none`/HS512, `kid`, iss/aud, `sub` no canónico o no seguro, `iat` futuro, sin `exp`;
  scrypt; guard), `identidad.semilla.spec.ts` y B1 `typeorm-productos.repository.spec.ts`
  (falla sin la corrección).
- **E2E dummy:** `test/autenticacion.e2e-spec.ts`.
- **SQL (laboratorio desechable):** `test/identidad.mysql.e2e-spec.ts` (FK, CHECK, unicidad,
  rollback del registro, concurrencia, login, acceso cruzado, ausencia de hashes, paridad
  dummy/mysql, persistencia entre instancias). Se ejecutan con
  `node test/persistencia/ejecutar-identidad-laboratorio.cjs`, que también corre las suites
  PR0/P1, las 42+ E2E H2 en modo híbrido (con reinicio SQL de identidad por prueba), los
  reinicios de API y contenedor y la prueba sin fallback.
- **Helpers de prueba:** `test/utilidades/autenticacion.ts` (las E2E H2 actúan como dueño de
  cada ruta) y `test/utilidades/estado-identidad-sql.ts` (reinicio solo con la guarda del
  laboratorio).

## Riesgos residuales

- En modo mysql, carrito, favoritos, pedidos y demás siguen en memoria: un usuario registrado
  en SQL pierde su carrito al reiniciar la API (se resuelve en P3).
- Fallo del carrito después del commit de registro: el usuario queda sin carrito en memoria.
- DDL MySQL no atómico; el `down` de S03/M03 es destructivo (solo laboratorio).
- El `id` de usuario es `INT UNSIGNED`: los ids mayores responden 404 sin consultar.
