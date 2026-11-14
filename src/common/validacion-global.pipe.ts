import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';

/**
 * ValidationPipe global que deja los parametros de ruta como texto.
 *
 * Con transform, Nest convierte cada parametro numerico con Number() antes
 * de su pipe propio, y "0x1", "1e3", "+1" o " 1" llegarian a IdPositivoPipe
 * como 1, 1000 o 1. Sin esa conversion, IdPositivoPipe recibe el texto
 * original y exige la forma canonica de un entero positivo. Body y query se
 * siguen transformando igual que antes.
 */
export class ValidacionGlobalPipe extends ValidationPipe {
  protected transformPrimitive(
    value: unknown,
    metadata: ArgumentMetadata,
  ): unknown {
    if (metadata.type === 'param') return value;
    return super.transformPrimitive(value, metadata) as unknown;
  }
}
