import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
} from 'class-validator';

/**
 * DTO de inscripción del alumno (Épica 3).
 * El alumno envía las materias seleccionadas en la vitrina;
 * el Motor de Reglas vuelve a validar todo en el servidor.
 */
export class InscribirMateriasDto_cjgp {
  @IsInt({ message: 'El período académico es obligatorio.' })
  id_periodo_cjgp!: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debes seleccionar al menos una materia.' })
  @IsInt({ each: true })
  idsMaterias_cjgp!: number[];
}
