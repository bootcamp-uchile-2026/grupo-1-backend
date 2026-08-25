import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComunidadService } from './comunidad.service';
import { PostResponseDto } from './dto/post-response.dto';

@ApiTags('comunidad')
@Controller('posts')
export class ComunidadController {
  constructor(private readonly comunidadService: ComunidadService) {}

  @ApiOperation({
    summary: 'Obtiene las publicaciones de la comunidad',
    description: 'Solo lectura en el alcance actual del Hito 1.',
  })
  @ApiResponse({
    status: 200,
    description: 'Publicaciones obtenidas correctamente',
    type: PostResponseDto,
    isArray: true,
  })
  @Get()
  obtenerPosts() {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}
