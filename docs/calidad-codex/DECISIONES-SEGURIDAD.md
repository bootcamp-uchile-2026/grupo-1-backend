# Alcance histórico: decisiones C1–C4

Este registro describe una base anterior a SQL-02/03/04. El backend vigente
rechaza dummy y requiere MySQL antes de escuchar HTTP. Las propuestas de
conservar dummy que siguen a continuación no se implementan en el cierre
SQL-only. Ver README y docs/ENTREGA_H3.md para el estado vigente.

# Decisiones de seguridad pendientes

## Configuración de producción

El código vigente admite NODE_ENV=production con PERSISTENCIA=dummy.
Esta fase no modifica ese comportamiento.

Propuesta: validar al arrancar que producción use mysql y rechazar explícitamente
la combinación con dummy. Impacto: los despliegues que hoy arrancan con datos de
demostración dejarían de iniciar; necesitarían conexión, esquema y configuración
SQL aprobados. El modo dummy seguiría disponible fuera de producción.

Antes de aplicar: inventariar entornos, aprobar el cambio de configuración,
preparar pruebas aisladas de arranque y verificar que ningún laboratorio depende
de NODE_ENV=production para probar memoria. No cambiar valores ni acceder a AWS
como parte de esta propuesta.

## Protección de login y registro

No existe limitación de intentos en las rutas actuales. Scrypt consume recursos
por solicitud y la cola de registro tampoco constituye una política antiabuso.

Propuesta para aprobación:

- Presupuesto por origen de red y por identificador de cuenta normalizado,
  sin registrar el correo, contraseña, token ni cuerpo de autenticación.
- Límite de concurrencia y cola acotada para trabajo de hashing.
- Política compartida entre instancias si el entorno tiene más de un proceso;
  un contador local no representa una limitación global.
- Respuestas de rechazo y recuperación definidas, sin revelar existencia de cuenta.
- Acordar configuración de proxy antes de confiar en cabeceras de dirección cliente.

Definir umbrales, ventanas, recuperación y eventual respuesta 429/Retry-After.
Eso requiere aprobación de comportamiento público y evaluación de implementación.
No se añade ninguna dependencia ni se implementa esta protección en C3.

## Contraseñas nuevas

La política preliminar recibida es 8–128 caracteres para registro y cambio.
No se aplica al login ni se endurecen DTO en esta fase: cambia entradas aceptadas
y no se ha verificado compatibilidad con cuentas SQL, que están fuera de alcance.
El hash no permite recuperar la longitud de la contraseña original.
Se necesita aprobar la política definitiva y el procedimiento de compatibilidad.

## Otros puntos conservados

Revocación de JWT, refresh tokens y recuperación de contraseña siguen sin
implementar. Los permisos administrativos existentes permanecen iguales.
No se modifican licencia, autores Git ni declaraciones académicas.
