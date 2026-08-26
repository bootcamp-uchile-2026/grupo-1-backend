import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CategoriasService } from './categorias.service';
import { CategoriaResponseDto } from './dto/categoria-response.dto';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @ApiOperation({
    summary: 'Obtiene las categorias del catalogo',
    description:
      'Sin filtro devuelve la taxonomia completa para el menu principal. ' +
      'Con destacada=true devuelve las categorias populares que muestra la Home.',
  })
  @ApiQuery({ name: 'destacada', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Categorias obtenidas correctamente',
    type: CategoriaResponseDto,
    isArray: true,
  })
  @Get()
  obtenerCategorias(@Query('destacada') destacada: string) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}
