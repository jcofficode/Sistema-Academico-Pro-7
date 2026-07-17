import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CrearBloqueDto_jf {
  @IsInt()
  @IsNotEmpty()
  id_curso_bloque_jf: number;

  @IsString()
  @IsNotEmpty()
  nombre_jf: string;

  @IsString()
  @IsOptional()
  descripcion_jf?: string;

  @IsInt()
  @IsNotEmpty()
  orden_jf: number;
}

export class ActualizarBloqueDto_jf {
  @IsString()
  @IsOptional()
  nombre_jf?: string;

  @IsString()
  @IsOptional()
  descripcion_jf?: string;

  @IsInt()
  @IsOptional()
  orden_jf?: number;
}

export class CrearLeccionDto_jf {
  @IsInt()
  @IsNotEmpty()
  id_bloque_leccion_jf: number;

  @IsString()
  @IsNotEmpty()
  titulo_jf: string;

  @IsString()
  @IsOptional()
  descripcion_jf?: string;

  @IsInt()
  @IsNotEmpty()
  orden_jf: number;

  @IsString()
  @IsNotEmpty()
  tipo_jf: string; // VIDEO | LECTURA | RECURSO

  @IsString()
  @IsOptional()
  contenidoTexto_jf?: string;
}

export class ActualizarLeccionDto_jf {
  @IsString()
  @IsOptional()
  titulo_jf?: string;

  @IsString()
  @IsOptional()
  descripcion_jf?: string;

  @IsInt()
  @IsOptional()
  orden_jf?: number;

  @IsString()
  @IsOptional()
  tipo_jf?: string;

  @IsString()
  @IsOptional()
  contenidoTexto_jf?: string;
}

export class GuardarProgresoDto_jf {
  @IsBoolean()
  @IsNotEmpty()
  completada_jf: boolean;

  @IsNumber()
  @IsOptional()
  porcentajeVisto_jf?: number;
}

export class GuardarEvaluacionDto_jf {
  @IsInt()
  @IsNotEmpty()
  id_bloque_evaluacion_jf: number;

  @IsString()
  @IsNotEmpty()
  titulo_jf: string;

  @IsString()
  @IsOptional()
  descripcion_jf?: string;

  @IsNumber()
  @IsNotEmpty()
  notaMinima_jf: number;

  @IsInt()
  @IsOptional()
  intentosMaximos_jf?: number;

  @IsNotEmpty()
  preguntasJson_jf: any; // El array de preguntas se guarda en JSON
}

export class IntentarEvaluacionDto_jf {
  @IsNotEmpty()
  respuestasAlumnoJson_jf: any;
}

export class CrearSalaVideollamadaDto_jf {
  @IsInt()
  @IsNotEmpty()
  id_curso_sala_jf: number;

  @IsString()
  @IsNotEmpty()
  titulo_jf: string;

  @IsNotEmpty()
  fechaProgramada_jf: string;
}
