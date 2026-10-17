import { Injectable } from '@nestjs/common';
import { RecursoNoEncontradoError } from '../dominio/errores-dominio';
import { CrearLookDto } from '../dto/crear-look.dto';
import { GuardarLookDto } from '../dto/guardar-look.dto';
import { LookResponseDto } from '../dto/look-response.dto';
import { LooksPaginadosResponseDto } from '../dto/looks-paginados-response.dto';
import { LooksRepository } from '../repositorios/looks.repository';
import { ProductosService } from './productos.service';
import { UsuariosService } from './usuarios.service';

/**
 * Looks: conjuntos de productos que se exploran, se componen y se guardan.
 * Un look solo puede contener productos y variantes del catalogo.
 */
@Injectable()
export class LooksService {
  constructor(
    private readonly looks: LooksRepository,
    private readonly usuariosService: UsuariosService,
    private readonly productosService: ProductosService,
  ) {}

  /** Devuelve la pagina solicitada del listado de looks. */
  async obtenerLooks(
    pagina: number,
    limite: number,
  ): Promise<LooksPaginadosResponseDto> {
    const { looks, total } = await this.looks.listarPagina(
      (pagina - 1) * limite,
      limite,
    );
    return { looks, pagina, limite, total };
  }

  /** Devuelve el detalle de un look. */
  async obtenerLook(lookId: number): Promise<LookResponseDto> {
    const look = await this.looks.buscarPorId(lookId);
    if (!look) {
      throw new RecursoNoEncontradoError(`No existe el look con id ${lookId}`);
    }
    return look;
  }

  /**
   * Compone un look nuevo.
   * Cada variante debe pertenecer a su producto; el precio total se calcula
   * con los precios del catalogo.
   */
  async crearLook(datos: CrearLookDto): Promise<LookResponseDto> {
    let precioTotal = 0;
    const productos: LookResponseDto['productos'] = [];
    for (const item of datos.productos) {
      const { producto, variante } =
        await this.productosService.obtenerVarianteDeProducto(
          item.productoId,
          item.varianteId,
        );
      precioTotal += producto.precio;
      productos.push({ productoId: producto.id, varianteId: variante.id });
    }
    return this.looks.crear({ nombre: datos.nombre, productos, precioTotal });
  }

  /** Guarda un look existente en la cuenta del usuario. */
  async guardarLook(
    usuarioId: number,
    datos: GuardarLookDto,
  ): Promise<LookResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const look = await this.obtenerLook(datos.lookId);
    await this.looks.guardarParaUsuario(usuarioId, look.id);
    return look;
  }
}
