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
   * Lapsos totales — FIJO en 2 por requerimiento del PO.
   * Se acepta en el payload pero siempre se guarda como 2.
   */
  @IsInt()
  @Min(2, { message: 'El mínimo de lapsos es 2.' })
  @Max(2, { message: 'El máximo de lapsos es 2 (inamovible por PO).' })
  lapsos_totales_ga: 2;

  /**
   * Máximo de evaluaciones por lapso — FIJO en 4 por requerimiento del PO.
   * Se acepta en el payload pero siempre se guarda como 4.
   */
  @IsInt()
  @Min(1)
  @Max(4, { message: 'El máximo de evaluaciones por lapso es 4 (inamovible por PO).' })
  max_evaluaciones_lapso_ga: number;
}
