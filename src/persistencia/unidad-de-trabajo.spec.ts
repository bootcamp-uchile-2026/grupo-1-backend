import { DataSource, EntityManager } from 'typeorm';
import { ConflictoDominioError } from '../dominio/errores-dominio';
import { gestores } from './gestor-actual';
import { UnidadDeTrabajoTypeorm } from './unidad-de-trabajo';

describe('Unidad de trabajo sin reintentos de negocio', () => {
  const manager = {} as EntityManager;
  const crear = () => {
    const transaction = jest.fn(
      async (callback: (em: EntityManager) => Promise<unknown>) =>
        callback(manager),
    );
    return {
      transaction,
      unit: new UnidadDeTrabajoTypeorm({
        transaction,
      } as unknown as DataSource),
    };
  };

  it.each([1213, 1205])(
    'propaga conflicto %i sin repetir el callback',
    async (errno) => {
      const { unit, transaction } = crear();
      const trabajo = jest.fn(() =>
        Promise.reject(
          Object.assign(new Error('SQL sintetico'), { driverError: { errno } }),
        ),
      );
      await expect(unit.ejecutar(trabajo)).rejects.toEqual(
        new ConflictoDominioError('Conflicto temporal de persistencia'),
      );
      expect(trabajo).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(gestores.getStore()).toBeUndefined();
    },
  );

  it.each([1213, 1205])(
    'no repite efectos si falla el commit con %i',
    async (errno) => {
      const trabajo = jest.fn(() => Promise.resolve('resultado'));
      const transaction = jest.fn(
        async (callback: (em: EntityManager) => Promise<unknown>) => {
          await callback(manager);
          throw Object.assign(new Error('SQL sintetico'), {
            driverError: { errno },
          });
        },
      );
      const unit = new UnidadDeTrabajoTypeorm({
        transaction,
      } as unknown as DataSource);
      await expect(unit.ejecutar(trabajo)).rejects.toBeInstanceOf(
        ConflictoDominioError,
      );
      expect(trabajo).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    },
  );

  it('conserva errores desconocidos y permite el rollback de TypeORM', async () => {
    const { unit } = crear();
    const error = new Error('fallo');
    await expect(unit.ejecutar(() => Promise.reject(error))).rejects.toBe(
      error,
    );
  });

  it('anida en la misma transaccion y deja escapar el error al limite exterior', async () => {
    const { unit, transaction } = crear();
    const error = new Error('anidado');
    await expect(
      unit.ejecutar(async () => {
        expect(gestores.getStore()).toBe(manager);
        return unit.ejecutar(() => {
          expect(gestores.getStore()).toBe(manager);
          return Promise.reject(error);
        });
      }),
    ).rejects.toBe(error);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(gestores.getStore()).toBeUndefined();
  });

  it('devuelve resultados sin repetir el callback', async () => {
    const { unit, transaction } = crear();
    const trabajo = jest.fn(() => Promise.resolve(42));
    await expect(unit.ejecutar(trabajo)).resolves.toBe(42);
    expect(trabajo).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
