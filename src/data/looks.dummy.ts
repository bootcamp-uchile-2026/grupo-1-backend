import { LookResponseDto } from '../dto/look-response.dto';

/**
 * Looks publicados que se pueden explorar y guardar.
 * Cada producto y variante existe en el catalogo dummy, y precioTotal es la
 * suma de los precios de catalogo de sus productos.
 */
export const LOOKS_DUMMY: LookResponseDto[] = [
  {
    id: 1,
    nombre: 'Look urbano',
    productos: [
      { productoId: 1, varianteId: 101 },
      { productoId: 2, varianteId: 201 },
    ],
    precioTotal: 69980,
  },
  {
    id: 2,
    nombre: 'Neutros esenciales',
    productos: [
      { productoId: 1, varianteId: 102 },
      { productoId: 3, varianteId: 301 },
    ],
    precioTotal: 64980,
  },
  {
    id: 3,
    nombre: 'Fin de semana',
    productos: [
      { productoId: 2, varianteId: 202 },
      { productoId: 3, varianteId: 302 },
    ],
    precioTotal: 54980,
  },
];

/** Id del primer look creado; los siguientes reciben ids consecutivos. */
export const LOOK_NUEVO_ID = 4;
