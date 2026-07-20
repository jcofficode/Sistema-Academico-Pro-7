-- CreateTable
CREATE TABLE "td_tarifa_ap" (
    "id_tarifa_ap" SERIAL NOT NULL,
    "concepto_ap" VARCHAR(20) NOT NULL,
    "id_curso_ap" INTEGER,
    "monto_ap" DECIMAL(10,2) NOT NULL,
    "descripcion_ap" VARCHAR(255),
    "activa_ap" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_tarifa_ap_pkey" PRIMARY KEY ("id_tarifa_ap")
);

-- CreateTable
CREATE TABLE "td_pago_ap" (
    "id_pago_ap" SERIAL NOT NULL,
    "id_usuario_ap" INTEGER NOT NULL,
    "id_periodo_ap" INTEGER,
    "id_curso_pago_ap" INTEGER,
    "id_tarifa_ap" INTEGER NOT NULL,
    "concepto_ap" VARCHAR(20) NOT NULL,
    "monto_ap" DECIMAL(10,2) NOT NULL,
    "referencia_ap" VARCHAR(120) NOT NULL,
    "estado_ap" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "observacion_ap" TEXT,
    "confirmadoPorId_ap" INTEGER,
    "confirmadoEn_ap" TIMESTAMP(6),
    "creadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_pago_ap_pkey" PRIMARY KEY ("id_pago_ap")
);

-- CreateTable
CREATE TABLE "td_contrato_profesor_ap" (
    "id_contrato_ap" SERIAL NOT NULL,
    "id_profesor_ap" INTEGER NOT NULL,
    "tipo_ap" VARCHAR(20) NOT NULL,
    "monto_ap" DECIMAL(10,2) NOT NULL,
    "activo_ap" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_contrato_profesor_ap_pkey" PRIMARY KEY ("id_contrato_ap")
);

-- CreateTable
CREATE TABLE "td_nomina_ap" (
    "id_nomina_ap" SERIAL NOT NULL,
    "id_contrato_ap" INTEGER NOT NULL,
    "id_periodo_ap" INTEGER NOT NULL,
    "horas_ap" DECIMAL(8,2),
    "monto_calculado_ap" DECIMAL(10,2) NOT NULL,
    "estado_ap" VARCHAR(20) NOT NULL DEFAULT 'SIMULADO',
    "creadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_nomina_ap_pkey" PRIMARY KEY ("id_nomina_ap")
);

-- CreateTable
CREATE TABLE "td_recibo_pago_ap" (
    "id_recibo_ap" SERIAL NOT NULL,
    "id_pago_ap" INTEGER,
    "id_nomina_ap" INTEGER,
    "codigo_ap" VARCHAR(80) NOT NULL,
    "hashVerificacion_ap" VARCHAR(64) NOT NULL,
    "creadoEn_ap" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_recibo_pago_ap_pkey" PRIMARY KEY ("id_recibo_ap")
);

-- CreateIndex
CREATE INDEX "td_pago_ap_id_usuario_ap_id_periodo_ap_estado_ap_idx" ON "td_pago_ap"("id_usuario_ap", "id_periodo_ap", "estado_ap");

-- CreateIndex
CREATE UNIQUE INDEX "td_contrato_profesor_ap_id_profesor_ap_key" ON "td_contrato_profesor_ap"("id_profesor_ap");

-- CreateIndex
CREATE UNIQUE INDEX "td_nomina_ap_id_contrato_ap_id_periodo_ap_key" ON "td_nomina_ap"("id_contrato_ap", "id_periodo_ap");

-- CreateIndex
CREATE UNIQUE INDEX "td_recibo_pago_ap_id_pago_ap_key" ON "td_recibo_pago_ap"("id_pago_ap");

-- CreateIndex
CREATE UNIQUE INDEX "td_recibo_pago_ap_id_nomina_ap_key" ON "td_recibo_pago_ap"("id_nomina_ap");

-- CreateIndex
CREATE UNIQUE INDEX "td_recibo_pago_ap_codigo_ap_key" ON "td_recibo_pago_ap"("codigo_ap");

-- AddForeignKey
ALTER TABLE "td_tarifa_ap" ADD CONSTRAINT "td_tarifa_ap_id_curso_ap_fkey" FOREIGN KEY ("id_curso_ap") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_pago_ap" ADD CONSTRAINT "td_pago_ap_id_usuario_ap_fkey" FOREIGN KEY ("id_usuario_ap") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_pago_ap" ADD CONSTRAINT "td_pago_ap_id_periodo_ap_fkey" FOREIGN KEY ("id_periodo_ap") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_pago_ap" ADD CONSTRAINT "td_pago_ap_id_curso_pago_ap_fkey" FOREIGN KEY ("id_curso_pago_ap") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_pago_ap" ADD CONSTRAINT "td_pago_ap_id_tarifa_ap_fkey" FOREIGN KEY ("id_tarifa_ap") REFERENCES "td_tarifa_ap"("id_tarifa_ap") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_pago_ap" ADD CONSTRAINT "td_pago_ap_confirmadoPorId_ap_fkey" FOREIGN KEY ("confirmadoPorId_ap") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_contrato_profesor_ap" ADD CONSTRAINT "td_contrato_profesor_ap_id_profesor_ap_fkey" FOREIGN KEY ("id_profesor_ap") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_nomina_ap" ADD CONSTRAINT "td_nomina_ap_id_contrato_ap_fkey" FOREIGN KEY ("id_contrato_ap") REFERENCES "td_contrato_profesor_ap"("id_contrato_ap") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_nomina_ap" ADD CONSTRAINT "td_nomina_ap_id_periodo_ap_fkey" FOREIGN KEY ("id_periodo_ap") REFERENCES "td_periodo_academico_cjgp"("id_periodo_cjgp") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_recibo_pago_ap" ADD CONSTRAINT "td_recibo_pago_ap_id_pago_ap_fkey" FOREIGN KEY ("id_pago_ap") REFERENCES "td_pago_ap"("id_pago_ap") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_recibo_pago_ap" ADD CONSTRAINT "td_recibo_pago_ap_id_nomina_ap_fkey" FOREIGN KEY ("id_nomina_ap") REFERENCES "td_nomina_ap"("id_nomina_ap") ON DELETE CASCADE ON UPDATE CASCADE;
