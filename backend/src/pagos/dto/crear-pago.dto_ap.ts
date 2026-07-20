import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

/**
 * CrearPagoDto_ap — Datos que el alumno envía al registrar un pago.
 * La referencia simula el número de pago móvil o transferencia bancaria.
 * El id del usuario siempre se extrae del JWT, nunca del body.
 */
export class CrearPagoDto_ap {
  @IsIn(['PERIODO', 'CURSO'], { message: 'El concepto debe ser PERIODO o CURSO.' })
  concepto_ap: string;

  @IsNumber({}, { message: 'El id_tarifa_ap debe ser un número.' })
  id_tarifa_ap: number;

  @IsOptional()
  @IsNumber({}, { message: 'El id_periodo_ap debe ser un número.' })
  id_periodo_ap?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El id_curso_ap debe ser un número.' })
  id_curso_ap?: number;

  @IsString({ message: 'La referencia de pago es requerida.' })
  referencia_ap: string;
}
