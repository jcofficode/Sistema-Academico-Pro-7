import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Revisión de un plan entregado por el profesor (Épica C).
 * La coordinación aprueba o devuelve con observación.
 */
export class RevisarPlanDto_ga {
  @IsString()
  @IsIn(['APROBADO', 'DEVUELTO'], {
    message: 'La acción debe ser APROBADO o DEVUELTO.',
  })
  @IsNotEmpty()
  accion_ga!: string;

  @IsOptional()
  @IsString()
  observacion_ga?: string;
}
