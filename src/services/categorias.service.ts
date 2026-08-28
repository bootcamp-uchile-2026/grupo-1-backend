import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoriaResponseDto } from '../dto/categoria-response.dto';

/**
 * Categorias del menu principal y de "Categorias populares" de la home.
 * En Hito 1 la lista vive en memoria dentro de este servicio.
 */
@Injectable()
export class CategoriasService {
  private readonly categorias: CategoriaResponseDto[] = [
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

  /**
   * Devuelve las categorias del catalogo.
   * Con destacada=true entrega solo las que se pintan en la home.
   */
  obtenerCategorias(destacada?: string): CategoriaResponseDto[] {
    const filtro = this.aBooleano(destacada);
    return this.categorias
      .filter(
        (categoria) => filtro === undefined || categoria.destacada === filtro,
      )
      .map((categoria) => ({ ...categoria }));
  }

  private aBooleano(valor?: string): boolean | undefined {
    if (valor === undefined || valor === '') return undefined;
    if (valor === 'true') return true;
    if (valor === 'false') return false;
    throw new BadRequestException('destacada debe ser true o false');
  }
}
