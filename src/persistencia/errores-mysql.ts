import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
export function traducirErrorMysql(error: unknown): never {
  const errno = (error as { driverError?: { errno?: number } })?.driverError
    ?.errno;
  if ([1062, 1451, 3572].includes(errno ?? 0))
    throw new ConflictoDominioError('Conflicto de persistencia');
  if (errno === 1452)
    throw new RecursoNoEncontradoError('Recurso relacionado no encontrado');
  if (errno === 3819)
    throw new ReglaNegocioError('Restriccion de datos incumplida');
  throw error;
}
