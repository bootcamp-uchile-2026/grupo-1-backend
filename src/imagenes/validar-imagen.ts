import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';

export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGEN_PIXELES = 16_000_000;
export const ARCHIVO_IMAGEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/;
export async function normalizarImagen(buffer: Buffer) {
  if (!buffer.length) throw new BadRequestException('Imagen vacia');
  if (buffer.length > MAX_IMAGEN_BYTES)
    throw new PayloadTooLargeException('Maximo 5 MiB por imagen');
  let formato: 'jpeg' | 'png' | 'webp';
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    formato = 'jpeg';
  else if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    formato = 'png';
  else if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP' &&
    buffer.readUInt32LE(4) + 8 === buffer.length
  )
    formato = 'webp';
  else throw new BadRequestException('Solo contenido JPEG, PNG o WebP');
  try {
    const image = sharp(buffer, {
      failOn: 'warning',
      limitInputPixels: MAX_IMAGEN_PIXELES,
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== formato ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) !== 1
    )
      throw new Error('Formato no permitido');
    // Decodifica todos los pixeles y genera otro archivo sin metadatos del cliente.
    const data = await image.rotate().toFormat(formato).toBuffer();
    if (data.length > MAX_IMAGEN_BYTES)
      throw new PayloadTooLargeException('Imagen normalizada supera 5 MiB');
    return {
      data,
      extension: formato === 'jpeg' ? 'jpg' : formato,
      mime: formato === 'jpeg' ? 'image/jpeg' : `image/${formato}`,
    };
  } catch (error) {
    if (error instanceof PayloadTooLargeException) throw error;
    throw new BadRequestException(
      'Contenido de imagen invalido, truncado o fuera de limites',
    );
  }
}
