import type { Categoria } from '../../../src/dominio/modelos';

/**
 * Categorias del catalogo, en el orden del menu principal.
 * Los productos dummy referencian estas categorias mediante su slug.
 * Una categoria existe aunque hoy no tenga productos, como calzado.
 */
export const CATEGORIAS_DUMMY: Categoria[] = [
  {
    id: 1,
    nombre: 'Mujer',
    slug: 'mujer',
    imagenUrl: 'https://cdn.stylenow.cl/categorias/mujer.jpg',
    destacada: true,
  },
  {
    id: 2,
    nombre: 'Hombre',
    slug: 'hombre',
    imagenUrl: 'https://cdn.stylenow.cl/categorias/hombre.jpg',
    destacada: true,
  },
  {
    id: 3,
    nombre: 'Accesorios',
    slug: 'accesorios',
    imagenUrl: 'https://cdn.stylenow.cl/categorias/accesorios.jpg',
    destacada: true,
  },
  {
    id: 4,
    nombre: 'Calzado',
    slug: 'calzado',
    imagenUrl: 'https://cdn.stylenow.cl/categorias/calzado.jpg',
    destacada: false,
  },
];
