import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

/**
 * CrearPagoDto_ap — Datos que el alumno envía al registrar un pago.
 * Soporta TRANSFERENCIA, PAGO_MOVIL y ZELLE.
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

  @IsOptional()
  @IsIn(['TRANSFERENCIA', 'PAGO_MOVIL', 'ZELLE'], { message: 'El método de pago debe ser TRANSFERENCIA, PAGO_MOVIL o ZELLE.' })
  metodo_pago?: string;

  @IsOptional()
  @IsString()
  banco_origen?: string;

  @IsOptional()
  @IsString()
  telefono_emisor?: string;

  @IsOptional()
  @IsString()
  cedula_rif_emisor?: string;

  @IsOptional()
  @IsString()
  correo_titular_zelle?: string;

  @IsOptional()
  @IsString()
  nombre_titular_zelle?: string;
}
