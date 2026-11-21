# P6 — Contrato de integración Backend ↔ Frontend React

Rama `lab/h3-p6-integracion-frontend`, base `develop@e5e848d` (P0–P5). Este documento
describe la API **tal como está implementada**; no agrega rutas ni cambia DTO. La fuente
normativa sigue siendo Swagger (`/api`, `/api-json`). **La integración no está certificada**
hasta la prueba real React → NestJS → MySQL de la sección 9.

## 1. URL base

| Entorno                     | URL base                              | Nota                                           |
| --------------------------- | ------------------------------------- | ---------------------------------------------- |
| Local (`npm run start:dev`) | `http://localhost:3000`               | `PORT`                                         |
| Docker compose              | `http://localhost:${HOST_PORT:-3000}` | La imagen usa `NODE_ENV=production`            |
| Otros                       | Definida por quien despliega          | No hay prefijo global (`/api` es solo Swagger) |

Las rutas van directamente bajo la raíz: `GET {BASE}/productos`, `POST {BASE}/auth/login`.
El módulo React JWT del frontend lee la URL base desde la variable de build de Vite
`VITE_API_BASE_URL` (origen de la API, sin ruta ni barra final, p. ej. `http://localhost:3000`).
Vite la expone como `import.meta.env.VITE_API_BASE_URL` y la fija al compilar: cambiarla
requiere reconstruir el frontend. No escribir la URL a mano en los componentes.

**CORS:** el backend solo acepta los orígenes de `CORS_ORIGENES` (sección 8). Sin cookies:
usar `fetch` con el `credentials` por defecto (`same-origin`) o `omit`; **no** `include`.

## 2. Autenticación

### Registro — `POST /auth/registro` (público)

```json
{
  "nombre": "Ana Prueba",
  "correoElectronico": "ana@example.test",
  "contrasena": "..."
}
```

- **201:** `{ "id": 3, "nombre": "Ana Prueba", "correoElectronico": "ana@example.test" }`.
  No devuelve token: después hay que hacer login. El correo se guarda en minúsculas y sin
  espacios.
- **400:** campos faltantes, campos no declarados o correo inválido.
- **409:** el correo ya existe.

### Login — `POST /auth/login` (público)

```json
{ "correoElectronico": "ana@example.test", "contrasena": "..." }
```

**200:**

```json
{
  "mensaje": "Inicio de sesion correcto",
  "usuario": {
    "id": 3,
    "nombre": "Ana Prueba",
    "correoElectronico": "ana@example.test"
  },
  "accessToken": "<JWT>",
  "tipoToken": "Bearer",
  "expiraEnSegundos": 3600
}
```

- **401:** `message: "Correo electronico o contrasena incorrectos"`. Es el mismo mensaje si el
  correo no existe: no se revela qué cuentas existen.
- El JWT es HS256, con `sub` igual al id del usuario y expiración `expiraEnSegundos`, que se
  configura en el servidor (3600 por defecto). **No se emite refresh token:** al expirar, la API
  responde 401 y hay que volver a iniciar sesión.

### Logout — `POST /auth/logout` (público)

Responde `200 { "mensaje": "Sesion cerrada" }`. El servidor **no revoca** el token. El frontend
debe descartar el token y los datos del usuario, que de todos modos vencen por expiración.

### Uso del token

```
Authorization: Bearer <accessToken>
```

Lo exigen todas las rutas `/usuarios/{usuarioId}/...`, `POST /pedidos`, `POST /looks` y
`/operaciones/...` y `/administracion/...`.

Recomendaciones para el módulo React:

- Guardar el token en memoria (contexto o estado). Si se persiste, preferir `sessionStorage` a
  `localStorage` y asumir el riesgo de XSS.
- Nunca guardar el token en cookies, URL ni logs.
- Ante un 401 en una ruta protegida, limpiar la sesión y redirigir a login.

## 3. Errores

Todo error tiene este formato:

```json
{ "statusCode": 400, "message": "texto" | ["texto", "..."], "error": "Bad Request",
  "requestId": "…", "timestamp": "2026-11-18T…Z", "path": "/ruta" }
```

`message` puede ser un **arreglo** (errores de validación de DTO). Mostrar o registrar el
`requestId`, que también llega en la cabecera `X-Request-Id`.

| Código  | Cuándo ocurre                                                                                                                                                                                                                               | Qué debe hacer React                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **400** | Body o query inválidos; **campos no declarados** (se rechazan, no se ignoran); id de ruta no canónico (`01`, `abc`, `0`, mayor que 2^53−1); `limite` > 50; `precioMin` > `precioMax`                                                        | Validar en el formulario; no reintentar sin corregir |
| **401** | Sin cabecera: `"Se requiere un token de acceso"`. Token mal formado, manipulado o expirado: `"Token de acceso invalido o expirado"`. Login con credenciales incorrectas                                                                     | Cerrar la sesión local y pedir login                 |
| **403** | **Solo** en operaciones administrativas: carga y reconciliación de imágenes (`/administracion/...`, permiso `productos.imagenes.gestionar`) y operaciones de envío (`/operaciones/...`, `LOGISTICA_OPERADORES_IDS`). JWT válido sin permiso | Mostrar «sin permiso»; no reintentar                 |
| **404** | El recurso no existe, **o pertenece a otro usuario**. Si `{usuarioId}` de la ruta no es el del token, responde 404 «No existe el usuario con id N», no 403                                                                                  | No asumir que el recurso existe; revisar el id usado |
| **409** | Correo repetido, favorito repetido, transición logística inválida, `Idempotency-Key` reutilizada con otro cuerpo, carrito ya en checkout                                                                                                    | Mostrar el conflicto                                 |
| **413** | Body JSON demasiado grande, o imagen de más de 5 MiB (solo administración)                                                                                                                                                                  | —                                                    |
| **503** | Indisponibilidad explícita de un servicio; el backend requiere MySQL y no admite modo dummy                                                                                                                                                 | Error de entorno, no del usuario                     |
| **500** | Error no controlado. Mensaje genérico, sin detalles internos                                                                                                                                                                                | Reportar con el `requestId`                          |

## 4. Identificación de usuario

- El **único** id de usuario válido para el frontend es `usuario.id` de la respuesta del login
  (o el `id` del registro, una vez iniciada la sesión).
- Construir las rutas como `/usuarios/${usuario.id}/...`. No tomar el id de un formulario, de
  la URL del navegador ni de otro usuario.
- El backend **no confía** en ese id: lo compara con el `sub` del token. Uno distinto responde 404. Ningún body acepta `usuarioId`: los campos no declarados responden 400.
- `POST /pedidos` no lleva usuario en la ruta. El dueño sale del token y el `carritoId` debe ser
  el `id` de `GET /usuarios/{id}/carrito` del mismo usuario; si no, responde 404.
- Los ids de ruta deben ser enteros positivos canónicos (sin ceros a la izquierda, sin signos
  ni decimales).

## 5. Categorías — `GET /categorias` (público)

Query opcional `destacada=true|false` (otro valor responde 400). Respuesta: arreglo de
`{ id, nombre, slug, imagenUrl, destacada }`.

El `slug` (p. ej. `mujer`) es el valor que se usa en el filtro `categoria` de productos. Mostrar
`nombre`, nunca construir el slug desde él. **No** existen `imgCategory` ni `categoryName`: los
mocks actuales del frontend deben mapearse a `imagenUrl` y `nombre`.

## 6. Productos (públicos)

### `GET /productos`

| Query                    | Tipo                                                                  | Regla                                                            |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `search`                 | texto                                                                 | Busca en nombre y descripción; no distingue mayúsculas ni tildes |
| `categoria`              | slug                                                                  | De `GET /categorias`                                             |
| `talla`, `color`         | texto                                                                 | Coinciden en una **misma variante con stock**                    |
| `precioMin`, `precioMax` | entero ≥ 0                                                            | CLP; si min > max, responde 400                                  |
| `novedad`, `oferta`      | `true`/`false`                                                        | Otro valor responde 400                                          |
| `orden`                  | `relevancia` (por defecto), `precio_asc`, `precio_desc`, `nombre_asc` | Otro valor responde 400                                          |
| `pagina`                 | entero ≥ 1                                                            | Por defecto 1                                                    |
| `limite`                 | entero 1–50                                                           | Por defecto 12; 51 o más responde 400                            |

Cualquier query no declarada responde 400. Respuesta:
`{ productos: ProductoResumen[], pagina, limite, total }`, con
`ProductoResumen = { id, nombre, precio, imagenUrl, categoria, novedad, oferta }`, donde
`precio` es un entero en CLP y `categoria` es el slug.

### `GET /productos/{id}`

Devuelve el resumen más `descripcion`, `imagenes: string[]`, `calificacion`, `colores[]`,
`tallas[]`, `guiaTallas` y `variantes: [{ id, color, talla, stock }]`. Si el producto no
existe, 404.

### Variantes

- Lo que se compra es la **variante**, no el producto. Al elegir color y talla en la ficha,
  buscar en `variantes` la que coincide y usar su `id` como `varianteId`.
- Con `stock` 0 la variante no se puede agregar.
- `POST /usuarios/{id}/carrito/items` recibe `{ varianteId, cantidad }`. Agregar una variante
  existente suma cantidad, y nunca se puede superar el stock.
- `PATCH` reemplaza la cantidad y `DELETE .../items/{varianteId}` quita la línea.
- **El frontend nunca envía precios ni totales:** el servidor usa el precio vigente.

## 7. URLs de imágenes

`imagenUrl` (portada) e `imagenes[]` (galería) pueden venir de dos formas:

1. **Absolutas** (`https://...`): datos semilla H2. Son direcciones de ejemplo de
   `cdn.stylenow.cl` que **pueden no existir**; usar una imagen de reemplazo en `onError`.
2. **Relativas** (`/imagenes/productos/<uuid>.<ext>`): imágenes cargadas en P5. Se sirven
   públicamente desde la API: `GET {BASE}/imagenes/productos/<archivo>`.

Para resolver ambas:

```ts
const url = new URL(imagen, import.meta.env.VITE_API_BASE_URL).toString();
```

`new URL` respeta las URLs absolutas. Una ruta relativa que empieza con `/` se resuelve contra
el **origen** de `VITE_API_BASE_URL`: si la base incluyera una ruta de proxy
(`https://x.cl/backend`), esa ruta se descartaría. Por eso la base es solo el origen, y un
proxy con prefijo debe conservar o reescribir `/imagenes/productos/...`. Las etiquetas `<img>`
no requieren CORS.

## 8. CORS (P6-01)

| Variable        | Valor                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| `CORS_ORIGENES` | Orígenes exactos separados por coma: `https://app.stylenow.cl,http://localhost:5173` |

- **No definida:** fuera de producción se admiten `http://localhost:5173`,
  `http://127.0.0.1:5173`, `http://localhost:4173` y `http://127.0.0.1:4173` (Vite `dev` y
  `preview`). Con `NODE_ENV=production`, que es el caso de la imagen Docker, no se admite
  **ningún** origen cruzado y se registra una advertencia.
- **Inválida** (`*`, comodines, ruta, barra final, mayúsculas en el host, credenciales en la
  URL): la API **no arranca**.
- **Métodos:** GET, HEAD, POST, PATCH, DELETE.
- **Cabeceras permitidas:** `Authorization`, `Content-Type`, `X-Request-Id`,
  `Idempotency-Key`. **Cabecera expuesta:** `X-Request-Id`.
- **Credenciales CORS:** no se habilitan (no hay `Access-Control-Allow-Credentials`); la API
  usa JWT Bearer.
- **Preflight** `OPTIONS`: responde 204 antes del guard JWT (no exige token) y se cachea
  600 s.

Cabeceras opcionales:

- `X-Request-Id` (≤ 64 caracteres `[A-Za-z0-9._-]`; si no es válido, el servidor genera
  otro) para correlacionar.
- `Idempotency-Key` en `POST /pedidos` (recomendado: un UUID por intento de checkout,
  reutilizado en los reintentos).

## 9. Estrategia de prueba React → NestJS → MySQL (sin credenciales reales ni AWS)

**Objetivo:** demostrar la integración con datos sintéticos en una base desechable local.
**No usar** MySQL de AWS, cuentas reales ni secretos compartidos.

0. **QA automatizada previa** (sin React): `node test/persistencia/ejecutar-imagenes-laboratorio.cjs`
   crea un MySQL 8.4 desechable, ejecuta las suites SQL y E2E híbridas y detiene el contenedor al
   terminar. No sirve como base viva para la prueba manual.
1. **Base desechable para la prueba manual:** un contenedor `mysql:8.4` nuevo, de un solo uso,
   publicado solo en `127.0.0.1` (p. ej. `-p 127.0.0.1:3307:3306`), con usuario, contraseña y
   base generados en el momento y pasados por un archivo `--env-file` fuera del repositorio.
   No reutilizar volúmenes de otros proyectos.
2. **Backend** contra esa base: `PERSISTENCIA=mysql`, `DB_*` del contenedor, `JWT_SECRET`
   aleatorio generado en el momento (≥ 32 bytes, no versionado) y
   `CORS_ORIGENES=http://localhost:5173`. Aplicar las migraciones con `npm run migration:run`
   solo contra esa base.
3. **Frontend** en su entorno de laboratorio: definir
   `VITE_API_BASE_URL=http://localhost:3000` en un `.env.local` del frontend (Vite lo lee y
   Git no debería versionarlo) o solo para la sesión, y ejecutar `npm run dev` (Vite en `:5173`):
   - PowerShell: `$env:VITE_API_BASE_URL='http://localhost:3000'; npm run dev`
   - bash: `VITE_API_BASE_URL=http://localhost:3000 npm run dev`
4. **Cuenta sintética:** crearla mediante `POST /auth/registro` con un correo `@example.test`
   y una contraseña generada para la prueba. Si existe un formulario de registro, validar
   también ese flujo. No reutilizar contraseñas reales.
5. **Casos mínimos**, a verificar en DevTools → Network (preflight y cabeceras) y en MySQL:

| #   | Caso                 | Esperado                                                                                       |
| --- | -------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Home y catálogo      | `GET /categorias`, `/productos` y `/productos/1` 200, con ACAO = `http://localhost:5173`       |
| 2   | Imágenes             | Las relativas cargan desde `{BASE}`; las de ejemplo muestran la imagen de reemplazo            |
| 3   | Registro, login      | 201, luego 200 con `accessToken`; nada guardado en cookies                                     |
| 4   | Perfil y direcciones | Preflight 204 y GET/POST/PATCH/DELETE 2xx con Bearer                                           |
| 5   | Carrito → checkout   | Agregar `varianteId` y `POST /pedidos` con `Idempotency-Key` → 201; el pedido aparece en MySQL |
| 6   | Sesión inválida      | Token alterado o expirado → 401 y la UI vuelve a login                                         |
| 7   | Acceso cruzado       | Con la sesión del usuario A, `/usuarios/{B}` → 404                                             |
| 8   | Persistencia         | Reiniciar backend y contenedor; el login y los pedidos siguen ahí                              |
| 9   | Origen no autorizado | Servir el frontend en otro puerto no listado; el navegador bloquea por CORS                    |

6. **Evidencia:** HAR o capturas sin el token (redactarlo), `X-Request-Id` de cada caso y
   consultas SQL de conteo. Detener el contenedor al terminar.

Opcional: automatizar los casos 1–7 con Playwright contra el entorno local.

## 10. Fuera de alcance o pendiente

- Refresh tokens, revocación de JWT, roles de usuario y recuperación de contraseña.
- Rate limiting del login.
- Despliegue, HTTPS, AWS y proxy inverso: los define quien despliega (`CORS_ORIGENES` y URL
  base deben coincidir con el dominio final).
- Validar el módulo React JWT independiente contra este contrato en el laboratorio de integración.
  La existencia de la entrega no acredita el flujo React–NestJS–MySQL.

Procedencia de la entrega React de referencia: preparada con asistencia de Codex. Se conserva
esta información de procedencia sin modificar atribuciones legales, académicas ni el historial Git.
