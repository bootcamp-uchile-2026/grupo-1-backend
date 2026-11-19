import { Provider, Type } from '@nestjs/common';
import { DataSource } from 'typeorm';
/** En MySQL no se instancia el adaptador dummy ni su estado en memoria. */
export function proveerDummy<T>(dummy: Type<T>): Provider {
  return {
    provide: dummy,
    inject: [DataSource],
    useFactory: (source: DataSource | null) => (source ? null : new dummy()),
  };
}
export function proveerRepositorio<T>(
  puerto: Type<T> | (abstract new (...args: never[]) => T),
  dummy: Type<T>,
  mysql: new (source: DataSource) => T,
): Provider {
  return {
    provide: puerto,
    inject: [DataSource, dummy],
    useFactory: (source: DataSource | null, instanciaDummy: T) =>
      source ? new mysql(source) : instanciaDummy,
  };
}
