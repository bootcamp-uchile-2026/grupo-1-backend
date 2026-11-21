import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import type { ProductoDetalle } from '../dominio/modelos';
import { ProductosRepository } from '../repositorios/productos.repository';
import { ProductosService } from '../services/productos.service';
import { ProductoExistentePipe } from './producto-existente.pipe';

describe('ProductoExistentePipe', () => {
  const buscarPorId = jest.fn();
  const repository: ProductosRepository = {
    listar: jest.fn(),
    buscarPorId,
    buscarVariante: jest.fn(),
  };
  const pipe = new ProductoExistentePipe(new ProductosService(repository));
  beforeEach(() => jest.resetAllMocks());
  it('devuelve el producto resuelto con una sola lectura del puerto', async () => {
    const producto: ProductoDetalle = {
      id: 1,
      nombre: 'Lab',
      precio: 1,
      imagenUrl: '',
      categoria: 'lab',
      novedad: false,
      oferta: false,
      descripcion: 'Lab',
      imagenes: [],
      calificacion: 0,
      colores: [],
      tallas: [],
      guiaTallas: '',
      variantes: [],
    };
    buscarPorId.mockResolvedValue(producto);
    expect(await pipe.transform(1)).toEqual(producto);
    expect(buscarPorId).toHaveBeenCalledTimes(1);
    expect(buscarPorId).toHaveBeenCalledWith(1);
  });
  it('conserva el error de dominio de inexistencia para el filtro HTTP 404', async () => {
    buscarPorId.mockResolvedValue(null);
    await expect(pipe.transform(999)).rejects.toBeInstanceOf(
      RecursoNoEncontradoError,
    );
    expect(buscarPorId).toHaveBeenCalledTimes(1);
  });
  it('propaga un fallo SQL sin fallback ni una segunda lectura', async () => {
    const error = new Error('SQL no disponible');
    buscarPorId.mockRejectedValue(error);
    await expect(pipe.transform(1)).rejects.toBe(error);
    expect(buscarPorId).toHaveBeenCalledTimes(1);
  });
});
