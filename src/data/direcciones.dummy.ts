import { DireccionResponseDto } from '../dto/direccion-response.dto';

/**
 * Direccion tal como vive en la fase dummy: el contrato HTTP mas su dueno.
 * usuarioId equivale a la clave foranea que tendra la tabla.
 */
export interface DireccionDummy {
  usuarioId: number;
  direccion: DireccionResponseDto;
}

export const DIRECCIONES_DUMMY: DireccionDummy[] = [
  {
    usuarioId: 1,
    direccion: {
      id: 1,
      nombre: 'Casa',
      calle: 'Av. Providencia',
      numero: '1234',
      departamento: 'Depto 502',
      comuna: 'Providencia',
      region: 'Region Metropolitana',
      principal: true,
    },
  },
  {
    usuarioId: 1,
    direccion: {
      id: 2,
      nombre: 'Oficina',
      calle: 'Av. Apoquindo',
      numero: '4501',
      comuna: 'Las Condes',
      region: 'Region Metropolitana',
      principal: false,
    },
  },
  {
    usuarioId: 2,
    direccion: {
      id: 3,
      nombre: 'Casa',
      calle: 'Av. Alemania',
      numero: '850',
      comuna: 'Temuco',
      region: 'Region de La Araucania',
      principal: true,
    },
  },
];

/** Id de la primera direccion creada; las siguientes reciben ids consecutivos. */
export const DIRECCION_NUEVA_ID = 4;
