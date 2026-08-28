import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostResponseDto } from '../dto/post-response.dto';
import { ComunidadService } from '../services/comunidad.service';

/**
 * Recurso Comunidad.
 * El wireframe de Comunidad solo muestra tarjetas de contenido, sin botones
 * de crear, editar, eliminar, comentar ni reaccionar. Por eso el contrato se
 * limita a una unica consulta de lectura.
 */
@ApiTags('comunidad')
@Controller('posts')
export class ComunidadController {
  constructor(private readonly comunidadService: ComunidadService) {}

  @ApiOperation({
    summary: 'Lista las publicaciones de Comunidad',
    description:
      'Devuelve las publicaciones que se muestran como tarjetas en la seccion Comunidad. ' +
      'Solo lectura: el wireframe no expone acciones de creacion, edicion, eliminacion, ' +
      'comentarios ni likes, por lo que esos contratos quedan fuera de Hito 1.',
  })
  @ApiResponse({
    status: 200,
    description: 'Publicaciones obtenidas correctamente.',
    type: PostResponseDto,
    isArray: true,
  })
  @Get()
  obtenerPosts(): PostResponseDto[] {
    return this.comunidadService.obtenerPosts();
  }
}
