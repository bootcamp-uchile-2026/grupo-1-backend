import { ConfigService } from '@nestjs/config';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { ImagenesService } from './imagenes.service';
import { ImagenesRepository } from './imagenes.repository';
describe('Compensacion de archivos P5', () => {
  const input = () =>
    sharp({ create: { width: 2, height: 2, channels: 3, background: 'blue' } })
      .png()
      .toBuffer();
  it('retira solo su archivo nuevo si la asociacion falla definitivamente', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stylenow-p5-unit-'));
    const repository = {
      reservar: jest.fn().mockResolvedValue(undefined),
      publicar: jest.fn().mockRejectedValue(new Error('SQL sintetico')),
      fallar: jest.fn().mockResolvedValue(true),
    };
    const service = new ImagenesService(
      repository as unknown as ImagenesRepository,
      new ConfigService({ IMAGENES_DIRECTORIO: dir }),
    );
    await expect(service.cargar(1, 1, await input())).rejects.toThrow(
      'SQL sintetico',
    );
    expect(await readdir(dir)).toEqual([]);
  });
  it('conserva archivo si el resultado SQL es incierto, sin borrar un posible commit', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stylenow-p5-unit-'));
    const repository = {
      reservar: jest.fn().mockResolvedValue(undefined),
      publicar: jest.fn().mockRejectedValue(new Error('Conexion perdida')),
      fallar: jest.fn().mockRejectedValue(new Error('DB no disponible')),
    };
    const service = new ImagenesService(
      repository as unknown as ImagenesRepository,
      new ConfigService({ IMAGENES_DIRECTORIO: dir }),
    );
    await expect(service.cargar(1, 1, await input())).rejects.toThrow(
      'Conexion perdida',
    );
    expect(await readdir(dir)).toHaveLength(1);
  });
  it('no compensa una reserva que nunca pudo confirmarse', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stylenow-p5-unit-'));
    const repository = {
      reservar: jest.fn().mockRejectedValue(new Error('Producto no existe')),
      fallar: jest.fn(),
    };
    const service = new ImagenesService(
      repository as unknown as ImagenesRepository,
      new ConfigService({ IMAGENES_DIRECTORIO: dir }),
    );
    await expect(service.cargar(1, 1, await input())).rejects.toThrow(
      'Producto no existe',
    );
    expect(repository.fallar).not.toHaveBeenCalled();
    expect(await readdir(dir)).toEqual([]);
  });
});
