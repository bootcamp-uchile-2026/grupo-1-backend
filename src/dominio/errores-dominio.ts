/**
 * Errores de dominio de StyleNow.
 * Expresan que una operacion de negocio no se puede realizar, sin saber nada
 * de HTTP: no tienen status ni dependen de Nest. Los traduce a una respuesta
 * HTTP el filtro global de excepciones; desde otro punto de entrada (un
 * worker, un CLI, un test) se pueden manejar sin HTTP.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Lo que se pide no existe, o no es visible para quien lo pide. */
export class RecursoNoEncontradoError extends DomainError {}

/** La operacion choca con el estado actual de un recurso. */
export class ConflictoDominioError extends DomainError {}

/** Los datos son validos en forma, pero la operacion viola una regla. */
export class ReglaNegocioError extends DomainError {}

/** Correo o contrasena no corresponden a una cuenta. */
export class CredencialesInvalidasError extends DomainError {}
