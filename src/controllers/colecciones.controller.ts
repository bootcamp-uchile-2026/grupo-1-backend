import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ColeccionResponseDto } from '../dto/coleccion-response.dto';
import { ColeccionesService } from '../services/colecciones.service';

/**
 * Recurso Colecciones (Looks).
 * Alimenta la navegacion de Looks y el bloque "Inspiracion para ti" de la home.
 */
@ApiTags('colecciones')
@Controller('colecciones')
export class ColeccionesController {
  constructor(private readonly coleccionesService: ColeccionesService) {}

  @ApiOperation({
    summary: 'Lista los looks publicados',
    description:
      'Devuelve los looks editoriales que se muestran en la navegacion de Looks y en el ' +
      'bloque "Inspiracion para ti" de la home. Es un contrato de solo lectura porque el ' +
      'wireframe no muestra ninguna accion de creacion o edicion.',
  })
  @ApiResponse({
    status: 200,
    description: 'Colecciones obtenidas correctamente.',
    type: ColeccionResponseDto,
    isArray: true,
  })
  @Get()
  obtenerColecciones(): ColeccionResponseDto[] {
    return this.coleccionesService.obtenerColecciones();
  }
}
