import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
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
 * Sección configurable de la plantilla: Justificación, Objetivos, etc.
 * El sistema NO conoce estos nombres de antemano: los define la coordinación.
 */
export class SeccionPlantillaDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'Cada sección necesita un nombre.' })
  @MaxLength(200)
  nombre_ga!: string;

  @IsInt()
  @Min(1)
  orden_ga!: number;

  @IsOptional()
  @IsBoolean()
  obligatoria_ga?: boolean;

  @IsString()
  @IsIn(['TEXTO', 'LISTA', 'ARCHIVO'], {
    message: 'El tipo de contenido debe ser TEXTO, LISTA o ARCHIVO.',
  })
  tipo_contenido_ga!: string;
}

/**
 * Nivel de valoración cualitativa: Iniciado, En Proceso, Consolidado...
 * Solo aplica cuando tipo_valoracion_ga = 'CUALITATIVO'.
 */
export class NivelCualitativoDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'La etiqueta del nivel es obligatoria.' })
  @MaxLength(100)
  etiqueta_ga!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion_ga?: string;

  @IsInt()
  @Min(1)
  orden_ga!: number;
}

/**
 * Plantilla Institucional de Planificación por período
 * (Desarrollo Basado en Metadatos — Épica A).
 */
export class CrearPlantillaDto_ga {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la plantilla es obligatorio.' })
  @MaxLength(200)
  nombre_ga!: string;

  @IsInt({ message: 'Debes indicar el período académico.' })
  id_periodo_ga!: number;

  @IsString()
  @IsIn(['CUANTITATIVO', 'CUALITATIVO'], {
    message: 'El tipo de valoración debe ser CUANTITATIVO o CUALITATIVO.',
  })
  tipo_valoracion_ga!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  escala_min_ga?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  escala_max_ga?: number;

  @IsOptional()
  @IsBoolean()
  ponderado_ga?: boolean;

  @IsArray()
  @ArrayNotEmpty({ message: 'La plantilla debe tener al menos una sección.' })
  @ValidateNested({ each: true })
  @Type(() => SeccionPlantillaDto_ga)
  secciones_ga!: SeccionPlantillaDto_ga[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NivelCualitativoDto_ga)
  niveles_ga?: NivelCualitativoDto_ga[];
}
