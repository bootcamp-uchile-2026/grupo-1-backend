# StyleNow Backend

API REST del ecommerce de moda **StyleNow**, construida con NestJS y
documentada con Swagger/OpenAPI. Corresponde al Hito 2 del Bootcamp Backend:
los datos viven en memoria (repositorios dummy con estado) y todavía no hay
base de datos.

## Contenidos

- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Swagger](#swagger)
- [Build y producción local](#build-y-producción-local)
- [Tests y calidad](#tests-y-calidad)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [Persistencia en Hito 2](#persistencia-en-hito-2)
- [Observabilidad y errores](#observabilidad-y-errores)
- [Modelo Entidad–Relación](#modelo-entidadrelación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo Git](#flujo-git)
- [Docker y despliegue](#docker-y-despliegue)
- [Seguridad](#seguridad)

## Requisitos previos

- **Node.js**, en una de estas líneas:
  - Node.js 20: 20.19.0 o superior dentro de la línea 20.
  - Node.js 22: 22.13.0 o superior dentro de la línea 22.
  - Node.js 24.

  Estos rangos salen de los `engines` de las dependencias actuales del
  `package-lock.json` (por ejemplo, `eslint-visitor-keys` exige
  `^20.19.0 || ^22.13.0 || >=24`). Las líneas impares (21, 23) no son
  compatibles con todas las dependencias.

  Versiones con las que se ejecutó realmente el proyecto: Node.js 22.23.2
  (desarrollo y validación) y Node.js 24.13.0 con npm 11.6.2 (auditoría).
  No se ejecutó con Node.js 20.
- **npm** (incluido con Node.js).
- **Git**.

## Instalación

```bash
git clone <url-del-repositorio>
cd <carpeta-del-repositorio>
npm install
```

Para instalar exactamente las versiones de `package-lock.json` (por ejemplo,
en CI) se puede usar `npm ci` en lugar de `npm install`.

## Configuración

La configuración se lee de variables de entorno con `@nestjs/config`. Para
usar un archivo `.env`, copia la plantilla:

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto HTTP de la API. |
| `APP_NAME` | No | `StyleNow API` | Nombre mostrado en Swagger/OpenAPI. |
| `APP_VERSION` | No | `1.0` | Versión mostrada en Swagger/OpenAPI. |
| `SWAGGER_PATH` | No | `api` | Ruta relativa de Swagger. Los slashes de los extremos se ignoran. |

Ninguna es obligatoria: si una variable falta o viene vacía, se usa su
valor por defecto. Sin `.env` la API funciona igual, con los defaults.

`SWAGGER_PATH` no puede coincidir con una ruta de la API. Swagger publica
`/<SWAGGER_PATH>`, `/<SWAGGER_PATH>-json` y `/<SWAGGER_PATH>-yaml`; si
alguna de esas rutas (o el prefijo `/<SWAGGER_PATH>/`) choca con un
endpoint, por ejemplo `SWAGGER_PATH=productos`, la aplicación no arranca y
muestra un error que indica las rutas en conflicto.

## Ejecución en desarrollo

```bash
npm run start:dev
```

La API queda en `http://localhost:3000` (o en el puerto de `PORT`) y se
recarga al guardar cambios.

## Swagger

Con la configuración por defecto, la documentación interactiva está en:

```
http://localhost:3000/api
```

La URL cambia según `PORT` y `SWAGGER_PATH`:
`http://localhost:<PORT>/<SWAGGER_PATH>`.

## Build y producción local

```bash
npm run build
npm run start:prod
```

`npm run build` compila a `dist/` y `npm run start:prod` ejecuta
`node dist/main`.

## Tests y calidad

```bash
npm test -- --runInBand   # tests unitarios
npm run test:e2e          # tests end-to-end (levantan la app en memoria)
npm run build             # verificación de compilación
```

Lint:

```bash
npm run lint
```

`npm run lint` ejecuta ESLint **con `--fix`**, es decir, puede modificar
archivos. Para revisar sin modificar nada:

```bash
npx eslint "{src,apps,libs,test}/**/*.ts"
```

## Arquitectura

Todos los dominios siguen la misma cadena:

```
Controller → Service → Repository (clase abstracta) → DummyRepository
```

- **Controller:** rutas HTTP, pipes y documentación Swagger.
- **Service:** reglas de negocio y orquestación; lanza errores de dominio.
- **Repository:** contrato abstracto de acceso a datos, usado como token de
  inyección. Devuelve datos, `null` o `boolean`; no decide códigos HTTP.
- **DummyRepository:** implementación en memoria registrada en
  `AppModule`.

Flujo de una petición:

```
DTO de entrada → ValidationPipe → Controller → Service → Repository
```

El `ValidationPipe` global rechaza campos no declarados en el DTO y
transforma los tipos.

## Funcionalidades

Todos los endpoints de Swagger funcionan con datos dummy en memoria:

- **Auth:** registro (crea la cuenta y su carrito vacío; correo repetido
  responde 409), login (401 si el correo o la contraseña no coinciden) y
  logout (confirmación). No hay JWT, tokens ni sesiones de servidor.
- **Productos:** listado con búsqueda, filtros (categoría, talla, color,
  precio, novedad, oferta), orden y paginación; ficha de producto.
- **Categorías:** listado, con filtro de destacadas.
- **Usuarios:** perfil, actualización de datos y cambio de contraseña. El
  cambio verifica la contraseña actual y guarda la nueva, que pasa a ser la
  única válida para el login.
- **Direcciones:** listar, crear, actualizar y eliminar.
- **Carrito:** ver, agregar, cambiar cantidad y eliminar líneas, con
  validación de stock.
- **Pedidos:** checkout desde el carrito (`POST /pedidos`), listado y
  detalle por usuario.
- **Looks:** explorar, ver detalle, crear y guardar.
- **Alertas:** de precio y de reposición; listar y eliminar.
- **Cambios y devoluciones:** crear solicitudes sobre items de un pedido y
  consultarlas.
- **Favoritos:** agregar un producto a los favoritos del usuario (el mismo
  producto dos veces responde 409).
- **Colecciones:** listado de colecciones editoriales (solo lectura).
- **Comunidad:** listado de publicaciones (`/posts`, solo lectura).

Los usuarios semilla tienen credenciales de demostración en
`src/data/credenciales.dummy.ts`; no son secretos reales.

## Persistencia en Hito 2

- Los datos viven en memoria, en repositorios dummy con estado que parten
  de los fixtures de `src/data`.
- Las escrituras (registro, cambio de contraseña, crear, actualizar,
  eliminar, checkout, favoritos) se reflejan en las lecturas siguientes
  mientras el proceso sigue activo.
- Las contraseñas se guardan en memoria sin hashing, separadas del perfil,
  y nunca aparecen en respuestas, logs ni mensajes de error.
- Al reiniciar la aplicación se vuelve al estado inicial de los fixtures.
- El checkout valida el stock, pero no lo descuenta del catálogo.
- No hay SQL, base de datos, ORM ni JWT en esta fase.

## Observabilidad y errores

- **Request ID:** toda respuesta incluye la cabecera `X-Request-Id`. Si el
  cliente envía un id válido, se reutiliza; si no, el servidor genera uno.
- **Logs HTTP:** cada petición produce un registro `http_request` con
  `requestId`, método, ruta, código de estado y tiempo de ejecución
  (`durationMs`).
- **Errores:** un filtro global responde con un formato común
  (`statusCode`, `message`, `error`, `requestId`, `timestamp`, `path`). Los
  errores de dominio se traducen a 400, 401, 404 o 409, y los errores
  inesperados responden 500 sin exponer detalles internos.

## Modelo Entidad–Relación

El modelo conceptual de datos del Hito 2 está en
[docs/MODELO_ENTIDAD_RELACION.md](docs/MODELO_ENTIDAD_RELACION.md).

## Estructura del proyecto

```
src/
  controllers/          rutas HTTP y documentación Swagger
  services/             reglas de negocio
  repositorios/         contratos abstractos de acceso a datos
  repositorios/dummy/   implementaciones en memoria
  dto/                  contratos de entrada y salida
  data/                 fixtures iniciales de la fase dummy
  dominio/              errores de dominio
  common/               request id, logs HTTP y filtro de errores
  configurar-app.ts     configuración compartida por la app y los tests e2e
  main.ts               arranque, variables de entorno y Swagger
test/                   tests end-to-end
docs/                   documentación (modelo entidad–relación)
```

## Flujo Git

- `hito2-dev` es la rama de integración del Hito 2.
- Cada cambio se trabaja en una rama creada desde `hito2-dev`:
  - `feature/*` para funcionalidades,
  - `fix/*` para correcciones,
  - `docs/*` para documentación.
- Los cambios se integran a `hito2-dev` mediante Pull Request, después de
  revisión. No se hace push directo a las ramas de integración.

## Docker y despliegue

El empaquetado con Docker y el despliegue corresponden a la etapa de cierre
del Hito 2.

## Seguridad

- Nunca subas `.env` ni secretos al repositorio. `.env` está en
  `.gitignore`.
- `.env.example` solo contiene valores de ejemplo no sensibles.
