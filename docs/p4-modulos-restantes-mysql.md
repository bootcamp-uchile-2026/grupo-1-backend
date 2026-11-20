# P4 — módulos restantes y logística

> **Alcance histórico.** Registro del incremento P4. Las referencias a dominios todavía en memoria y a funcionalidades ausentes describen esa etapa, no el backend consolidado P0–P5. Las pruebas citadas no se han repetido con SQL en esta revisión. El estado vigente y los límites de verificación están en [README](../README.md).

Implementación de laboratorio del 18/11/2026. Los trece puertos comerciales
existentes tienen adaptador SQL. En modo MySQL los proveedores dummy devuelven
null: no se crean sus estados en memoria y ninguna operación los utiliza.
En modo dummy se conservan los contratos H2/P2/P3; logística devuelve 503 porque
requiere persistencia transaccional. No hay fallback ante errores SQL.

## Alertas y looks

Alertas: precio, reposición por producto o variante, dueño y estado persisten.
Las FK comprueban usuario/producto y el par variante/producto; CHECK valida
tipo, estado y exclusividad de atributos. H2 permite varias alertas iguales:
no se inventó una unicidad comercial. Eliminar siempre filtra por dueño.

Looks: cabecera con creador autenticado, nombre y precio de creación; ocurrencias
por posición con FK variante y guardados por par usuario/look. Se mantienen
repeticiones y orden. El creador de los fixtures editoriales es NULL; no se les
asigna un propietario ficticio. El contrato existente mantiene GET /looks y
GET /looks/:id públicos y también permite leer el look recién creado. No se
añadieron borradores privados, publicación automática en comunidad ni permisos
de edición/eliminación. Crear y guardar son operaciones separadas. Publicar
en comunidad requiere una futura decisión de contrato/visibilidad; el puerto
de publicaciones actual solo tiene lectura editorial y ya era SQL desde PR0.
No se inventó una relación entre posts editoriales y looks.

## Logística y autorización

Estados: PENDING → PREPARING → SHIPPED → DELIVERED. PENDING y PREPARING sin
despacho pueden pasar a CANCELLED; ambos estados terminales impiden nuevas
transiciones. Cada evento registra anterior, nuevo, fecha y actor. No hay
transportistas ni notificaciones externas.

La autorización operativa usa `LOGISTICA_OPERADORES_IDS`, lista explícita de IDs
de cuentas autorizadas por el responsable del entorno, separada por comas,
sin espacios. Vacía por defecto: todos los clientes JWT reciben 403 en las
operaciones. No se asigna este permiso al registrarse ni desde un body/token
emitido por el frontend. El operador debe autenticarse mediante el JWT de P2;
la lista no reemplaza el token. No se añaden cuentas/contraseñas administrativas
semilla. Esta es una capacidad configurada del entorno, no un sistema de gestión
de roles, y su administración requiere autorización externa.

Hay un único envío por pedido en este incremento; la unicidad impide envíos
activos duplicados. No se implementan reenvíos ni envíos parciales. El checkout
nuevo crea PENDING y un evento de creación junto al descuento y pedido en su
transacción; eso no acredita un despacho. Las migraciones no crean envíos ni
eventos logísticos para pedidos históricos. Un operador explícitamente autorizado
puede crear PENDING para un pedido confirmado, registrando el actor.

Los estados comercial y logístico siguen separados. DELIVERED logístico no
reescribe automáticamente el estado comercial confirmado: esa relación no
estaba cerrada. CANCELLED operativo solo cancela el envío, no el pedido ni stock.

## Cancelación comercial RN-H3-PED-001

Solo el dueño autenticado cancela un pedido confirmado antes del despacho.
Se bloquea primero pedido, luego envío y evidencia de inventario, y las variantes
en orden ascendente. Despachar toma los mismos bloqueos pedido/envío, por lo que
solo una de las dos operaciones puede ganar la carrera.

El checkout nuevo registra `inventario_pedido` dentro de la misma transacción del
descuento. La cancelación compensa esas cantidades una vez, marca la evidencia
como restituida, pone el pedido en cancelado, el envío en CANCELLED y registra
fecha/actor/motivo. La PK de cancelación y el bloqueo del pedido hacen repetible
la solicitud: devuelve la primera cancelación sin otro evento ni restitución;
se conserva el motivo original aunque el reintento envíe otro.

No se infiere evidencia para pedidos históricos P3 o sembrados. Si un operador
creó su envío PENDING, se permite cancelar sin devolver stock cuando no hay
débitos registrados. Sin envío no hay evidencia logística suficiente y se responde
409. Un envío cancelado previamente de forma operativa no autoriza por sí solo
la cancelación comercial: su coordinación posterior queda pendiente. No se
reembolsa dinero ni se presupone pago verificado.

## Cambios/devoluciones y decisiones aisladas

Se conservan las rutas H2 de una línea y los estados solicitada/aprobada/rechazada/
completada. Las FK incluyen el par pedido_item/pedido para impedir referencias
cruzadas. Cambiar comprueba una variante distinta del mismo producto.
La fecha nueva es real UTC; la fecha fija del dummy continúa solo en dummy.

POST acepta `Idempotency-Key` opcional (ASCII alfanumérico y `._:-`, 1–128).
Misma clave/usuario/cuerpo devuelve la solicitud inicial; cuerpo diferente da
409. Sin clave H2 admite varias solicitudes y se conserva esa semántica: no se
inventan cantidades parciales, ventanas ni reserva acumulada de elegibilidad.
Cada alta registra un evento; el historial propio devuelve estado/fecha/resolución,
sin datos privados del checkout. Un pedido comercialmente cancelado se rechaza.

Se distingue registrar una solicitud de aprobarla o ejecutarla. H2 permite
solicitar incluso con pedido comercial confirmado: se conserva la recepción
legada, sin afirmar elegibilidad de devolución antes de entrega. La regla de
elegibilidad futura y las transiciones/actores de resolución no están aprobadas;
no hay endpoint público para aprobar/completar solicitudes. La tabla de eventos
tiene resolución para las futuras actuaciones autorizadas. Las resoluciones
semilla se etiquetan como sintéticas, sin reembolso ni actuación real.

## Operaciones añadidas

| Método | Ruta | Autoridad |
| --- | --- | --- |
| POST | /operaciones/pedidos/:pedidoId/envio | JWT + lista operativa explícita |
| PATCH | /operaciones/pedidos/:pedidoId/envio | JWT + lista; body estado |
| GET | /usuarios/:usuarioId/pedidos/:pedidoId/seguimiento | Dueño JWT |
| POST | /usuarios/:usuarioId/pedidos/:pedidoId/cancelacion | Dueño JWT; motivo opcional |
| GET | /usuarios/:usuarioId/cambios-devoluciones/:solicitudId/eventos | Dueño JWT |

OpenAPI agrega cinco operaciones, cuatro paths: 40 operaciones/32 paths. Las
rutas existentes continúan; postventa agrega la cabecera opcional de idempotencia.
403 operativo, 409 de transición/estado y 503 en modo dummy son explícitos.

## Migraciones, pruebas y operación

Cinco migraciones nuevas 1795250400000 a 1795250404000, posteriores a S04:
alertas, looks, logística, postventa y semilla sintética compatible. Se añaden
once tablas (28 en total incluyendo migrations), claves/índices/CHECK y dos
índices únicos auxiliares en variante y pedido_item para sus FK compuestas.
Las ocho migraciones originales son inmutables. Las entidades EntitySchema
registran las columnas; las restricciones físicas son autoridad de las migraciones.
No se declara drift cero de metadata; synchronize y migrationsRun permanecen false.

El DDL MySQL tiene commits implícitos. Down es destructivo y solo se probó en
una base desechable nueva. No ejecutar con datos compartidos o productivos.
ALS conserva un DataSource lógico, sin savepoints y sin callbacks desacoplados.
No hay reintentos de negocio automáticos.

Con Docker Desktop local en Windows, desde la raíz:

```powershell
npm run test:mysql:p4
```

El harness crea recursos y credenciales únicos, ejecuta SQL y las E2E existentes
en MySQL, compara Swagger y comprueba persistencia después de reinicios y fallo
explícito sin DB. Detiene su contenedor y conserva el volumen. Evidencia fuera
del backend; credenciales en una carpeta privada externa que no debe compartirse.
