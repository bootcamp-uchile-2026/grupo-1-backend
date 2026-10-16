import { ColeccionResponseDto } from '../dto/coleccion-response.dto';

/**
 * Colecciones editoriales de la fase dummy ("Inspiracion para ti").
 * Son contenido independiente de los looks de /looks: solo tienen titulo,
 * texto e imagen, sin productos ni precios.
 */
export const COLECCIONES_DUMMY: ColeccionResponseDto[] = [
  {
    id: 1,
    nombre: 'Look urbano',
    descripcion: 'Prendas comodas en tonos neutros para el dia a dia.',
    imagenUrl: 'https://cdn.stylenow.cl/colecciones/look-urbano.jpg',
  },
  {
    id: 2,
    nombre: 'Primavera en lino',
    descripcion: 'Telas livianas y colores claros para los dias de sol.',
    imagenUrl: 'https://cdn.stylenow.cl/colecciones/primavera-lino.jpg',
  },
  {
    id: 3,
    nombre: 'Oficina relajada',
    descripcion: 'Camisas y basicos que van de la reunion al after office.',
    imagenUrl: 'https://cdn.stylenow.cl/colecciones/oficina-relajada.jpg',
  },
];
