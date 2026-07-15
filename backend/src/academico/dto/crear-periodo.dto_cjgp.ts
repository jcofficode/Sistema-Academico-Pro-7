import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** DTO para registrar un período académico (ej. "2026-I"). */
export class CrearPeriodoDto_cjgp {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del período es obligatorio.' })
  @MaxLength(30)
  nombre_cjgp!: string;

  @IsDateString({}, { message: 'La fecha de inicio no es válida.' })
  fechaInicio_cjgp!: string;

  @IsDateString({}, { message: 'La fecha de fin no es válida.' })
  fechaFin_cjgp!: string;

  @IsOptional()
  @IsBoolean()
  activo_cjgp?: boolean;
}
