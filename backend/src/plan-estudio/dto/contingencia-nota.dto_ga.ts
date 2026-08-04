import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

/**
 * DTO para la Carga de Nota por Contingencia (Exclusivo Control de Estudios)
 */
export class RegistrarNotaContingenciaDto_ga {
  @IsInt()
  id_materia_ga: number;

  @IsInt()
  id_periodo_ga: number;

  @IsInt()
  id_alumno_ga: number;

  @IsNumber()
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(20, { message: 'La nota máxima es 20' })
  nota_final_ga: number;

  @IsString()
  @IsNotEmpty({ message: 'Debe justificar la carga por contingencia' })
  observacion_ga: string;
}
