import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Materia que llega desde el asistente paso a paso.
 * Las prelaciones se expresan por código de materia (ej. "BD1")
 * para que el administrador no manipule IDs internos.
 */
export class MateriaPensumDto_cjgp {
  @IsString()
  @IsNotEmpty({ message: 'El código de la materia es obligatorio.' })
  @MaxLength(20)
  codigo_cjgp!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la materia es obligatorio.' })
  @MaxLength(200)
  nombre_cjgp!: string;

  @IsInt({ message: 'Los créditos deben ser un número entero.' })
  @Min(1, { message: 'Una materia debe valer al menos 1 crédito.' })
  @Max(12, { message: 'Una materia no puede exceder los 12 créditos.' })
  creditos_cjgp!: number;

  @IsInt()
  @Min(1, { message: 'El bloque debe ser mayor o igual a 1.' })
  nroBloque_cjgp!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos_cjgp?: string[];

  // Profesor que dictará la materia (asignable desde el propio asistente)
  @IsOptional()
  @IsInt()
  id_profesor_cjgp?: number | null;
}

/**
 * DTO del asistente de creación de carreras (Épica 1).
 * Permite registrar la carrera completa (datos + pensum + prelaciones)
 * en una sola operación transaccional.
 */
export class CrearCarreraDto_cjgp {
  @IsString()
  @IsNotEmpty({ message: 'El código de la carrera es obligatorio.' })
  @MaxLength(20)
  codigo_cjgp!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la carrera es obligatorio.' })
  @MaxLength(200)
  nombre_cjgp!: string;

  @IsOptional()
  @IsString()
  descripcion_cjgp?: string;

  @IsIn(['SEMESTRAL', 'TRIMESTRAL'], {
    message: 'El régimen debe ser SEMESTRAL o TRIMESTRAL.',
  })
  regimen_cjgp!: string;

  @IsInt()
  @Min(1, { message: 'La duración mínima es de 1 año.' })
  @Max(7, { message: 'La duración máxima es de 7 años.' })
  duracionAnios_cjgp!: number;

  @IsInt()
  @Min(1)
  @Max(60)
  limiteCreditos_cjgp!: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'El pensum debe incluir al menos una materia.' })
  @ValidateNested({ each: true })
  @Type(() => MateriaPensumDto_cjgp)
  materias_cjgp!: MateriaPensumDto_cjgp[];
}
