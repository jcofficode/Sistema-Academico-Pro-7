export class HorarioCursoDto_ahbb {
  diaSemana_ahbb!: string;
  horaInicio_ahbb!: string;
  horaFin_ahbb!: string;
}

export class CrearCursoDto_ahbb {
  nombre_ahbb!: string;
  tematica_ahbb!: string;
  descripcion_ahbb?: string;
  temarioTexto_ahbb?: string;
  fechaInicio_ahbb?: string;
  fechaFin_ahbb?: string;
  horasDefinidas_ahbb!: number;
  diasDefinidos_ahbb?: number;
  topeEstudiantes_ahbb?: number;
  id_curso_curso_ahbb?: number | null;
  horarios_ahbb!: HorarioCursoDto_ahbb[];
  isPublished_ahbb?: boolean;
  mensajeCorreccion_ahbb?: string;
}
