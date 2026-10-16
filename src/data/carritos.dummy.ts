import type { CarritoPersistido } from '../repositorios/carritos.repository';

/**
 * Carritos de la fase dummy: uno activo por usuario, ambos vacios.
 * El id del carrito es su identidad propia; que hoy coincida con usuarioId
 * es solo una casualidad de los datos de ejemplo.
 */
export const CARRITOS_DUMMY: CarritoPersistido[] = [
  { id: 1, usuarioId: 1, items: [] },
  { id: 2, usuarioId: 2, items: [] },
];
