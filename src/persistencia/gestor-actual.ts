import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager } from 'typeorm';
export const gestores = new AsyncLocalStorage<EntityManager>();
export const gestorActual = (source: DataSource): EntityManager =>
  gestores.getStore() ?? source.manager;
