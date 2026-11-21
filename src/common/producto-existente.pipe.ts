import { Injectable, PipeTransform } from '@nestjs/common';
import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { ProductosService } from '../services/productos.service';

/** Resuelve una lectura publica sin repetir la consulta en el controller. */
@Injectable()
export class ProductoExistentePipe implements PipeTransform<
  number,
  Promise<ProductoDetalleResponseDto>
> {
  constructor(private readonly productos: ProductosService) {}
  transform(id: number): Promise<ProductoDetalleResponseDto> {
    return this.productos.obtenerProductoPorId(id);
  }
}
