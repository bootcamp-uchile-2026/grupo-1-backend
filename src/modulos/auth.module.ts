import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UsuariosModule } from './usuarios.module';
import { CarritoModule } from './carrito.module';

@Module({
  imports: [UsuariosModule, CarritoModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
