import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ColeccionesService } from './colecciones.service';
import { ColeccionResponseDto } from './dto/coleccion-response.dto';

@ApiTags('colecciones')
@Controller('colecciones')
export class ColeccionesController {
  constructor(private readonly coleccionesService: ColeccionesService) {}

  @ApiOperation({
    summary: 'Obtiene las colecciones (looks) de la marca',
    description:
      'Alimenta la seccion "Inspiracion para ti" de la Home y la vista Looks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Colecciones obtenidas correctamente',
    type: ColeccionResponseDto,
    isArray: true,
  })
  @Get()
  obtenerColecciones() {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}
