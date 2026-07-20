import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, Min } from 'class-validator';

/**
 * CrearTarifaDto_ap — Datos para registrar o actualizar una tarifa.
 * Las tarifas son configuradas por el administrador y determinan
 * cuánto debe pagar un alumno por inscribir un período o un curso.
 */
export class CrearTarifaDto_ap {
  @IsIn(['PERIODO', 'CURSO'], { message: 'El concepto debe ser PERIODO o CURSO.' })
  concepto_ap: string;

  @IsOptional()
  @IsNumber({}, { message: 'El id_curso_ap debe ser un número.' })
  id_curso_ap?: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número decimal.' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero.' })
  monto_ap: number;

  @IsOptional()
  @IsString()
  descripcion_ap?: string;

  @IsOptional()
  @IsBoolean()
  activa_ap?: boolean;
}
