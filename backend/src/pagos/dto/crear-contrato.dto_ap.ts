import { IsNumber, IsIn, Min } from 'class-validator';

/**
 * CrearContratoDto_ap — Datos para registrar el contrato de un profesor.
 * FIJO: monto es el sueldo mensual del período.
 * POR_HORA: monto es la tarifa pagada por cada hora dictada.
 */
export class CrearContratoDto_ap {
  @IsNumber({}, { message: 'El id_profesor_ap debe ser un número.' })
  id_profesor_ap: number;

  @IsIn(['FIJO', 'POR_HORA'], {
    message: 'El tipo de contrato debe ser FIJO o POR_HORA.',
  })
  tipo_ap: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número decimal.' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero.' })
  monto_ap: number;
}
