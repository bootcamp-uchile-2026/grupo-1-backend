import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriaResponseDto } from '../dto/categoria-response.dto';
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
      'Devuelve las categorias del menu principal. Con destacada=true entrega solo las que ' +
      'se pintan en "Categorias populares" de la home. El slug de cada categoria se usa ' +
      'luego como filtro en GET /productos?categoria={slug}.',
  })
  @ApiQuery({
    name: 'destacada',
    type: Boolean,
    required: false,
    description: 'true devuelve solo las categorias visibles en la home.',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias obtenidas correctamente.',
    type: CategoriaResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'El valor de destacada no es true ni false.',
  })
  @Get()
  obtenerCategorias(
    @Query('destacada') destacada?: string,
  ): CategoriaResponseDto[] {
    return this.categoriasService.obtenerCategorias(destacada);
  }
}
