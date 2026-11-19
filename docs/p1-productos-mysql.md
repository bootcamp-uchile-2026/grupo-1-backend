# P1: productos, variantes e imágenes

Implementación de laboratorio en `lab/h3-integracion-20261115`. El esquema
consolidado 3FN del 15/11/2026 es un candidato, no una aprobación universal del
modelo comercial. Este incremento representa sin pérdida los datos y contratos
H2 actuales; no incorpora las propuestas UX de ocasión, jerarquía, precio
anterior, reseñas, reservas ni descuento de stock.

## Correspondencia con H2 y el candidato 3FN

| Datos públicos | Representación |
| --- | --- |
| Producto y categoría slug | `producto.categoria_id` → `categoria.id`; slug mediante relación |
| Precio entero CLP | DECIMAL(20,0), conversión explícita a entero JS seguro |
| Portada | `producto.imagen_url`, independiente de la galería |
| Galería | `producto_imagen(producto_id,posicion,url)` |
| Colores y tallas públicos | `producto_color` y `producto_talla`, cada uno por posición |
| Variante | ID global, FK a producto, color, talla, stock y posición |
| Calificación | DOUBLE, conserva el número JS; sin redondeo nuevo |

Las claves y FK siguen el candidato. Se añade `variante.posicion` y unicidad
`(producto_id,posicion)` para preservar el orden de su array; no se impone
unicidad de color/talla ni se genera un producto cartesiano. Las listas admiten
vacíos y valores repetidos. No se equipara portada a primera imagen. Los IDs
son explícitos, sin autoincremento: P1 no introduce endpoints de escritura.
Los textos nuevos usan LONGTEXT para no inventar límites cortos.

Las tablas de colecciones son relaciones independientes en 3FN: sus atributos
dependen de `(producto_id,posicion)`. En variante, tanto ID como el par
producto/posición son claves candidatas. Categoría se referencia por FK, sin
duplicar su slug en producto. No se añaden relaciones producto/colección o
imagen/variante sin un requisito actual.

Precio entero CLP está descrito por los DTO actuales; las cotas SQL aseguran
representación numérica y no son un catálogo de límites comerciales aprobado.
IDs positivos, stock no negativo, booleanos y calificación 0–5 tienen CHECK;
los BIGINT/DECIMAL no se convierten silenciosamente a números imprecisos.
Los importes históricos y las reglas de stock/checkout permanecen intactos.
Nuevas escrituras, reasignación de variantes, borrados, precios fraccionarios
o nuevos límites comerciales requieren una decisión y un incremento separado.

## Adaptador y transacciones

`TypeOrmProductosRepository` implementa los tres métodos del puerto existente.
El selector usa MySQL exclusivamente cuando existe el DataSource configurado;
no captura fallos para devolver fixtures. El repositorio dummy permanece.
Categorías, colecciones y publicaciones continúan SQL; el resto queda en memoria.

Los filtros, normalización, orden y paginación permanecen en ProductosService.
Se cargan las colecciones mediante consultas separadas, ordenadas por posición,
sin multiplicar filas con joins entre arrays. Es un catálogo completo en memoria,
no una optimización para un catálogo grande: la paginación SQL se difiere para
no cambiar la semántica de H2 (incluida comparación de nombres en español).

Las lecturas usan una instantánea REPEATABLE READ o participan del manager de
la unidad de trabajo activa. No hay reintentos automáticos. Se conservan las
limitaciones de AsyncLocalStorage de PR0: un único DataSource lógico, sin
savepoints anidados; todo trabajo debe esperarse antes de salir del callback.
Tareas desacopladas pueden retener managers liberados y el rollback no revierte
efectos externos.

## Migraciones y semillas

M01/S01 se conservan byte a byte. M02 `1794950400000` crea cinco tablas;
S02 `1794950401000` carga tres productos, siete variantes, seis imágenes,
cuatro colores y seis tallas desde un snapshot propio de los fixtures H2.
No importa los fixtures vivos; una prueba verifica equivalencia completa.
Las semillas repetidas no sobrescriben filas existentes. No son una herramienta
de reconciliación: IDs ya ocupados por datos distintos deben investigarse.

MySQL hace commit implícito del DDL; una migración de esquema fallida puede dejar
tablas parciales. No se promete rollback atómico de DDL. Las FK usan RESTRICT;
no se autoriza borrado comercial en cascada. Los `down` revierten el incremento
en laboratorio y eliminan sus tablas/datos: no ejecutarlos sobre datos compartidos.
No hay synchronize ni migrationsRun automáticos al arrancar.

## Reproducción aislada

Desde la raíz: `node test/persistencia/ejecutar-productos-laboratorio.cjs`.
El harness exige Docker local, genera nombres y credenciales exclusivos y no
reutiliza bases. Ejecuta primero las cuatro pruebas SQL originales adaptadas a
la cadena extendida y luego las pruebas P1; después E2E híbridas, persistencia
tras reiniciar API/MySQL, igualdad Swagger y fallo explícito sin fallback.
Los timeouts de integración son 30 segundos en el comando del harness, sin
debilitar aserciones. El harness PR0 original se conserva como antecedente;
para el esquema extendido se usa el de productos.

Las pruebas P1 ejercitan transición PR0→P1, rollback, integridad, valores grandes,
arrays vacíos/duplicados, todas las búsquedas de variantes y paridad HTTP.
El harness conserva el volumen de prueba y detiene su contenedor al terminar.
Evidencias y credenciales quedan fuera del repositorio fuente; no compartir
el directorio privado. No ejecutar estos tests con credenciales de producción.
