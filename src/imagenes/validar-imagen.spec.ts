import sharp from 'sharp';
import {
  normalizarImagen,
  MAX_IMAGEN_BYTES,
  MAX_IMAGEN_PIXELES,
} from './validar-imagen';
describe('Contenido real de imagenes P5', () => {
  it.each(['jpeg', 'png', 'webp'] as const)(
    'decodifica y recodifica %s sin metadatos',
    async (format) => {
      const original = await sharp({
        create: { width: 8, height: 8, channels: 3, background: 'red' },
      })
        .withMetadata()
        .toFormat(format)
        .toBuffer();
      const normalized = await normalizarImagen(original);
      expect((await sharp(normalized.data).metadata()).format).toBe(format);
      expect((await sharp(normalized.data).metadata()).exif).toBeUndefined();
    },
  );
  it.each([
    Buffer.from('texto'),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    Buffer.from([255, 216, 255, 0]),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  ])('rechaza contenido no decodificable', async (data) => {
    await expect(normalizarImagen(data)).rejects.toMatchObject({ status: 400 });
  });
  it('rechaza vacio o mas de 5 MiB', async () => {
    await expect(normalizarImagen(Buffer.alloc(0))).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      normalizarImagen(Buffer.alloc(MAX_IMAGEN_BYTES + 1)),
    ).rejects.toMatchObject({ status: 413 });
  });
  it('limita los pixeles descomprimidos', async () => {
    const input = await sharp({
      create: { width: 4001, height: 4000, channels: 3, background: 'white' },
    })
      .png()
      .toBuffer();
    expect(4001 * 4000).toBeGreaterThan(MAX_IMAGEN_PIXELES);
    await expect(normalizarImagen(input)).rejects.toMatchObject({
      status: 400,
    });
  });
});
