/**
 * Repositorio dummy con estado en memoria que puede volver a sus datos
 * iniciales. Lo usan los tests; no se expone por HTTP.
 */
export interface RepositorioReiniciable {
  reiniciar(): void;
}

/**
 * Copia profunda: el estado del repositorio nunca comparte objetos con los
 * fixtures ni con quien recibe un resultado.
 */
export const copiar = <T>(valor: T): T => structuredClone(valor);
