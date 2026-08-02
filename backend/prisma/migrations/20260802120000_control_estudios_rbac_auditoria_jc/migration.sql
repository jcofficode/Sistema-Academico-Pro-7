-- ═══════════════════════════════════════════════════════════════
-- Ampliación del módulo de Control de Estudios (_jc)
--   · Las reparaciones dejan de configurarse en el plan de evaluación
--     y pasan a registrarse por corte durante la carga de notas.
--   · Certificados de sobresaliente, notificaciones y bitácora de auditoría.
-- ═══════════════════════════════════════════════════════════════

-- Los ítems marcados como "recuperación" ya no son parte del plan:
-- se eliminan junto con sus notas antes de retirar la columna.
DELETE FROM "td_item_evaluacion_jc" WHERE "esRecuperacion_jc" = true;

-- AlterTable
ALTER TABLE "td_acta_jc" ALTER COLUMN "tipo_jc" SET DEFAULT 'BLANCA';

-- AlterTable
ALTER TABLE "td_item_evaluacion_jc" DROP COLUMN "esRecuperacion_jc";

-- CreateTable
CREATE TABLE "td_reparacion_jc" (
    "id_reparacion_jc" SERIAL NOT NULL,
    "valor_jc" DECIMAL(5,2) NOT NULL,
    "observacion_jc" VARCHAR(250),
    "id_inscripcion_materia_rep_jc" INTEGER NOT NULL,
    "id_item_rep_jc" INTEGER NOT NULL,
    "registradoPorUsuarioId_jc" INTEGER,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_reparacion_jc_pkey" PRIMARY KEY ("id_reparacion_jc")
);

-- CreateTable
CREATE TABLE "td_certificado_sobresaliente_jc" (
    "id_certificado_sob_jc" SERIAL NOT NULL,
    "codigo_jc" VARCHAR(60) NOT NULL,
    "notaFinal_jc" DECIMAL(5,2) NOT NULL,
    "hashVerificacion_jc" VARCHAR(64) NOT NULL,
    "id_inscripcion_materia_cer_jc" INTEGER NOT NULL,
    "id_alumno_cer_jc" INTEGER NOT NULL,
    "emitidoPorUsuarioId_jc" INTEGER,
    "anulado_jc" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_certificado_sobresaliente_jc_pkey" PRIMARY KEY ("id_certificado_sob_jc")
);

-- CreateTable
CREATE TABLE "td_notificacion_jc" (
    "id_notificacion_jc" SERIAL NOT NULL,
    "titulo_jc" VARCHAR(150) NOT NULL,
    "mensaje_jc" TEXT NOT NULL,
    "tipo_jc" VARCHAR(30) NOT NULL DEFAULT 'INFORMATIVA',
    "icono_jc" VARCHAR(60),
    "enlace_jc" VARCHAR(250),
    "leida_jc" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_not_jc" INTEGER NOT NULL,
    "creadoEn_jc" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_notificacion_jc_pkey" PRIMARY KEY ("id_notificacion_jc")
);

-- CreateTable
CREATE TABLE "td_auditoria_jc" (
    "id_auditoria_jc" SERIAL NOT NULL,
    "modulo_jc" VARCHAR(40) NOT NULL,
    "accion_jc" VARCHAR(60) NOT NULL,
    "descripcion_jc" TEXT NOT NULL,
    "resultado_jc" VARCHAR(15) NOT NULL DEFAULT 'EXITO',
    "id_usuario_auditoria_jc" INTEGER,
    "nombreUsuario_jc" VARCHAR(200),
    "rolUsuario_jc" VARCHAR(30),
    "id_afectado_jc" INTEGER,
    "id_materia_aud_jc" INTEGER,
    "id_periodo_aud_jc" INTEGER,
    "entidad_jc" VARCHAR(60),
    "id_entidad_jc" INTEGER,
    "metodo_jc" VARCHAR(10),
    "ruta_jc" VARCHAR(250),
    "estadoHttp_jc" INTEGER,
    "duracionMs_jc" INTEGER,
    "ip_jc" VARCHAR(60),
    "detalle_jc" JSONB,
    "creadoEn_jc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_auditoria_jc_pkey" PRIMARY KEY ("id_auditoria_jc")
);

-- CreateIndex
CREATE UNIQUE INDEX "td_reparacion_jc_id_inscripcion_materia_rep_jc_id_item_rep__key" ON "td_reparacion_jc"("id_inscripcion_materia_rep_jc", "id_item_rep_jc");

-- CreateIndex
CREATE UNIQUE INDEX "td_certificado_sobresaliente_jc_codigo_jc_key" ON "td_certificado_sobresaliente_jc"("codigo_jc");

-- CreateIndex
CREATE UNIQUE INDEX "td_certificado_sobresaliente_jc_id_inscripcion_materia_cer__key" ON "td_certificado_sobresaliente_jc"("id_inscripcion_materia_cer_jc");

-- CreateIndex
CREATE INDEX "td_certificado_sobresaliente_jc_id_alumno_cer_jc_idx" ON "td_certificado_sobresaliente_jc"("id_alumno_cer_jc");

-- CreateIndex
CREATE INDEX "td_notificacion_jc_id_usuario_not_jc_leida_jc_idx" ON "td_notificacion_jc"("id_usuario_not_jc", "leida_jc");

-- CreateIndex
CREATE INDEX "td_auditoria_jc_modulo_jc_creadoEn_jc_idx" ON "td_auditoria_jc"("modulo_jc", "creadoEn_jc");

-- CreateIndex
CREATE INDEX "td_auditoria_jc_id_usuario_auditoria_jc_idx" ON "td_auditoria_jc"("id_usuario_auditoria_jc");

-- CreateIndex
CREATE INDEX "td_auditoria_jc_accion_jc_idx" ON "td_auditoria_jc"("accion_jc");

-- AddForeignKey
ALTER TABLE "td_reparacion_jc" ADD CONSTRAINT "td_reparacion_jc_id_inscripcion_materia_rep_jc_fkey" FOREIGN KEY ("id_inscripcion_materia_rep_jc") REFERENCES "td_inscripcion_materia_cjgp"("id_inscripcion_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_reparacion_jc" ADD CONSTRAINT "td_reparacion_jc_id_item_rep_jc_fkey" FOREIGN KEY ("id_item_rep_jc") REFERENCES "td_item_evaluacion_jc"("id_item_jc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_reparacion_jc" ADD CONSTRAINT "td_reparacion_jc_registradoPorUsuarioId_jc_fkey" FOREIGN KEY ("registradoPorUsuarioId_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_certificado_sobresaliente_jc" ADD CONSTRAINT "td_certificado_sobresaliente_jc_id_inscripcion_materia_cer_fkey" FOREIGN KEY ("id_inscripcion_materia_cer_jc") REFERENCES "td_inscripcion_materia_cjgp"("id_inscripcion_materia_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_certificado_sobresaliente_jc" ADD CONSTRAINT "td_certificado_sobresaliente_jc_id_alumno_cer_jc_fkey" FOREIGN KEY ("id_alumno_cer_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_certificado_sobresaliente_jc" ADD CONSTRAINT "td_certificado_sobresaliente_jc_emitidoPorUsuarioId_jc_fkey" FOREIGN KEY ("emitidoPorUsuarioId_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_notificacion_jc" ADD CONSTRAINT "td_notificacion_jc_id_usuario_not_jc_fkey" FOREIGN KEY ("id_usuario_not_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_auditoria_jc" ADD CONSTRAINT "td_auditoria_jc_id_usuario_auditoria_jc_fkey" FOREIGN KEY ("id_usuario_auditoria_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_auditoria_jc" ADD CONSTRAINT "td_auditoria_jc_id_afectado_jc_fkey" FOREIGN KEY ("id_afectado_jc") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;
