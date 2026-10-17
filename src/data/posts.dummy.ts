import { PostResponseDto } from '../dto/post-response.dto';

/** Publicaciones de la seccion Comunidad en la fase dummy. */
export const POSTS_DUMMY: PostResponseDto[] = [
  {
    id: 1,
    titulo: 'Como combinar tus basicos de temporada',
    contenido:
      'Tres combinaciones simples para renovar tu closet sin comprar de mas.',
    imagenUrl: 'https://cdn.stylenow.cl/comunidad/basicos-temporada.jpg',
  },
  {
    id: 2,
    titulo: 'Guia rapida para cuidar el lino',
    contenido:
      'Lavado en frio, secado a la sombra y plancha tibia para que dure mas.',
    imagenUrl: 'https://cdn.stylenow.cl/comunidad/cuidado-lino.jpg',
  },
  {
    id: 3,
    titulo: 'Accesorios que cambian un look',
    contenido:
      'Un bolso o un cinturon pueden transformar la misma tenida en otra.',
    imagenUrl: 'https://cdn.stylenow.cl/comunidad/accesorios.jpg',
  },
];
