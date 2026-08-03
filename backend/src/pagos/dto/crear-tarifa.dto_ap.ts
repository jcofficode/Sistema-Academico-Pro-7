import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, Min } from 'class-validator';

/**
 * CrearTarifaDto_ap — Datos para registrar o actualizar una tarifa basada en UC.
 * Prohíbe montos arbitrarios calculando el monto en función de la suma de UCs del plan de estudio.
 */
export class CrearTarifaDto_ap {
  @IsIn(['PERIODO', 'CURSO'], { message: 'El concepto debe ser PERIODO o CURSO.' })
  concepto_ap: string;

  @IsOptional()
  @IsNumber({}, { message: 'El id_curso_ap debe ser un número.' })
  id_curso_ap?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número decimal.' })
  monto_ap?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio por UC debe ser mayor a cero.' })
  @Min(0.01)
  precio_uc_base?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El total de UC debe ser mayor a cero.' })
  @Min(1)
  total_uc?: number;

  @IsOptional()
  @IsNumber({})
  arancel_admin?: number;

  @IsOptional()
  @IsNumber({})
  seguro_estudiantil?: number;

  @IsOptional()
  @IsString()
  descripcion_ap?: string;

  @IsOptional()
  @IsBoolean()
  activa_ap?: boolean;
}
