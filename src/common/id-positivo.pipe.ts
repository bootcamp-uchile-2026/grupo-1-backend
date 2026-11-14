import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ParseIntPipe,
} from '@nestjs/common';

@Injectable()
export class IdPositivoPipe extends ParseIntPipe {
  async transform(valor: string, metadata: ArgumentMetadata): Promise<number> {
    const id = await super.transform(valor, metadata);
    if (id <= 0 || !Number.isSafeInteger(id)) {
      throw new BadRequestException(
        'El identificador debe ser un entero positivo',
      );
    }
    return id;
  }
}
