import type { ProductoDetalle } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { PRODUCTOS_DUMMY } from '../../data/productos.dummy';

import {
  ProductosRepository,
  VarianteConProducto,
} from '../productos.repository';
import { copiar } from './reiniciable';

/** Solo lectura: no tiene estado propio que reiniciar. */
@Injectable()
export class DummyProductosRepository extends ProductosRepository {
  listar(): Promise<ProductoDetalle[]> {
    return Promise.resolve(copiar(PRODUCTOS_DUMMY));
  }

  buscarPorId(id: number): Promise<ProductoDetalle | null> {
    const producto = PRODUCTOS_DUMMY.find((item) => item.id === id);
    return Promise.resolve(producto ? copiar(producto) : null);
  }

  buscarVariante(varianteId: number): Promise<VarianteConProducto | null> {
    for (const producto of PRODUCTOS_DUMMY) {
      const variante = producto.variantes.find(
        (item) => item.id === varianteId,
      );
      if (variante) {
        return Promise.resolve({
          producto: copiar(producto),
          variante: copiar(variante),
        });
      }
    }
    return Promise.resolve(null);
  }
}
