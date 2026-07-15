-- CreateTable
CREATE TABLE "td_carrera_cjgp" (
    "id_carrera_cjgp" SERIAL NOT NULL,
    "codigo_cjgp" VARCHAR(20) NOT NULL,
    "nombre_cjgp" VARCHAR(200) NOT NULL,
    "descripcion_cjgp" TEXT,
    "regimen_cjgp" VARCHAR(20) NOT NULL DEFAULT 'SEMESTRAL',
    "duracionAnios_cjgp" INTEGER NOT NULL,
    "limiteCreditos_cjgp" INTEGER NOT NULL DEFAULT 21,
    "estado_cjgp" VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    "creadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_carrera_cjgp_pkey" PRIMARY KEY ("id_carrera_cjgp")
);

-- CreateTable
CREATE TABLE "td_materia_cjgp" (
    "id_materia_cjgp" SERIAL NOT NULL,
    "codigo_cjgp" VARCHAR(20) NOT NULL,
    "nombre_cjgp" VARCHAR(200) NOT NULL,
    "creditos_cjgp" INTEGER NOT NULL,
    "nroBloque_cjgp" INTEGER NOT NULL,
    "id_carrera_materia_cjgp" INTEGER NOT NULL,
    "creadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_materia_cjgp_pkey" PRIMARY KEY ("id_materia_cjgp")
);

-- CreateTable
CREATE TABLE "td_prelacion_cjgp" (
    "id_prelacion_cjgp" SERIAL NOT NULL,
    "id_materia_cjgp" INTEGER NOT NULL,
    "id_materia_requisito_cjgp" INTEGER NOT NULL,

    CONSTRAINT "td_prelacion_cjgp_pkey" PRIMARY KEY ("id_prelacion_cjgp")
);

-- CreateTable
CREATE TABLE "td_periodo_academico_cjgp" (
    "id_periodo_cjgp" SERIAL NOT NULL,
    "nombre_cjgp" VARCHAR(30) NOT NULL,
    "fechaInicio_cjgp" DATE NOT NULL,
    "fechaFin_cjgp" DATE NOT NULL,
    "activo_cjgp" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_periodo_academico_cjgp_pkey" PRIMARY KEY ("id_periodo_cjgp")
);

-- CreateTable
CREATE TABLE "td_inscripcion_materia_cjgp" (
    "id_inscripcion_materia_cjgp" SERIAL NOT NULL,
    "estatus_cjgp" VARCHAR(20) NOT NULL DEFAULT 'INSCRITO',
    "notaFinal_cjgp" DECIMAL(5,2),
    "id_usuario_im_cjgp" INTEGER NOT NULL,
    "id_materia_im_cjgp" INTEGER NOT NULL,
    "id_periodo_im_cjgp" INTEGER NOT NULL,
    "creadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_cjgp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_inscripcion_materia_cjgp_pkey" PRIMARY KEY ("id_inscripcion_materia_cjgp")
);

-- CreateTable
CREATE TABLE "td_plan_evaluacion_jc" (
    "id_plan_jc" SERIAL NOT NULL,
    "nombre_jc" VARCHAR(150) NOT NULL,
    "notaMaxima_jc" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "notaAprobatoria_jc" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "estado_jc" VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    "id_periodo_plan_jc" INTEGER NOT NULL,
    "id_carrera_plan_jc" INTEGER,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_plan_evaluacion_jc_pkey" PRIMARY KEY ("id_plan_jc")
);

-- CreateTable
CREATE TABLE "td_item_evaluacion_jc" (
    "id_item_jc" SERIAL NOT NULL,
    "nombre_jc" VARCHAR(100) NOT NULL,
    "orden_jc" INTEGER NOT NULL,
    "peso_jc" DECIMAL(5,2) NOT NULL,
    "esRecuperacion_jc" BOOLEAN NOT NULL DEFAULT false,
    "id_plan_item_jc" INTEGER NOT NULL,

    CONSTRAINT "td_item_evaluacion_jc_pkey" PRIMARY KEY ("id_item_jc")
);

-- CreateTable
CREATE TABLE "td_calificacion_jc" (
    "id_calificacion_jc" SERIAL NOT NULL,
    "valor_jc" DECIMAL(5,2) NOT NULL,
    "id_inscripcion_materia_cal_jc" INTEGER NOT NULL,
    "id_item_cal_jc" INTEGER NOT NULL,
    "cargadoPorUsuarioId_jc" INTEGER,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_calificacion_jc_pkey" PRIMARY KEY ("id_calificacion_jc")
);

-- CreateTable
CREATE TABLE "td_acta_jc" (
    "id_acta_jc" SERIAL NOT NULL,
    "codigo_jc" VARCHAR(60) NOT NULL,
    "tipo_jc" VARCHAR(10) NOT NULL,
    "hashVerificacion_jc" VARCHAR(64) NOT NULL,
    "id_materia_acta_jc" INTEGER NOT NULL,
    "id_periodo_acta_jc" INTEGER NOT NULL,
    "generadaPorUsuarioId_jc" INTEGER NOT NULL,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_acta_jc_pkey" PRIMARY KEY ("id_acta_jc")
);

-- CreateIndex
CREATE UNIQUE INDEX "td_carrera_cjgp_codigo_cjgp_key" ON "td_carrera_cjgp"("codigo_cjgp");

-- CreateIndex
CREATE UNIQUE INDEX "td_materia_cjgp_id_carrera_materia_cjgp_codigo_cjgp_key" ON "td_materia_cjgp"("id_carrera_materia_cjgp", "codigo_cjgp");

-- CreateIndex
CREATE UNIQUE INDEX "td_prelacion_cjgp_id_materia_cjgp_id_materia_requisito_cjgp_key" ON "td_prelacion_cjgp"("id_materia_cjgp", "id_materia_requisito_cjgp");

-- CreateIndex
CREATE UNIQUE INDEX "td_periodo_academico_cjgp_nombre_cjgp_key" ON "td_periodo_academico_cjgp"("nombre_cjgp");

-- CreateIndex
CREATE INDEX "td_inscripcion_materia_cjgp_id_usuario_im_cjgp_id_periodo_i_idx" ON "td_inscripcion_materia_cjgp"("id_usuario_im_cjgp", "id_periodo_im_cjgp");

-- CreateIndex
CREATE UNIQUE INDEX "td_inscripcion_materia_cjgp_id_usuario_im_cjgp_id_materia_i_key" ON "td_inscripcion_materia_cjgp"("id_usuario_im_cjgp", "id_materia_im_cjgp", "id_periodo_im_cjgp");

-- CreateIndex
CREATE UNIQUE INDEX "td_plan_evaluacion_jc_id_periodo_plan_jc_id_carrera_plan_jc_key" ON "td_plan_evaluacion_jc"("id_periodo_plan_jc", "id_carrera_plan_jc");

-- CreateIndex
CREATE UNIQUE INDEX "td_item_evaluacion_jc_id_plan_item_jc_orden_jc_key" ON "td_item_evaluacion_jc"("id_plan_item_jc", "orden_jc");

-- CreateIndex
CREATE UNIQUE INDEX "td_calificacion_jc_id_inscripcion_materia_cal_jc_id_item_ca_key" ON "td_calificacion_jc"("id_inscripcion_materia_cal_jc", "id_item_cal_jc");

-- CreateIndex
CREATE UNIQUE INDEX "td_acta_jc_codigo_jc_key" ON "td_acta_jc"("codigo_jc");

-- AddForeignKey
ALTER TABLE "td_materia_cjgp" ADD CONSTRAINT "td_materia_cjgp_id_carrera_materia_cjgp_fkey" FOREIGN KEY ("id_carrera_materia_cjgp") REFERENCES "td_carrera_cjgp"("id_carrera_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_prelacion_cjgp" ADD CONSTRAINT "td_prelacion_cjgp_id_materia_cjgp_fkey" FOREIGN KEY ("id_materia_cjgp") REFERENCES "td_materia_cjgp"("id_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_prelacion_cjgp" ADD CONSTRAINT "td_prelacion_cjgp_id_materia_requisito_cjgp_fkey" FOREIGN KEY ("id_materia_requisito_cjgp") REFERENCES "td_materia_cjgp"("id_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_inscripcion_materia_cjgp" ADD CONSTRAINT "td_inscripcion_materia_cjgp_id_usuario_im_cjgp_fkey" FOREIGN KEY ("id_usuario_im_cjgp") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_inscripcion_materia_cjgp" ADD CONSTRAINT "td_inscripcion_materia_cjgp_id_materia_im_cjgp_fkey" FOREIGN KEY ("id_materia_im_cjgp") REFERENCES "td_materia_cjgp"("id_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_inscripcion_materia_cjgp" ADD CONSTRAINT "td_inscripcion_materia_cjgp_id_periodo_im_cjgp_fkey" FOREIGN KEY ("id_periodo_im_cjgp") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_evaluacion_jc" ADD CONSTRAINT "td_plan_evaluacion_jc_id_periodo_plan_jc_fkey" FOREIGN KEY ("id_periodo_plan_jc") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_plan_evaluacion_jc" ADD CONSTRAINT "td_plan_evaluacion_jc_id_carrera_plan_jc_fkey" FOREIGN KEY ("id_carrera_plan_jc") REFERENCES "td_carrera_cjgp"("id_carrera_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_item_evaluacion_jc" ADD CONSTRAINT "td_item_evaluacion_jc_id_plan_item_jc_fkey" FOREIGN KEY ("id_plan_item_jc") REFERENCES "td_plan_evaluacion_jc"("id_plan_jc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_calificacion_jc" ADD CONSTRAINT "td_calificacion_jc_id_inscripcion_materia_cal_jc_fkey" FOREIGN KEY ("id_inscripcion_materia_cal_jc") REFERENCES "td_inscripcion_materia_cjgp"("id_inscripcion_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_calificacion_jc" ADD CONSTRAINT "td_calificacion_jc_id_item_cal_jc_fkey" FOREIGN KEY ("id_item_cal_jc") REFERENCES "td_item_evaluacion_jc"("id_item_jc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_calificacion_jc" ADD CONSTRAINT "td_calificacion_jc_cargadoPorUsuarioId_jc_fkey" FOREIGN KEY ("cargadoPorUsuarioId_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_acta_jc" ADD CONSTRAINT "td_acta_jc_id_materia_acta_jc_fkey" FOREIGN KEY ("id_materia_acta_jc") REFERENCES "td_materia_cjgp"("id_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_acta_jc" ADD CONSTRAINT "td_acta_jc_id_periodo_acta_jc_fkey" FOREIGN KEY ("id_periodo_acta_jc") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_acta_jc" ADD CONSTRAINT "td_acta_jc_generadaPorUsuarioId_jc_fkey" FOREIGN KEY ("generadaPorUsuarioId_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;
