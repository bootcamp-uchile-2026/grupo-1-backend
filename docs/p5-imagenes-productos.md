# P5 — carga y publicación de imágenes

## Diagnóstico y diseño aplicado

Antes de P5 el catálogo guardaba URLs de portada y galería, sin carga, archivos
locales publicados ni volumen. ProductosController tiene @Publico de clase.
Por eso la carga vive en otro controlador administrativo y la lectura de archivos
en un controlador público, sin cambiar las consultas existentes del catálogo.

Se añade sharp 0.35.5, fijado en package/lock. Es necesario decodificar contenido
real y recodificarlo: una extensión, un MIME o unos bytes de firma no bastan.
La versión soporta Node >=20.9, Windows y Linux musl del Dockerfile Node24 Alpine.
No se cambian NestJS ni TypeORM ni se ejecuta audit fix.

Fuentes primarias: [instalación](https://sharp.pixelplumbing.com/install/),
[límites de entrada](https://sharp.pixelplumbing.com/api-constructor/),
[salida sin metadatos](https://sharp.pixelplumbing.com/api-output/).

## Endpoints

| Operación | Acceso y comportamiento |
| --- | --- |
| POST /administracion/productos/:productoId/imagenes | JWT + permiso SQL; multipart con exactamente un campo archivo `imagen` |
| GET /imagenes/productos/:archivo | Público; solo imágenes publicadas y aún asociadas a una galería |
| POST /administracion/imagenes/reconciliacion | JWT + mismo permiso; procesa hasta 100 cargas conocidas |

Ejemplo de respuesta de carga: `{productoId:1,posicion:2,url:"/imagenes/productos/<uuid>.png"}`.
La URL es una referencia relativa al origen de la API; un frontend de otro origen
debe resolverla contra la base de API. Si hay proxy con prefijo, debe conservar
o reescribir estas rutas de forma coherente. No se construyen URLs desde Host
ni desde el nombre recibido del cliente.

Se agrega al array `imagenes` de GET /productos/:id. `imagenUrl` de portada
continúa intacta; no se eliminan ni reemplazan imágenes existentes. El puerto
de catálogo sigue de solo lectura; el nuevo repositorio de imágenes usa las
entidades Producto/ProductoImagen con TypeORM para esta operación administrativa.

Swagger documenta multipart, permiso, límites, respuesta y errores usando el
ErrorResponseDto común. Se agrega un parámetro de ruta de archivo de tipo string;
el test anterior de IDs se ajusta únicamente para excluir ese parámetro y
continúa exigiendo rangos numéricos a los identificadores.

## Autenticación y permiso administrativo

El JWT es obligatorio pero insuficiente. El guard consulta
`permiso_usuario(usuario_id,permiso)` y exige el permiso exacto
`productos.imagenes.gestionar`. La tabla tiene FK al usuario y unicidad por par.
No se siembra ningún administrador ni se ofrece un endpoint para concederse
permisos. El permiso logístico de P4 no concede este permiso.

Un responsable autorizado de la base debe conceder/revocar el permiso al ID de
cuenta aprobado. La operación conceptual parametrizada es:

```sql
INSERT INTO permiso_usuario(usuario_id, permiso)
VALUES (?, 'productos.imagenes.gestionar');
```

Solo el harness concede el permiso a cuentas sintéticas de su base nueva. No
se ejecuta este SQL en bases existentes por iniciar la aplicación. Conceder
permisos a una cuenta real exige autorización específica del responsable.

## Validación y almacenamiento

- Un solo archivo, máximo 5 MiB de entrada y de salida normalizada; sin campos
  de formulario adicionales. Guardas se ejecutan antes del interceptor multipart.
- Firmas JPEG/PNG/WebP como primera barrera; sharp comprueba formato, dimensiones,
  número de páginas y decodifica la imagen completa con failOn warning.
- Máximo 16 millones de píxeles; no animaciones/múltiples páginas.
- Se recodifica en su formato, con autoorientación y sin EXIF/metadatos del cliente.
  El MIME y el nombre originales no deciden el tipo ni el nombre final.
- UUID v4 y extensión derivada del contenido. Escritura `wx` evita sobrescritura;
  sync de contenido antes de confirmar la asociación SQL. Dos procesamientos
  simultáneos por proceso; el exceso responde 503 y no repite negocio solo.
- IMAGENES_DIRECTORIO configura el directorio (por defecto uploads/productos).
  En Docker es /app/uploads/productos bajo el volumen nombrado imagenes_productos.
  Dockerfile prepara el directorio para USER node; uploads se excluye de Git/build.
- Lectura pública por nombre UUID estricto; rechaza traversal y enlaces simbólicos.
  Solo se sirve un archivo regular, con tipo calculado, inline y nosniff. Nombres
  inmutables permiten caché pública; no hay listados de directorio.

## Transacciones, errores y huérfanos

La migración `1795350400000-crear-cargas-imagenes` agrega permiso_usuario y
carga_imagen, después de P4. No modifica migraciones anteriores.

Flujo: validar → reservar registro pendiente SQL → crear archivo exclusivo →
publicar. Publicar bloquea la fila del producto y la carga, calcula la siguiente
posición y confirma ProductoImagen + estado publicada en una sola transacción.
La PK producto/posición sigue protegiendo contra colisiones. No hay reintentos
automáticos. No se afirma atomicidad distribuida entre MySQL y filesystem.

Si falla después de crear un archivo, se comprueba el resultado SQL bajo bloqueo:
una carga ya publicada o referenciada nunca se borra. Si el fallo fue definitivo,
solo se elimina el archivo nuevo de esa solicitud. Si no puede determinarse el
resultado, se conserva el archivo y la reserva para revisión. Si falla abrir el
nombre exclusivo, se marca colisión y no se elimina un archivo preexistente.

Reconciliación: pendientes de más de 15 minutos y fallidas, hasta 100 por llamada.
Primero invalida la reserva bajo bloqueo, impidiendo una publicación tardía, y
después elimina solo el archivo propio regular que coincide en tamaño y SHA256.
No barre el volumen ni elimina archivos desconocidos/publicados. Un archivo
parcial, alterado, enlazado o en colisión requiere revisión; la respuesta indica
cuántos. Es una decisión conservadora para preservar archivos existentes.
La tabla mantiene la trazabilidad; una ejecución repetida es segura.

Los registros de auditoría del sistema no incluyen bytes, nombre original,
cabeceras, tokens ni credenciales. El log de revisión solo contiene el nombre
UUID generado. No se habilitan borrado/reemplazo de imágenes publicadas.

## Dummy, operación y límites

Dummy conserva el catálogo original. La nueva carga persistente requiere MySQL
y devuelve 503 en dummy, aun con JWT; no escribe archivos ni modifica fixtures.
Las URLs remotas anteriores se conservan. No se convierte dummy en un almacén
de imágenes persistente ni se da un fallback a memoria si falla MySQL.

En Windows con Docker Desktop local, desde la raíz:

```powershell
npm run test:mysql:p5
```

El harness crea una DB nueva, pruebas SQL y E2E, imágenes sintéticas y permisos
solo de laboratorio. Reinicia API/MySQL, construye la imagen Docker, carga una
imagen mediante el contenedor no root y recrea el backend con el mismo volumen.
No usa AWS ni una base existente. Detiene sus contenedores y conserva volúmenes.
Credenciales desechables permanecen fuera del backend en carpeta privada.

Backups de producción futuros deben incluir DB y volumen conjuntamente. No usar
`docker compose down -v` si se desea conservar imágenes. Borrar el volumen o
alterar archivos fuera de la aplicación puede dejar referencias sin bytes;
este incremento no puede recuperar archivos perdidos externamente.

La validación reduce entradas malformadas; no sustituye límites de recursos,
cuotas, rate limiting ni actualización de libvips en un despliegue productivo.
Hay dependencia nativa: CI debe comprobar la arquitectura de destino. El estado
de vulnerabilidades heredadas se documenta en la entrega, sin declararlo limpio.
