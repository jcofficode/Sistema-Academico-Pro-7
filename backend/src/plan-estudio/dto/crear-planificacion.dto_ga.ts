import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * DTO para Indicador de Logro por Actividad
 */
export class CrearIndicadorLogroDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'La descripción del indicador es requerida' })
  descripcion_ga: string;

  @IsOptional()
  @IsString()
  criterio_cualitativo_ga?: string;
}

/**
 * DTO para Actividades de Evaluación por Lapso
 */
export class CrearActividadEvaluacionDto_ga {
  @IsInt()
  @Min(1)
  @Max(2)
  lapso_ga: number; // Lapso 1 o 2

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la actividad es requerido' })
  nombre_actividad_ga: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de evaluación es requerido' })
  tipo_evaluacion_ga: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje_ga: number;

  @IsOptional()
  @IsString()
  fecha_evaluacion_ga?: string;

  @IsInt()
  @Min(1)
  @Max(4, { message: 'Máximo 4 actividades de evaluación por lapso' })
  orden_ga: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearIndicadorLogroDto_ga)
  indicadores_ga?: CrearIndicadorLogroDto_ga[];
}

/**
 * DTO para Detalle Didáctico por Lapso
 */
export class CrearDetalleDidacticoDto_ga {
  @IsInt()
  @Min(1)
  @Max(2)
  lapso_ga: number;

  @IsString()
  @IsNotEmpty({ message: 'La unidad temática es requerida' })
  unidad_tematica_ga: string;

  @IsString()
  @IsNotEmpty({ message: 'La estrategia didáctica es requerida' })
  estrategia_ga: string;

  @IsString()
  @IsNotEmpty({ message: 'Los recursos son requeridos' })
  recursos_ga: string;

  @IsInt()
  @Min(1)
  orden_ga: number;
}

/**
 * DTO Principal para Carga Integral de Planificación Docente
 */
export class CrearPlanificacionDto_ga {
  @IsInt()
  id_materia_ga: number;

  @IsInt()
  id_periodo_ga: number;

  @IsString()
  @IsNotEmpty({ message: 'La ruta del programa oficial es requerida' })
  programaUrl_ga: string;

  @IsEnum(['CUANTITATIVO', 'CUALITATIVO'])
  formato_evaluacion_ga: 'CUANTITATIVO' | 'CUALITATIVO';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleDidacticoDto_ga)
  detallesDidacticos_ga: CrearDetalleDidacticoDto_ga[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearActividadEvaluacionDto_ga)
  actividadesEvaluacion_ga: CrearActividadEvaluacionDto_ga[];
}
