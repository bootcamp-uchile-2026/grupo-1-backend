import { AlertaResponseDto } from '../dto/alerta-response.dto';

/** Datos de una alerta sin su id, que asigna el repositorio. */
export type NuevaAlerta = Omit<AlertaResponseDto, 'id'>;

/** Acceso a las alertas. Toda operacion se limita al usuario indicado. */
export abstract class AlertasRepository {
  abstract listarPorUsuario(usuarioId: number): Promise<AlertaResponseDto[]>;

  abstract crear(
    usuarioId: number,
    datos: NuevaAlerta,
  ): Promise<AlertaResponseDto>;

  /** Devuelve false si la alerta no existe para ese usuario. */
  abstract eliminar(usuarioId: number, alertaId: number): Promise<boolean>;
}
