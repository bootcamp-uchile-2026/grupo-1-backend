import { CategoriaResponseDto } from '../dto/categoria-response.dto';

/**
 * Categorias del catalogo, en el orden del menu principal.
 * Es la unica fuente de verdad de los slugs: producto.categoria debe ser el
 * slug de una de estas categorias (lo comprueba dummy-coherencia.spec.ts).
 * Una categoria existe aunque hoy no tenga productos, como calzado.
 */
export const CATEGORIAS_DUMMY: CategoriaResponseDto[] = [
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
