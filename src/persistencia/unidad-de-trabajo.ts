import { DataSource } from 'typeorm';
import { gestores } from './gestor-actual';
import { ConflictoDominioError } from '../dominio/errores-dominio';
export abstract class UnidadDeTrabajo {
  abstract ejecutar<T>(trabajo: () => Promise<T>): Promise<T>;
}
export class UnidadDeTrabajoDummy extends UnidadDeTrabajo {
  ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    return trabajo();
  }
}
export class UnidadDeTrabajoTypeorm extends UnidadDeTrabajo {
  constructor(private readonly source: DataSource) {
    super();
  }
  async ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    if (gestores.getStore()) return trabajo();
    try {
      return await this.source.transaction((manager) =>
        gestores.run(manager, trabajo),
      );
    } catch (error) {
      const errno = (error as { driverError?: { errno?: number } }).driverError
        ?.errno;
      if (errno !== 1213 && errno !== 1205) throw error;
      throw new ConflictoDominioError('Conflicto temporal de persistencia');
    }
  }
}
