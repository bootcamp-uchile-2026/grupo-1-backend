# P3 — carrito, favoritos y confirmación de pedidos

> **Alcance histórico.** Registro del incremento P3. Las referencias a dominios todavía en memoria y a funcionalidades ausentes describen esa etapa, no el backend consolidado P0–P5. Las pruebas citadas no se han repetido con SQL en esta revisión. El estado vigente y los límites de verificación están en [README](../README.md).

Modo MySQL: carritos y líneas, favoritos, pedidos y detalle persisten mediante
los puertos actuales. El guard JWT global de P2 sigue exigiendo autenticación
y coincide el propietario de ruta con el token; POST /pedidos comprueba que
el carrito pertenece al usuario autenticado dentro de la transacción.

M04 `1795150400000` agrega cinco tablas y un carrito vacío por usuario existente.
S04 `1795150401000` copia los pedidos históricos sintéticos de H2, sin descontar
stock histórico. No se modifican M01/S01/M02/S02/M03/S03. El registro incorpora
carrito junto al perfil y credencial dentro de la UoW. M04/S04 son para ejecución
manual; no hay synchronize ni migrationsRun al arrancar.

## Reglas y compatibilidad

- Agregar una variante existente suma cantidad; modificar reemplaza y eliminar
  quita la línea. La PK carrito/variante impide duplicados. Producto se obtiene
  desde la variante, nunca de un producto enviado por el cliente.
- La cola local de H2 se conserva y en MySQL se añade bloqueo de fila del carrito
  durante toda la operación; coordina procesos distintos. No descuenta stock.
- Favoritos conserva 201/409 y el orden de alta; PK usuario/producto y FK a ambos.
  El puerto H2 no tiene DELETE: P3 no incorpora una ruta nueva de borrado.
- Confirmación SQL guarda estado `confirmado`, sin afirmar pago ejecutado. El
  costo de envío sigue en cero. Solo se compran las líneas actuales del carrito.
  Se bloquean carrito, variantes por ID ascendente y productos por ID ascendente;
  se captura el precio del servidor, se comprueba stock y se calculan importes
  exactos con BigInt antes de convertir al rango seguro del contrato HTTP.
- Pedido, detalles con precio/nombre históricos, descuento condicional de stock
  y vaciado del carrito se confirman juntos. Cualquier error revierte todo.
  No hay retry automático del callback ni devolución automática de stock.
- Se conserva el snapshot de contacto/dirección libre H2, validado por los DTO.
  `direccionId` opcional selecciona una dirección SQL del propio usuario y tiene
  prioridad sobre el snapshot de dirección enviado. El cuerpo H2 con dirección
  sigue requerido. No se exige que una dirección libre exista en el perfil:
  esa restricción comercial no formaba parte de H2. No se confía en usuarioId,
  precios ni totales del frontend; campos no admitidos se rechazan.
- `Idempotency-Key` opcional: ASCII alfanumérico y `._:-`, 1–128 caracteres.
  La clave está limitada por usuario; mismo cuerpo devuelve el pedido original,
  incluso después de vaciar el carrito. Distinto cuerpo devuelve 409. Se incluye
  carrito, método, contacto, dirección y direccionId en el hash, sin almacenar
  la cabecera en logs. No se equipara X-Request-Id con idempotencia. No hay
  vencimiento automático de claves; una política de retención queda pendiente.
- Dummy mantiene las reglas H2, incluido no descontar stock e ignorar la clave
  opcional. La equivalencia HTTP no significa igualdad de efectos de inventario:
  P3 autoriza expresamente ese efecto solo para la confirmación SQL.

## Esquema y límites

Usuario es INT UNSIGNED como P2; referencias producto/variante son BIGINT como
P1. Hay PK/FK/UNIQUE y CHECK de cantidad, precios y costo. Cada detalle conserva
producto y variante comprobados por el checkout; no hay FK compuesta que por sí
sola impida un par incoherente insertado manualmente fuera del caso de uso.
Snapshots privados de checkout se guardan como JSON, sin relaciones vivas a
direcciones editables; no aparecen en los DTO públicos de pedido.

Las entidades registran columnas y claves usadas por los adaptadores; índices
y FK físicas son autoridad de M04. No se utiliza schema synchronization ni se
declara drift cero de metadata ORM. No ejecutar synchronize para reconstruirlas.
Los pedidos creados por SQL no se compensan mediante DELETE: la compensación
H2 queda para dummy; SQL usa exclusivamente rollback de UoW.

No se añade cancelación, pagos, reembolsos, tracking ni expiración de carritos.
Conservar limitaciones de ALS de PR0: un DataSource lógico, sin savepoints y sin
tareas desacopladas tras abandonar el callback. DDL MySQL no es atómico; los
down eliminan datos y se prueban únicamente en laboratorio desechable.

## Laboratorio Windows

Desde la raíz del backend, con Docker Desktop local en ejecución:

```powershell
npm run test:mysql:p3
```

Equivalente: `node test/persistencia/ejecutar-comercio-laboratorio.cjs`.
El harness crea nombres, usuario, credenciales y base nuevos aleatorios; no usa
bases existentes ni las credenciales DB para elegir una base compartida. Guarda
evidencia fuera del backend, detiene su contenedor y conserva el volumen.
Las credenciales desechables quedan en una carpeta privada externa: no compartir.

Ejecuta migraciones desde vacío, transición P2→P3 sintética, pruebas SQL P3,
las E2E existentes en modo híbrido, Swagger dummy/mysql, reinicios de API/MySQL
y ausencia de fallback. Los helpers de reinicio borran datos solo bajo la guarda
del laboratorio exclusivo; no son scripts de mantenimiento de bases reales.
