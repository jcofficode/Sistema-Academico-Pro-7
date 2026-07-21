import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Indicador de logro por unidad (valoración según la plantilla vigente). */
export class IndicadorDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'La descripción del indicador es obligatoria.' })
  @MaxLength(500)
  descripcion_ga!: string;

  @IsInt()
  @Min(1)
  orden_ga!: number;

  // Si CUANTITATIVO: valor numérico o peso porcentual
  @IsOptional()
  @IsNumber()
  valor_ga?: number;

  // Si CUALITATIVO: ID del nivel seleccionado
  @IsOptional()
  @IsInt()
  id_nivel_ga?: number;
}

/** Unidad temática con cronograma y vinculación opcional a evaluación _jc. */
export class UnidadDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la unidad es obligatorio.' })
  @MaxLength(200)
  nombre_ga!: string;

  @IsInt()
  @Min(1)
  orden_ga!: number;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida.' })
  fecha_inicio_ga!: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida.' })
  fecha_fin_ga!: string;

  // Vinculación opcional con un ítem del plan de evaluación _jc
  @IsOptional()
  @IsInt()
  id_item_evaluacion_ga?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicadorDto_ga)
  indicadores_ga?: IndicadorDto_ga[];
}

/** Contenido de una sección (texto, lista JSON o ruta de archivo). */
export class ContenidoSeccionDto_ga {
  @IsInt({ message: 'Debes indicar la sección.' })
  id_seccion_ga!: number;

  @IsOptional()
  @IsString()
  texto_ga?: string;
}

/**
 * Plan de Estudio de una materia en un período (Épica B).
 * El profesor crea el plan llenando las secciones de la plantilla vigente,
 * definiendo unidades con cronograma e indicadores de logro.
 */
export class CrearPlanEstudioDto_ga {
  @IsInt({ message: 'Debes indicar la materia.' })
  id_materia_ga!: number;

  @IsInt({ message: 'Debes indicar el período académico.' })
  id_periodo_ga!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContenidoSeccionDto_ga)
  contenidos_ga?: ContenidoSeccionDto_ga[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnidadDto_ga)
  unidades_ga?: UnidadDto_ga[];
}
