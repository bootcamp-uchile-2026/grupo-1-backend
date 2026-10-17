import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriaResponseDto } from '../dto/categoria-response.dto';
import { FiltrarCategoriasDto } from '../dto/filtrar-categorias.dto';
import { CategoriasService } from '../services/categorias.service';

/**
 * Recurso Categorias.
 * Alimenta el menu principal del header y el bloque "Categorias populares"
 * de la home. El slug devuelto es el valor que el frontend envia despues en
 * GET /productos?categoria={slug}.
 */
@ApiTags('categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @ApiOperation({
    summary: 'Lista las categorias del catalogo',
    description:
      'Devuelve las categorias en el orden del menu principal, tengan o no productos. ' +
      'Con destacada=true entrega solo las que se pintan en "Categorias populares" de ' +
      'la home. El slug de cada categoria es el valor del filtro ' +
      'GET /productos?categoria={slug}.',
  })
  @ApiOkResponse({
    description: 'Categorias obtenidas correctamente.',
    type: [CategoriaResponseDto],
  })
  @ApiBadRequestResponse({
    description:
      'destacada no es true ni false, o se envio un parametro no declarado.',
  })
  @Get()
  async obtenerCategorias(
    @Query() filtros: FiltrarCategoriasDto,
  ): Promise<CategoriaResponseDto[]> {
    return this.categoriasService.obtenerCategorias(filtros.destacada);
  }
}
