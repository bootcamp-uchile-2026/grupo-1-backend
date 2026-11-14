import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ParseIntPipe,
} from '@nestjs/common';

/** Forma canonica: solo digitos, sin signo, ceros a la izquierda ni espacios. */
const ENTERO_POSITIVO = /^[1-9]\d*$/;

/**
 * Identificador de ruta. Recibe el texto original porque ValidacionGlobalPipe
 * no convierte parametros; asi "0x1", "1e3" o "01" responden 400 en vez de
 * apuntar al recurso 1 o 1000.
 */
@Injectable()
export class IdPositivoPipe extends ParseIntPipe {
  async transform(valor: string, metadata: ArgumentMetadata): Promise<number> {
    const id = await super.transform(valor, metadata);
    if (!ENTERO_POSITIVO.test(valor) || !Number.isSafeInteger(id)) {
      throw new BadRequestException(
        'El identificador debe ser un entero positivo',
      );
    }
    return id;
  }
}
