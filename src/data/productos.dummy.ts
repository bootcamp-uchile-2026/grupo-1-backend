import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';

const GUIA_TALLAS = 'https://www.stylenow.cl/ayuda/guia-de-tallas';

/**
 * Catalogo dummy. Es la unica fuente de verdad de productos, variantes y
 * precios: looks, alertas, pedidos y cambios referencian estos ids y
 * ninguno guarda una copia propia del precio.
 * El id de una variante es unico en todo el catalogo.
 */
export const PRODUCTOS_DUMMY: ProductoDetalleResponseDto[] = [
  {
    id: 1,
    nombre: 'Vestido de lino blanco',
    precio: 39990,
    imagenUrl: 'https://cdn.stylenow.cl/productos/vestido-lino-blanco.jpg',
    categoria: 'mujer',
    novedad: true,
    oferta: false,
    descripcion:
      'Vestido midi de lino blanco, ligero y pensado para temporada primavera-verano.',
    imagenes: [
      'https://cdn.stylenow.cl/productos/vestido-lino-blanco-1.jpg',
      'https://cdn.stylenow.cl/productos/vestido-lino-blanco-2.jpg',
    ],
    calificacion: 4.6,
    colores: ['Blanco'],
    tallas: ['S', 'M', 'L'],
    guiaTallas: GUIA_TALLAS,
    variantes: [
      { id: 101, color: 'Blanco', talla: 'S', stock: 4 },
      { id: 102, color: 'Blanco', talla: 'M', stock: 3 },
      { id: 103, color: 'Blanco', talla: 'L', stock: 2 },
    ],
  },
  {
    id: 2,
    nombre: 'Camisa oxford celeste',
    precio: 29990,
    imagenUrl: 'https://cdn.stylenow.cl/productos/camisa-oxford-celeste.jpg',
    categoria: 'hombre',
    novedad: false,
    oferta: false,
    descripcion:
      'Camisa oxford de algodon, corte regular, para oficina o fin de semana.',
    imagenes: [
      'https://cdn.stylenow.cl/productos/camisa-oxford-celeste-1.jpg',
      'https://cdn.stylenow.cl/productos/camisa-oxford-celeste-2.jpg',
    ],
    calificacion: 4.4,
    colores: ['Celeste'],
    tallas: ['M', 'L'],
    guiaTallas: GUIA_TALLAS,
    variantes: [
      { id: 201, color: 'Celeste', talla: 'M', stock: 6 },
      { id: 202, color: 'Celeste', talla: 'L', stock: 5 },
    ],
  },
  {
    id: 3,
    nombre: 'Bolso tote de lona',
    precio: 24990,
    imagenUrl: 'https://cdn.stylenow.cl/productos/bolso-tote-lona.jpg',
    categoria: 'accesorios',
    novedad: false,
    oferta: true,
    descripcion:
      'Bolso tote de lona resistente con asas largas y bolsillo interior.',
    imagenes: [
      'https://cdn.stylenow.cl/productos/bolso-tote-lona-1.jpg',
      'https://cdn.stylenow.cl/productos/bolso-tote-lona-2.jpg',
    ],
    calificacion: 4.2,
    colores: ['Beige', 'Negro'],
    tallas: ['Unica'],
    guiaTallas: GUIA_TALLAS,
    variantes: [
      { id: 301, color: 'Beige', talla: 'Unica', stock: 8 },
      { id: 302, color: 'Negro', talla: 'Unica', stock: 0 },
    ],
  },
];
