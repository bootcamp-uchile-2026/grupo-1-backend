# Endpoints H3 vigentes

Extraídos de todos los controllers del backend. No hay prefijo global /api: /api y /api-json son documentación. No sustituye DTO ni respuestas de Swagger; no se agregaron aliases durante el cierre.

| Método | Ruta                                                           | Acceso                                      | Fuente                                                 |
| ------ | -------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| GET    | /usuarios/:usuarioId/alertas                                   | JWT + propiedad/permisos cuando corresponde | src/controllers/alertas.controller.ts:61               |
| POST   | /usuarios/:usuarioId/alertas/precio                            | JWT + propiedad/permisos cuando corresponde | src/controllers/alertas.controller.ts:73               |
| POST   | /usuarios/:usuarioId/alertas/reposicion                        | JWT + propiedad/permisos cuando corresponde | src/controllers/alertas.controller.ts:91               |
| DELETE | /usuarios/:usuarioId/alertas/:alertaId                         | JWT + propiedad/permisos cuando corresponde | src/controllers/alertas.controller.ts:110              |
| POST   | /auth/registro                                                 | Público                                     | src/controllers/auth.controller.ts:24                  |
| POST   | /auth/login                                                    | Público                                     | src/controllers/auth.controller.ts:61                  |
| POST   | /auth/logout                                                   | Público                                     | src/controllers/auth.controller.ts:94                  |
| POST   | /usuarios/:usuarioId/pedidos/:pedidoId/cambios-devoluciones    | JWT + propiedad/permisos cuando corresponde | src/controllers/cambios-devoluciones.controller.ts:43  |
| GET    | /usuarios/:usuarioId/pedidos/:pedidoId/cambios-devoluciones    | JWT + propiedad/permisos cuando corresponde | src/controllers/cambios-devoluciones.controller.ts:94  |
| GET    | /usuarios/:usuarioId/cambios-devoluciones/:solicitudId         | JWT + propiedad/permisos cuando corresponde | src/controllers/cambios-devoluciones.controller.ts:125 |
| GET    | /usuarios/:usuarioId/cambios-devoluciones/:solicitudId/eventos | JWT + propiedad/permisos cuando corresponde | src/controllers/cambios-devoluciones.controller.ts:155 |
| GET    | /usuarios/:usuarioId/carrito                                   | JWT + propiedad/permisos cuando corresponde | src/controllers/carrito.controller.ts:44               |
| POST   | /usuarios/:usuarioId/carrito/items                             | JWT + propiedad/permisos cuando corresponde | src/controllers/carrito.controller.ts:80               |
| PATCH  | /usuarios/:usuarioId/carrito/items/:varianteId                 | JWT + propiedad/permisos cuando corresponde | src/controllers/carrito.controller.ts:123              |
| DELETE | /usuarios/:usuarioId/carrito/items/:varianteId                 | JWT + propiedad/permisos cuando corresponde | src/controllers/carrito.controller.ts:174              |
| GET    | /categorias                                                    | Público                                     | src/controllers/categorias.controller.ts:26            |
| GET    | /colecciones                                                   | Público                                     | src/controllers/colecciones.controller.ts:19           |
| GET    | /posts                                                         | Público                                     | src/controllers/comunidad.controller.ts:19             |
| GET    | /usuarios/:usuarioId/direcciones                               | JWT + propiedad/permisos cuando corresponde | src/controllers/direcciones.controller.ts:59           |
| POST   | /usuarios/:usuarioId/direcciones                               | JWT + propiedad/permisos cuando corresponde | src/controllers/direcciones.controller.ts:71           |
| PATCH  | /usuarios/:usuarioId/direcciones/:direccionId                  | JWT + propiedad/permisos cuando corresponde | src/controllers/direcciones.controller.ts:84           |
| DELETE | /usuarios/:usuarioId/direcciones/:direccionId                  | JWT + propiedad/permisos cuando corresponde | src/controllers/direcciones.controller.ts:111          |
| GET    | /usuarios/:usuarioId/favoritos                                 | JWT + propiedad/permisos cuando corresponde | src/controllers/favoritos.controller.ts:28             |
| POST   | /usuarios/:usuarioId/favoritos                                 | JWT + propiedad/permisos cuando corresponde | src/controllers/favoritos.controller.ts:51             |
| POST   | /operaciones/pedidos/:pedidoId/envio                           | JWT + propiedad/permisos cuando corresponde | src/controllers/logistica.controller.ts:110            |
| PATCH  | /operaciones/pedidos/:pedidoId/envio                           | JWT + propiedad/permisos cuando corresponde | src/controllers/logistica.controller.ts:127            |
| GET    | /usuarios/:usuarioId/pedidos/:pedidoId/seguimiento             | JWT + propiedad/permisos cuando corresponde | src/controllers/logistica.controller.ts:145            |
| POST   | /usuarios/:usuarioId/pedidos/:pedidoId/cancelacion             | JWT + propiedad/permisos cuando corresponde | src/controllers/logistica.controller.ts:163            |
| GET    | /looks                                                         | Público                                     | src/controllers/looks.controller.ts:39                 |
| GET    | /looks/:lookId                                                 | Público                                     | src/controllers/looks.controller.ts:52                 |
| POST   | /looks                                                         | JWT + propiedad/permisos cuando corresponde | src/controllers/looks.controller.ts:72                 |
| POST   | /usuarios/:usuarioId/looks                                     | JWT + propiedad/permisos cuando corresponde | src/controllers/looks.controller.ts:97                 |
| POST   | /pedidos                                                       | JWT + propiedad/permisos cuando corresponde | src/controllers/pedidos.controller.ts:39               |
| GET    | /usuarios/:usuarioId/pedidos                                   | JWT + propiedad/permisos cuando corresponde | src/controllers/pedidos.controller.ts:83               |
| GET    | /usuarios/:usuarioId/pedidos/:pedidoId                         | JWT + propiedad/permisos cuando corresponde | src/controllers/pedidos.controller.ts:110              |
| GET    | /productos                                                     | Público                                     | src/controllers/productos.controller.ts:25             |
| GET    | /productos/:id                                                 | Público                                     | src/controllers/productos.controller.ts:54             |
| GET    | /usuarios/:usuarioId                                           | JWT + propiedad/permisos cuando corresponde | src/controllers/usuarios.controller.ts:56              |
| PATCH  | /usuarios/:usuarioId                                           | JWT + propiedad/permisos cuando corresponde | src/controllers/usuarios.controller.ts:68              |
| PATCH  | /usuarios/:usuarioId/contrasena                                | JWT + propiedad/permisos cuando corresponde | src/controllers/usuarios.controller.ts:86              |
| POST   | /administracion/productos/:productoId/imagenes                 | JWT + propiedad/permisos cuando corresponde | src/imagenes/imagenes.controller.ts:55                 |
| POST   | /administracion/imagenes/reconciliacion                        | JWT + propiedad/permisos cuando corresponde | src/imagenes/imagenes.controller.ts:126                |
| GET    | /imagenes/productos/:archivo                                   | Público                                     | src/imagenes/imagenes.controller.ts:141                |

El pipe ProductoExistentePipe valida GET /productos/:id mediante ProductosService y el puerto TypeORM. La consulta se reutiliza: 400 para id inválido y 404 para ausencia. Las imágenes públicas comprueban además su estado de publicación.
