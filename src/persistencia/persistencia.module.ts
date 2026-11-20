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
import { UnidadDeTrabajo, UnidadDeTrabajoTypeorm } from './unidad-de-trabajo';

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
      useFactory: async (config: ConfigService): Promise<DataSource> => {
        const source = new DataSource(
          opcionesMysql({
            PERSISTENCIA: config.get<string>('PERSISTENCIA'),
            DB_HOST: config.get<string>('DB_HOST'),
            DB_PORT: config.get<string>('DB_PORT'),
            DB_USERNAME: config.get<string>('DB_USERNAME'),
            DB_PASSWORD: config.get<string>('DB_PASSWORD'),
            DB_DATABASE: config.get<string>('DB_DATABASE'),
          }),
        );
        try {
          await source.initialize();
          if (!source.isInitialized)
            throw new Error('Inicializacion incompleta');
        } catch {
          if (source.isInitialized)
            await source.destroy().catch(() => undefined);
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
      useFactory: (source: DataSource): UnidadDeTrabajo => {
        if (!source || !source.isInitialized)
          throw new Error('La unidad de trabajo requiere MySQL inicializado.');
        return new UnidadDeTrabajoTypeorm(source);
      },
    },
  ],
  exports: [DataSource, UnidadDeTrabajo],
})
export class PersistenciaModule implements OnApplicationShutdown {
  constructor(@Inject(DataSource) private readonly source: DataSource) {}
  async onApplicationShutdown(): Promise<void> {
    if (this.source.isInitialized) await this.source.destroy();
  }
}
