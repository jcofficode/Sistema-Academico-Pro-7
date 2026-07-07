-- CreateTable
CREATE TABLE "td_reportes_facturas_ahbb" (
    "id_reporte_ahbb" SERIAL NOT NULL,
    "id_factura_reporte_ahbb" INTEGER NOT NULL,
    "detalles_factura_ahbb" JSONB NOT NULL,
    "qr_base64_ahbb" TEXT NOT NULL,
    "creadoEn_ahbb" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_reportes_facturas_ahbb_pkey" PRIMARY KEY ("id_reporte_ahbb")
);

-- AddForeignKey
ALTER TABLE "td_reportes_facturas_ahbb" ADD CONSTRAINT "td_reportes_facturas_ahbb_id_factura_reporte_ahbb_fkey" FOREIGN KEY ("id_factura_reporte_ahbb") REFERENCES "td_factura_ahbb"("id_factura_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;
