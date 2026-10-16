import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ColeccionResponseDto } from '../dto/coleccion-response.dto';
import { ColeccionesService } from '../services/colecciones.service';

/**
 * Recurso Colecciones.
 * Colecciones editoriales que alimentan la navegacion de Looks y el bloque
 * "Inspiracion para ti" de la home. Son distintas de los looks de /looks,
 * que agrupan productos y tienen precio.
 */
@ApiTags('colecciones')
@Controller('colecciones')
export class ColeccionesController {
  constructor(private readonly coleccionesService: ColeccionesService) {}

  @ApiOperation({
    summary: 'Lista las colecciones editoriales',
    description:
      'Devuelve las colecciones editoriales que se muestran en la navegacion de Looks y ' +
      'en el bloque "Inspiracion para ti" de la home. Es un contrato de solo lectura ' +
      'porque el wireframe no muestra ninguna accion de creacion o edicion.',
  })
  @ApiResponse({
    status: 200,
    description: 'Colecciones obtenidas correctamente.',
    type: ColeccionResponseDto,
    isArray: true,
  })
  @Get()
  async obtenerColecciones(): Promise<ColeccionResponseDto[]> {
    return this.coleccionesService.obtenerColecciones();
  }
}
