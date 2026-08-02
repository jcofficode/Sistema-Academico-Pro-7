import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Registro de la reparación de un CORTE concreto.
 *
 * A diferencia del modelo anterior (donde la "Reparación" era un ítem más del
 * plan de evaluación), ahora la decide quien carga las notas: el docente o el
 * personal de Control de Estudios puede reparar el corte que haga falta, tantas
 * veces como cortes tenga el plan.
 *
 * La nota efectiva del corte pasa a ser MAX(nota original, nota de reparación):
 * reparar nunca perjudica al alumno.
 */
export class RegistrarReparacionDto_jc {
  @IsInt()
  id_inscripcion_materia_jc!: number;

  /** Corte del plan que se está reparando. */
  @IsInt()
  id_item_jc!: number;

  @IsNumber({}, { message: 'La nota de la reparación debe ser numérica.' })
  @Min(0, { message: 'La nota de la reparación no puede ser negativa.' })
  valor_jc!: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  observacion_jc?: string;
}
