import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { opcionesMysql } from './mysql.datasource';
import {
  UnidadDeTrabajo,
  UnidadDeTrabajoDummy,
  UnidadDeTrabajoTypeorm,
} from './unidad-de-trabajo';

/** P4: todos los dominios comerciales implementados tienen persistencia SQL. */
export const DOMINIOS_MYSQL_PILOTO = [
  'categorias',
  'colecciones',
  'publicaciones',
  'productos',
  'usuarios',
  'credenciales',
  'direcciones',
  'carrito',
  'favoritos',
  'pedidos',
  'looks',
  'alertas',
  'postventa',
  'logistica',
] as const;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DataSource,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<DataSource | null> => {
        if (config.get<string>('PERSISTENCIA', 'dummy') !== 'mysql')
          return null;
        const source = new DataSource(
          opcionesMysql({
            DB_HOST: config.get<string>('DB_HOST'),
            DB_PORT: config.get<string>('DB_PORT'),
            DB_USERNAME: config.get<string>('DB_USERNAME'),
            DB_PASSWORD: config.get<string>('DB_PASSWORD'),
            DB_DATABASE: config.get<string>('DB_DATABASE'),
          }),
        );
        try {
          await source.initialize();
        } catch {
          if (source.isInitialized) await source.destroy();
          throw new Error(
            'No se pudo inicializar MySQL; revise la conexion configurada.',
          );
        }
        new Logger('Persistencia').log(
          'Modo MySQL P4: todos los dominios comerciales implementados usan SQL; sin fallback a memoria.',
        );
        return source;
      },
    },
    {
      provide: UnidadDeTrabajo,
      inject: [DataSource],
      useFactory: (source: DataSource | null): UnidadDeTrabajo =>
        source
          ? new UnidadDeTrabajoTypeorm(source)
          : new UnidadDeTrabajoDummy(),
    },
  ],
  exports: [DataSource, UnidadDeTrabajo],
})
export class PersistenciaModule implements OnApplicationShutdown {
  constructor(@Inject(DataSource) private readonly source: DataSource | null) {}
  async onApplicationShutdown(): Promise<void> {
    if (this.source?.isInitialized) await this.source.destroy();
  }
}
