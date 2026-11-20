import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { LONGITUD_MAXIMA_CORREO } from '../dominio/limites-identidad';
import {
  CredencialFila,
  UsuarioFila,
} from '../persistencia/identidad.entidades';
import { LoginDto } from './login.dto';
import { RegistrarUsuarioDto } from './registrar-usuario.dto';

describe('Limite del correo compatible con SQL', () => {
  it('coincide con ambas columnas fisicas de identidad', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) =>
        (c.target === UsuarioFila && c.propertyName === 'email') ||
        (c.target === CredencialFila && c.propertyName === 'correo'),
    );
    expect(columns).toHaveLength(2);
    for (const column of columns)
      expect(column.options.length).toBe(LONGITUD_MAXIMA_CORREO);
  });
  it('publica un error de longitud explicito para entradas que ya rechazaba IsEmail', () => {
    const correoElectronico = 'x'.repeat(321) + '@example.invalid';
    for (const dto of [
      plainToInstance(LoginDto, { correoElectronico, contrasena: 'a' }),
      plainToInstance(RegistrarUsuarioDto, {
        nombre: 'Lab',
        correoElectronico,
        contrasena: 'a',
      }),
    ]) {
      const error = validateSync(dto).find(
        (e) => e.property === 'correoElectronico',
      );
      expect(error?.constraints).toHaveProperty('maxLength');
      expect(error?.constraints).toHaveProperty('isEmail');
    }
  });
  it('no endurece contrasenas existentes ni cambia el nombre de las credenciales', () => {
    expect(
      validateSync(
        plainToInstance(LoginDto, {
          correoElectronico: 'lab@example.invalid',
          contrasena: 'a',
        }),
      ),
    ).toEqual([]);
    expect(
      validateSync(
        plainToInstance(RegistrarUsuarioDto, {
          nombre: 'Lab',
          correoElectronico: 'lab@example.invalid',
          contrasena: 'a',
        }),
      ),
    ).toEqual([]);
  });
});
