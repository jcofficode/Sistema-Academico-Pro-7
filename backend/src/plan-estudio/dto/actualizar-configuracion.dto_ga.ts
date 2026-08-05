// DTO de actualización de Configuración Curricular (_ga)
// Valida el formato de evaluación y los parámetros inamovibles
// SOLID: Single Responsibility — solo valida la entrada de la capa HTTP

import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

/**
 * ActualizarConfiguracionDto_ga — Payload para PUT /configuracion-curricular_ga/:idPeriodo
 *
 * Las restricciones de lapsos (2) y máximo de evaluaciones (4) son inamovibles
 * según el requerimiento del Product Owner. Sólo el formato es modificable.
 */
export class ActualizarConfiguracionDto_ga {
  /**
   * Formato de evaluación global del período.
   * CUANTITATIVO = escala numérica 0–20.
   * CUALITATIVO  = niveles descriptivos (Excelente / Bueno / Regular / Deficiente).
   */
  @IsNotEmpty({ message: 'El formato de evaluación es requerido.' })
  @IsString()
  @IsIn(['CUANTITATIVO', 'CUALITATIVO'], {
    message: 'El formato debe ser CUANTITATIVO o CUALITATIVO.',
  })
  formato_evaluacion_ga: 'CUANTITATIVO' | 'CUALITATIVO';

  /**
   * Lapsos totales del período (Configurable: 1 a 6 lapsos).
   */
  @IsInt()
  @Min(1, { message: 'El número mínimo de lapsos es 1.' })
  @Max(6, { message: 'El número máximo de lapsos es 6.' })
  lapsos_totales_ga: number;

  /**
   * Máximo de evaluaciones por lapso (Configurable: 1 a 10 actividades).
   */
  @IsInt()
  @Min(1, { message: 'El número mínimo de evaluaciones por lapso es 1.' })
  @Max(10, { message: 'El número máximo de evaluaciones por lapso es 10.' })
  max_evaluaciones_lapso_ga: number;
}
