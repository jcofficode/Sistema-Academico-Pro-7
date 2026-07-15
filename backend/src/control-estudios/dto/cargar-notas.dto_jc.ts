import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

/** Una nota puntual: inscripción + ítem del plan + valor obtenido. */
export class NotaItemDto_jc {
  @IsInt()
  id_inscripcion_materia_jc!: number;

  @IsInt()
  id_item_jc!: number;

  @IsNumber({}, { message: 'La nota debe ser numérica.' })
  @Min(0, { message: 'La nota no puede ser negativa.' })
  valor_jc!: number;
}

/**
 * Carga de notas del docente. Las columnas son dinámicas: el frontend
 * las genera según el plan de evaluación vigente y aquí solo llegan
 * pares (inscripción, ítem, valor) que el servidor valida contra
 * la configuración almacenada en la base de datos.
 */
export class CargarNotasDto_jc {
  @IsInt()
  id_materia_jc!: number;

  @IsInt()
  id_periodo_jc!: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'No se recibió ninguna nota para guardar.' })
  @ValidateNested({ each: true })
  @Type(() => NotaItemDto_jc)
  notas_jc!: NotaItemDto_jc[];
}
