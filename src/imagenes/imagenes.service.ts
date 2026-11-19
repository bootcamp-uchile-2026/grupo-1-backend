import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CargaImagen } from '../persistencia/imagenes.entidades';
import { ImagenesRepository } from './imagenes.repository';
import { ARCHIVO_IMAGEN, normalizarImagen } from './validar-imagen';

@Injectable()
export class ImagenesService {
  private readonly logger = new Logger('Imagenes');
  private activos = 0;
  constructor(
    private readonly repository: ImagenesRepository,
    private readonly config: ConfigService,
  ) {}
  private async directorio() {
    const dir = path.resolve(
      this.config.get<string>('IMAGENES_DIRECTORIO') || 'uploads/productos',
    );
    await fs.mkdir(dir, { recursive: true });
    return fs.realpath(dir);
  }
  private async ubicacion(archivo: string) {
    if (!ARCHIVO_IMAGEN.test(archivo))
      throw new NotFoundException('Imagen inexistente');
    return path.join(await this.directorio(), archivo);
  }
  async cargar(productoId: number, actorId: number, buffer?: Buffer) {
    if (!buffer) throw new BadRequestException('Se requiere el archivo imagen');
    if (this.activos >= 2)
      throw new ServiceUnavailableException(
        'Procesamiento de imagenes ocupado; reintente',
      );
    this.activos++;
    let carga: CargaImagen | undefined;
    let creado = false;
    let reservada = false;
    try {
      const image = await normalizarImagen(buffer);
      carga = Object.assign(new CargaImagen(), {
        archivo: randomUUID() + '.' + image.extension,
        productoId: String(productoId),
        actorId,
        bytes: image.data.length,
        sha256: createHash('sha256').update(image.data).digest('hex'),
        estado: 'pendiente',
      });
      await this.repository.reservar(carga);
      reservada = true;
      const target = await this.ubicacion(carga.archivo);
      const file = await fs.open(target, 'wx', 0o640);
      creado = true;
      try {
        await file.writeFile(image.data);
        await file.sync();
      } finally {
        await file.close();
      }
      return await this.repository.publicar(carga);
    } catch (error) {
      if (carga && reservada) {
        try {
          if ((await this.repository.fallar(carga, !creado)) && creado)
            await this.eliminarPropio(carga.archivo);
        } catch {
          this.logger.warn({
            event: 'carga_imagen_pendiente_revision',
            archivo: carga.archivo,
          });
        }
      }
      throw error;
    } finally {
      this.activos--;
    }
  }
  private async eliminarPropio(archivo: string) {
    const target = await this.ubicacion(archivo);
    try {
      const stat = await fs.lstat(target);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1)
        throw new Error('Archivo no regular');
      await fs.unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  async abrir(archivo: string) {
    if (
      !ARCHIVO_IMAGEN.test(archivo) ||
      !(await this.repository.publicada(archivo))
    )
      throw new NotFoundException('Imagen inexistente');
    const target = await this.ubicacion(archivo);
    let file: fs.FileHandle | undefined;
    try {
      const antes = await fs.lstat(target);
      if (
        !antes.isFile() ||
        antes.isSymbolicLink() ||
        (await fs.realpath(target)) !== target
      )
        throw new Error('Archivo no regular');
      file = await fs.open(
        target,
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      );
      const stat = await file.stat();
      if (!stat.isFile() || stat.ino !== antes.ino || stat.dev !== antes.dev)
        throw new Error('Archivo cambiado');
      const extension = path.extname(archivo);
      return new StreamableFile(file.createReadStream({ autoClose: true }), {
        type:
          extension === '.jpg'
            ? 'image/jpeg'
            : extension === '.png'
              ? 'image/png'
              : 'image/webp',
        length: stat.size,
        disposition: 'inline',
      });
    } catch {
      await file?.close();
      throw new NotFoundException('Imagen inexistente');
    }
  }
  /** Solo filas propias, sin barrer el volumen ni borrar archivos publicados. */
  async reconciliar() {
    const rows = await this.repository.pendientes();
    let eliminados = 0,
      requierenRevision = 0;
    for (const row of rows) {
      try {
        if (!(await this.repository.fallar(row))) continue;
        const target = await this.ubicacion(row.archivo);
        try {
          const stat = await fs.lstat(target);
          if (
            !stat.isFile() ||
            stat.isSymbolicLink() ||
            stat.size !== row.bytes ||
            createHash('sha256')
              .update(await fs.readFile(target))
              .digest('hex') !== row.sha256
          ) {
            requierenRevision++;
            continue;
          }
          await this.eliminarPropio(row.archivo);
          eliminados++;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      } catch {
        requierenRevision++;
      }
    }
    return { examinados: rows.length, eliminados, requierenRevision };
  }
}
