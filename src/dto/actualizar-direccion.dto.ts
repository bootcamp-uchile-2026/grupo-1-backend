import { PartialType } from '@nestjs/swagger';
import { CrearDireccionDto } from './crear-direccion.dto';

/**
 * DTO de ENTRADA.
 * Mismos campos que CrearDireccionDto, todos opcionales.
 */
export class ActualizarDireccionDto extends PartialType(CrearDireccionDto) {}
