/**
 * Copia profunda: el estado del repositorio nunca comparte objetos con los
 * fixtures ni con quien recibe un resultado.
 */
export const copiar = <T>(valor: T): T => structuredClone(valor);
