import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Ítem de evaluación configurable: "Corte 1", "Módulo A", "Reparación"...
 * El sistema NO conoce estos nombres de antemano: los define la coordinación.
 */
export class ItemEvaluacionDto_jc {
  @IsString()
  @IsNotEmpty({ message: 'Cada evaluación necesita un nombre.' })
  @MaxLength(100)
  nombre_jc!: string;

  @IsInt()
  @Min(1)
  orden_jc!: number;

  @IsNumber({}, { message: 'El peso debe ser numérico.' })
  @Min(0)
  @Max(100)
  peso_jc!: number;

  // true = condición especial (ej. Reparación): no suma peso,
  // sustituye la definitiva reprobada si el alumno la presenta.
  @IsOptional()
  @IsBoolean()
  esRecuperacion_jc?: boolean;
}

/**
 * Plan de Evaluación Institucional por período (Desarrollo Basado en Metadatos).
 * Si no se indica carrera, el plan aplica a toda la institución en ese período,
 * garantizando la uniformidad de las actas.
 */
export class CrearPlanEvaluacionDto_jc {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del plan es obligatorio.' })
  @MaxLength(150)
  nombre_jc!: string;

  @IsInt({ message: 'Debes indicar el período académico.' })
  id_periodo_jc!: number;

  @IsOptional()
  @IsInt()
  id_carrera_jc?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  notaMaxima_jc!: number;

  @IsNumber()
  @Min(0)
  notaAprobatoria_jc!: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'El plan debe tener al menos una evaluación.' })
  @ValidateNested({ each: true })
  @Type(() => ItemEvaluacionDto_jc)
  items_jc!: ItemEvaluacionDto_jc[];
}
