import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AutenticacionGuard } from './autenticacion.guard';
import { ServicioContrasenas } from './contrasenas';
import { configuracionTokensDesdeEntorno, ServicioTokens } from './tokens';

/**
 * Hash de contrasenas, emision/verificacion de JWT y guard global.
 * Sin JWT_SECRET valido la aplicacion no arranca: no hay modo inseguro.
 */
@Global()
@Module({
  providers: [
    {
      provide: ServicioContrasenas,
      useFactory: () => new ServicioContrasenas(),
    },
    {
      provide: ServicioTokens,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ServicioTokens(
          configuracionTokensDesdeEntorno({
            JWT_SECRET: config.get<string>('JWT_SECRET'),
            JWT_EXPIRACION_SEGUNDOS: config.get<string>(
              'JWT_EXPIRACION_SEGUNDOS',
            ),
          }),
        ),
    },
    { provide: APP_GUARD, useClass: AutenticacionGuard },
  ],
  exports: [ServicioContrasenas, ServicioTokens],
})
export class SeguridadModule {}
