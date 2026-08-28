import { Injectable } from '@nestjs/common';
import { PostResponseDto } from '../dto/post-response.dto';

/**
 * Publicaciones de la seccion Comunidad.
 * El wireframe solo muestra tarjetas de lectura, por eso este servicio
 * expone unicamente una consulta.
 */
@Injectable()
export class ComunidadService {
  private readonly posts: PostResponseDto[] = [
    {
      id: 1,
      titulo: 'Como combinar tus basicos de temporada',
      contenido:
        'Tres combinaciones simples para renovar tu closet sin comprar de mas.',
      imagenUrl: 'https://cdn.stylenow.cl/comunidad/basicos-temporada.jpg',
    },
    {
      id: 2,
      titulo: 'Capas para media estacion',
      contenido:
        'Como sumar capas livianas sin perder comodidad en el dia a dia.',
      imagenUrl: 'https://cdn.stylenow.cl/comunidad/capas-media-estacion.jpg',
    },
    {
      id: 3,
      titulo: 'El poder de los accesorios',
      contenido:
        'Pequenos detalles que transforman por completo un conjunto neutro.',
      imagenUrl: 'https://cdn.stylenow.cl/comunidad/poder-accesorios.jpg',
    },
    {
      id: 4,
      titulo: 'Color en tu dia a dia',
      contenido: 'Una guia breve para incorporar los tonos de la temporada.',
      imagenUrl: 'https://cdn.stylenow.cl/comunidad/color-dia-a-dia.jpg',
    },
  ];

  /** Devuelve las publicaciones que se muestran en Comunidad. */
  obtenerPosts(): PostResponseDto[] {
    return this.posts.map((post) => ({ ...post }));
  }
}
