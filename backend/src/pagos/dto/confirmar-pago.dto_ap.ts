import { IsString, IsOptional, IsIn } from 'class-validator';

/**
 * ConfirmarPagoDto_ap — Datos que el administrador envía al confirmar,
 * procesar o rechazar un pago de alumno.
 */
export class ConfirmarPagoDto_ap {
  @IsIn(['PENDIENTE', 'PROCESADO', 'CONFIRMADO', 'RECHAZADO'], {
    message: 'El estado debe ser PENDIENTE, PROCESADO, CONFIRMADO o RECHAZADO.',
  })
  estado_ap: string;

  @IsOptional()
  @IsString({ message: 'La observación debe ser texto.' })
  observacion_ap?: string;
}
