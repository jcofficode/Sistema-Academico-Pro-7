-- CreateTable
CREATE TABLE "td_plantilla_plan_ga" (
    "id_plantilla_ga" SERIAL NOT NULL,
    "id_periodo_ga" INTEGER NOT NULL,
    "nombre_ga" VARCHAR(200) NOT NULL,
    "tipo_valoracion_ga" VARCHAR(20) NOT NULL,
    "escala_min_ga" DECIMAL(5,2),
    "escala_max_ga" DECIMAL(5,2),
    "ponderado_ga" BOOLEAN NOT NULL DEFAULT false,
    "estado_ga" VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    "creadoEn_ga" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ga" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_plantilla_plan_ga_pkey" PRIMARY KEY ("id_plantilla_ga")
);

-- CreateTable
CREATE TABLE "td_seccion_plantilla_ga" (
    "id_seccion_ga" SERIAL NOT NULL,
    "id_plantilla_seccion_ga" INTEGER NOT NULL,
    "nombre_ga" VARCHAR(200) NOT NULL,
    "orden_ga" INTEGER NOT NULL,
    "obligatoria_ga" BOOLEAN NOT NULL DEFAULT true,
    "tipo_contenido_ga" VARCHAR(20) NOT NULL,

    CONSTRAINT "td_seccion_plantilla_ga_pkey" PRIMARY KEY ("id_seccion_ga")
);

-- CreateTable
CREATE TABLE "td_nivel_cualitativo_ga" (
    "id_nivel_ga" SERIAL NOT NULL,
    "id_plantilla_nivel_ga" INTEGER NOT NULL,
    "etiqueta_ga" VARCHAR(100) NOT NULL,
    "descripcion_ga" VARCHAR(500),
    "orden_ga" INTEGER NOT NULL,

    CONSTRAINT "td_nivel_cualitativo_ga_pkey" PRIMARY KEY ("id_nivel_ga")
);

-- CreateTable
CREATE TABLE "td_plan_estudio_ga" (
    "id_plan_estudio_ga" SERIAL NOT NULL,
    "id_materia_ga" INTEGER NOT NULL,
    "id_periodo_ga" INTEGER NOT NULL,
    "id_profesor_ga" INTEGER NOT NULL,
    "id_plantilla_ga" INTEGER NOT NULL,
    "estado_ga" VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    "codigo_ga" VARCHAR(80),
    "hashVerificacion_ga" VARCHAR(64),
    "creadoEn_ga" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ga" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_plan_estudio_ga_pkey" PRIMARY KEY ("id_plan_estudio_ga")
);

-- CreateTable
CREATE TABLE "td_contenido_seccion_ga" (
    "id_contenido_ga" SERIAL NOT NULL,
    "id_plan_contenido_ga" INTEGER NOT NULL,
    "id_seccion_contenido_ga" INTEGER NOT NULL,
    "texto_ga" TEXT,

    CONSTRAINT "td_contenido_seccion_ga_pkey" PRIMARY KEY ("id_contenido_ga")
);

-- CreateTable
CREATE TABLE "td_unidad_ga" (
    "id_unidad_ga" SERIAL NOT NULL,
    "id_plan_unidad_ga" INTEGER NOT NULL,
    "nombre_ga" VARCHAR(200) NOT NULL,
    "orden_ga" INTEGER NOT NULL,
    "fecha_inicio_ga" DATE NOT NULL,
    "fecha_fin_ga" DATE NOT NULL,
    "id_item_evaluacion_ga" INTEGER,

    CONSTRAINT "td_unidad_ga_pkey" PRIMARY KEY ("id_unidad_ga")
);

-- CreateTable
CREATE TABLE "td_indicador_ga" (
    "id_indicador_ga" SERIAL NOT NULL,
    "id_unidad_indicador_ga" INTEGER NOT NULL,
    "descripcion_ga" VARCHAR(500) NOT NULL,
    "orden_ga" INTEGER NOT NULL,
    "valor_ga" DECIMAL(5,2),
    "id_nivel_ga" INTEGER,

    CONSTRAINT "td_indicador_ga_pkey" PRIMARY KEY ("id_indicador_ga")
);

-- CreateTable
CREATE TABLE "td_revision_plan_ga" (
    "id_revision_ga" SERIAL NOT NULL,
    "id_plan_revision_ga" INTEGER NOT NULL,
    "id_revisor_ga" INTEGER NOT NULL,
    "accion_ga" VARCHAR(20) NOT NULL,
    "observacion_ga" TEXT,
    "creadoEn_ga" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_revision_plan_ga_pkey" PRIMARY KEY ("id_revision_ga")
);

-- CreateIndex
CREATE UNIQUE INDEX "td_plantilla_plan_ga_id_periodo_ga_key" ON "td_plantilla_plan_ga"("id_periodo_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_seccion_plantilla_ga_id_plantilla_seccion_ga_orden_ga_key" ON "td_seccion_plantilla_ga"("id_plantilla_seccion_ga", "orden_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_nivel_cualitativo_ga_id_plantilla_nivel_ga_orden_ga_key" ON "td_nivel_cualitativo_ga"("id_plantilla_nivel_ga", "orden_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_plan_estudio_ga_codigo_ga_key" ON "td_plan_estudio_ga"("codigo_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_plan_estudio_ga_id_materia_ga_id_periodo_ga_key" ON "td_plan_estudio_ga"("id_materia_ga", "id_periodo_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_contenido_seccion_ga_id_plan_contenido_ga_id_seccion_con_key" ON "td_contenido_seccion_ga"("id_plan_contenido_ga", "id_seccion_contenido_ga");

-- CreateIndex
CREATE UNIQUE INDEX "td_unidad_ga_id_plan_unidad_ga_orden_ga_key" ON "td_unidad_ga"("id_plan_unidad_ga", "orden_ga");

-- AddForeignKey
ALTER TABLE "td_plantilla_plan_ga" ADD CONSTRAINT "td_plantilla_plan_ga_id_periodo_ga_fkey" FOREIGN KEY ("id_periodo_ga") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_seccion_plantilla_ga" ADD CONSTRAINT "td_seccion_plantilla_ga_id_plantilla_seccion_ga_fkey" FOREIGN KEY ("id_plantilla_seccion_ga") REFERENCES "td_plantilla_plan_ga"("id_plantilla_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_nivel_cualitativo_ga" ADD CONSTRAINT "td_nivel_cualitativo_ga_id_plantilla_nivel_ga_fkey" FOREIGN KEY ("id_plantilla_nivel_ga") REFERENCES "td_plantilla_plan_ga"("id_plantilla_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_estudio_ga" ADD CONSTRAINT "td_plan_estudio_ga_id_materia_ga_fkey" FOREIGN KEY ("id_materia_ga") REFERENCES "td_materia_cjgp"("id_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_estudio_ga" ADD CONSTRAINT "td_plan_estudio_ga_id_periodo_ga_fkey" FOREIGN KEY ("id_periodo_ga") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_estudio_ga" ADD CONSTRAINT "td_plan_estudio_ga_id_profesor_ga_fkey" FOREIGN KEY ("id_profesor_ga") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_estudio_ga" ADD CONSTRAINT "td_plan_estudio_ga_id_plantilla_ga_fkey" FOREIGN KEY ("id_plantilla_ga") REFERENCES "td_plantilla_plan_ga"("id_plantilla_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_contenido_seccion_ga" ADD CONSTRAINT "td_contenido_seccion_ga_id_plan_contenido_ga_fkey" FOREIGN KEY ("id_plan_contenido_ga") REFERENCES "td_plan_estudio_ga"("id_plan_estudio_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_contenido_seccion_ga" ADD CONSTRAINT "td_contenido_seccion_ga_id_seccion_contenido_ga_fkey" FOREIGN KEY ("id_seccion_contenido_ga") REFERENCES "td_seccion_plantilla_ga"("id_seccion_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_unidad_ga" ADD CONSTRAINT "td_unidad_ga_id_plan_unidad_ga_fkey" FOREIGN KEY ("id_plan_unidad_ga") REFERENCES "td_plan_estudio_ga"("id_plan_estudio_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_unidad_ga" ADD CONSTRAINT "td_unidad_ga_id_item_evaluacion_ga_fkey" FOREIGN KEY ("id_item_evaluacion_ga") REFERENCES "td_item_evaluacion_jc"("id_item_jc") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_indicador_ga" ADD CONSTRAINT "td_indicador_ga_id_unidad_indicador_ga_fkey" FOREIGN KEY ("id_unidad_indicador_ga") REFERENCES "td_unidad_ga"("id_unidad_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_indicador_ga" ADD CONSTRAINT "td_indicador_ga_id_nivel_ga_fkey" FOREIGN KEY ("id_nivel_ga") REFERENCES "td_nivel_cualitativo_ga"("id_nivel_ga") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_revision_plan_ga" ADD CONSTRAINT "td_revision_plan_ga_id_plan_revision_ga_fkey" FOREIGN KEY ("id_plan_revision_ga") REFERENCES "td_plan_estudio_ga"("id_plan_estudio_ga") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_revision_plan_ga" ADD CONSTRAINT "td_revision_plan_ga_id_revisor_ga_fkey" FOREIGN KEY ("id_revisor_ga") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;
