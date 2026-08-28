import { Injectable } from '@nestjs/common';
import { ColeccionResponseDto } from '../dto/coleccion-response.dto';

/**
 * Looks editoriales usados en "Inspiracion para ti" y en la navegacion de Looks.
 * En Hito 1 la lista vive en memoria dentro de este servicio.
 */
@Injectable()
export class ColeccionesService {
  private readonly colecciones: ColeccionResponseDto[] = [
    {
      id: 1,
      nombre: 'Look urbano',
      descripcion: 'Prendas comodas en tonos neutros para el dia a dia.',
      imagenUrl: 'https://cdn.stylenow.cl/colecciones/look-urbano.jpg',
    },
    {
      id: 2,
      nombre: 'Neutros esenciales',
      descripcion: 'Basicos versatiles que combinan entre si toda la semana.',
      imagenUrl: 'https://cdn.stylenow.cl/colecciones/neutros-esenciales.jpg',
    },
    {
      id: 3,
      nombre: 'Color de temporada',
      descripcion: 'Acentos de color para renovar un conjunto simple.',
      imagenUrl: 'https://cdn.stylenow.cl/colecciones/color-de-temporada.jpg',
    },
    {
      id: 4,
      nombre: 'Fin de semana',
      descripcion: 'Una seleccion relajada para los dias de descanso.',
      imagenUrl: 'https://cdn.stylenow.cl/colecciones/fin-de-semana.jpg',
    },
  ];

  /** Devuelve todos los looks publicados. */
  obtenerColecciones(): ColeccionResponseDto[] {
    return this.colecciones.map((coleccion) => ({ ...coleccion }));
  }
}
