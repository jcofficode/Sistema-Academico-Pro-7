-- CreateTable
CREATE TABLE "td_bloques_jf" (
    "id_bloque_jf" SERIAL NOT NULL,
    "id_curso_bloque_jf" INTEGER NOT NULL,
    "nombre_jf" VARCHAR(200) NOT NULL,
    "descripcion_jf" TEXT,
    "orden_jf" INTEGER NOT NULL,
    "creadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_bloques_jf_pkey" PRIMARY KEY ("id_bloque_jf")
);

-- CreateTable
CREATE TABLE "td_lecciones_jf" (
    "id_leccion_jf" SERIAL NOT NULL,
    "id_bloque_leccion_jf" INTEGER NOT NULL,
    "titulo_jf" VARCHAR(200) NOT NULL,
    "descripcion_jf" TEXT,
    "orden_jf" INTEGER NOT NULL,
    "tipo_jf" VARCHAR(20) NOT NULL,
    "urlArchivo_jf" TEXT,
    "contenidoTexto_jf" TEXT,
    "creadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_lecciones_jf_pkey" PRIMARY KEY ("id_leccion_jf")
);

-- CreateTable
CREATE TABLE "td_progreso_lecciones_jf" (
    "id_progreso_jf" SERIAL NOT NULL,
    "id_inscripcion_progreso_jf" INTEGER NOT NULL,
    "id_leccion_progreso_jf" INTEGER NOT NULL,
    "id_usuario_alumno_jf" INTEGER NOT NULL,
    "completada_jf" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeVisto_jf" DECIMAL(5,2),
    "actualizadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_progreso_lecciones_jf_pkey" PRIMARY KEY ("id_progreso_jf")
);

-- CreateTable
CREATE TABLE "td_evaluaciones_jf" (
    "id_evaluacion_jf" SERIAL NOT NULL,
    "id_bloque_evaluacion_jf" INTEGER NOT NULL,
    "titulo_jf" VARCHAR(200) NOT NULL,
    "descripcion_jf" TEXT,
    "notaMinima_jf" DECIMAL(5,2) NOT NULL,
    "intentosMaximos_jf" INTEGER NOT NULL DEFAULT 3,
    "preguntasJson_jf" JSONB NOT NULL,
    "creadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_evaluaciones_jf_pkey" PRIMARY KEY ("id_evaluacion_jf")
);

-- CreateTable
CREATE TABLE "td_intento_evaluacion_jf" (
    "id_intento_jf" SERIAL NOT NULL,
    "id_evaluacion_intento_jf" INTEGER NOT NULL,
    "id_inscripcion_intento_jf" INTEGER NOT NULL,
    "id_usuario_alumno_jf" INTEGER NOT NULL,
    "notaObtenida_jf" DECIMAL(5,2) NOT NULL,
    "aprobado_jf" BOOLEAN NOT NULL DEFAULT false,
    "respuestasAlumnoJson_jf" JSONB NOT NULL,
    "fechaIntento_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_intento_evaluacion_jf_pkey" PRIMARY KEY ("id_intento_jf")
);

-- CreateTable
CREATE TABLE "td_salas_videollamadas_jf" (
    "id_sala_jf" SERIAL NOT NULL,
    "id_curso_sala_jf" INTEGER NOT NULL,
    "id_usuario_creador_jf" INTEGER NOT NULL,
    "nombreSala_jf" VARCHAR(100) NOT NULL,
    "titulo_jf" VARCHAR(200) NOT NULL,
    "estado_jf" VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
    "fechaProgramada_jf" TIMESTAMP(6) NOT NULL,
    "fechaInicioReal_jf" TIMESTAMP(6),
    "fechaFinReal_jf" TIMESTAMP(6),
    "duracionSegundos_jf" INTEGER DEFAULT 0,
    "creadoEn_jf" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_salas_videollamadas_jf_pkey" PRIMARY KEY ("id_sala_jf")
);

-- CreateTable
CREATE TABLE "td_auditoria_multimedia_jf" (
    "id_auditoria_jf" SERIAL NOT NULL,
    "tabla_jf" VARCHAR(50) NOT NULL,
    "operacion_jf" VARCHAR(20) NOT NULL,
    "registro_id_jf" INTEGER NOT NULL,
    "datos_anteriores_jf" JSONB,
    "datos_nuevos_jf" JSONB,
    "usuario_jf" VARCHAR(100),
    "fecha_jf" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_auditoria_multimedia_jf_pkey" PRIMARY KEY ("id_auditoria_jf")
);

-- CreateIndex
CREATE UNIQUE INDEX "td_progreso_lecciones_jf_id_inscripcion_progreso_jf_id_lecc_key" ON "td_progreso_lecciones_jf"("id_inscripcion_progreso_jf", "id_leccion_progreso_jf");

-- CreateIndex
CREATE UNIQUE INDEX "td_evaluaciones_jf_id_bloque_evaluacion_jf_key" ON "td_evaluaciones_jf"("id_bloque_evaluacion_jf");

-- AddForeignKey
ALTER TABLE "td_bloques_jf" ADD CONSTRAINT "td_bloques_jf_id_curso_bloque_jf_fkey" FOREIGN KEY ("id_curso_bloque_jf") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_lecciones_jf" ADD CONSTRAINT "td_lecciones_jf_id_bloque_leccion_jf_fkey" FOREIGN KEY ("id_bloque_leccion_jf") REFERENCES "td_bloques_jf"("id_bloque_jf") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_progreso_lecciones_jf" ADD CONSTRAINT "td_progreso_lecciones_jf_id_inscripcion_progreso_jf_fkey" FOREIGN KEY ("id_inscripcion_progreso_jf") REFERENCES "td_inscripcion_ahbb"("id_inscripcion_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_progreso_lecciones_jf" ADD CONSTRAINT "td_progreso_lecciones_jf_id_leccion_progreso_jf_fkey" FOREIGN KEY ("id_leccion_progreso_jf") REFERENCES "td_lecciones_jf"("id_leccion_jf") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_progreso_lecciones_jf" ADD CONSTRAINT "td_progreso_lecciones_jf_id_usuario_alumno_jf_fkey" FOREIGN KEY ("id_usuario_alumno_jf") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_evaluaciones_jf" ADD CONSTRAINT "td_evaluaciones_jf_id_bloque_evaluacion_jf_fkey" FOREIGN KEY ("id_bloque_evaluacion_jf") REFERENCES "td_bloques_jf"("id_bloque_jf") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_intento_evaluacion_jf" ADD CONSTRAINT "td_intento_evaluacion_jf_id_evaluacion_intento_jf_fkey" FOREIGN KEY ("id_evaluacion_intento_jf") REFERENCES "td_evaluaciones_jf"("id_evaluacion_jf") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_intento_evaluacion_jf" ADD CONSTRAINT "td_intento_evaluacion_jf_id_inscripcion_intento_jf_fkey" FOREIGN KEY ("id_inscripcion_intento_jf") REFERENCES "td_inscripcion_ahbb"("id_inscripcion_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_intento_evaluacion_jf" ADD CONSTRAINT "td_intento_evaluacion_jf_id_usuario_alumno_jf_fkey" FOREIGN KEY ("id_usuario_alumno_jf") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_salas_videollamadas_jf" ADD CONSTRAINT "td_salas_videollamadas_jf_id_curso_sala_jf_fkey" FOREIGN KEY ("id_curso_sala_jf") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_salas_videollamadas_jf" ADD CONSTRAINT "td_salas_videollamadas_jf_id_usuario_creador_jf_fkey" FOREIGN KEY ("id_usuario_creador_jf") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;
