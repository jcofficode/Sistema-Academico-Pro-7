-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "td_usuario_ahbb" (
    "id_usuario_ahbb" SERIAL NOT NULL,
    "cedula_ahbb" VARCHAR(50) NOT NULL,
    "nombre_ahbb" VARCHAR(100) NOT NULL,
    "apellido_ahbb" VARCHAR(100) NOT NULL,
    "correo_ahbb" VARCHAR(150) NOT NULL,
    "contrasena_ahbb" VARCHAR(255) NOT NULL,
    "rol_ahbb" VARCHAR(20) DEFAULT 'ALUMNO',
    "firmaDigital_ahbb" TEXT,
    "estadoCuenta_ahbb" VARCHAR(40) NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "requiereCambioContrasena_ahbb" BOOLEAN NOT NULL DEFAULT false,
    "referenciaPagoMovil_ahbb" VARCHAR(120),
    "aprobadoPorUsuarioId_ahbb" INTEGER,
    "creadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_usuario_ahbb_pkey" PRIMARY KEY ("id_usuario_ahbb")
);

-- CreateTable
CREATE TABLE "td_curso_ahbb" (
    "id_curso_ahbb" SERIAL NOT NULL,
    "nombre_ahbb" VARCHAR(200) NOT NULL,
    "tematica_ahbb" VARCHAR(200) NOT NULL,
    "descripcion_ahbb" TEXT,
    "diasDefinidos_ahbb" INTEGER NOT NULL,
    "horasDefinidas_ahbb" INTEGER NOT NULL,
    "fechaInicio_ahbb" TIMESTAMP(6),
    "fechaFin_ahbb" TIMESTAMP(6),
    "fechaDuracion_ahbb" TIMESTAMP(6),
    "topeEstudiantes_ahbb" INTEGER DEFAULT 5,
    "temarioTexto_ahbb" TEXT,
    "imagenBasePdf_ahbb" TEXT,
    "imagenBloqueada_ahbb" BOOLEAN DEFAULT false,
    "isPublished_ahbb" BOOLEAN NOT NULL DEFAULT false,
    "estadoAprobacion_ahbb" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "motivoRechazo_ahbb" TEXT,
    "mensajeCorreccion_ahbb" TEXT,
    "id_usuario_curso_ahbb" INTEGER NOT NULL,
    "id_curso_curso_ahbb" INTEGER,
    "creadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_curso_ahbb_pkey" PRIMARY KEY ("id_curso_ahbb")
);

-- CreateTable
CREATE TABLE "td_sesion_curso_ahbb" (
    "id_sesion_ahbb" SERIAL NOT NULL,
    "nroSesion_ahbb" INTEGER NOT NULL,
    "fechaSesion_ahbb" DATE NOT NULL,
    "horaInicio_ahbb" VARCHAR(10) NOT NULL,
    "horaFin_ahbb" VARCHAR(10) NOT NULL,
    "horasDuracion_ahbb" DECIMAL(4,2) NOT NULL,
    "diaSemana_ahbb" VARCHAR(20) NOT NULL,
    "id_curso_sesion_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_sesion_curso_ahbb_pkey" PRIMARY KEY ("id_sesion_ahbb")
);

-- CreateTable
CREATE TABLE "td_horario_ahbb" (
    "id_horario_ahbb" SERIAL NOT NULL,
    "diaSemana_ahbb" VARCHAR(20) NOT NULL,
    "horaInicio_ahbb" VARCHAR(10) NOT NULL,
    "horaFin_ahbb" VARCHAR(10) NOT NULL,
    "id_curso_horario_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_horario_ahbb_pkey" PRIMARY KEY ("id_horario_ahbb")
);

-- CreateTable
CREATE TABLE "td_inscripcion_ahbb" (
    "id_inscripcion_ahbb" SERIAL NOT NULL,
    "estatus_ahbb" VARCHAR(50) DEFAULT 'INSCRITO',
    "intento_ahbb" INTEGER NOT NULL DEFAULT 1,
    "notaFinal_ahbb" DECIMAL(5,2),
    "observaciones_ahbb" TEXT,
    "id_usuario_inscripcion_ahbb" INTEGER NOT NULL,
    "id_curso_inscripcion_ahbb" INTEGER NOT NULL,
    "creadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_inscripcion_ahbb_pkey" PRIMARY KEY ("id_inscripcion_ahbb")
);

-- CreateTable
CREATE TABLE "td_certificado_ahbb" (
    "id_certificado_ahbb" SERIAL NOT NULL,
    "codigoQrUrl_ahbb" TEXT NOT NULL,
    "id_inscripcion_certificado_ahbb" INTEGER NOT NULL,
    "creadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_certificado_ahbb_pkey" PRIMARY KEY ("id_certificado_ahbb")
);

-- CreateTable
CREATE TABLE "td_configuracionglobal_ahbb" (
    "id_configuracionglobal_ahbb" SERIAL NOT NULL,
    "imagenCertificadoGeneral_ahbb" TEXT,

    CONSTRAINT "td_configuracionglobal_ahbb_pkey" PRIMARY KEY ("id_configuracionglobal_ahbb")
);

-- CreateTable
CREATE TABLE "td_auditoria_aprobacion_ahbb" (
    "id_auditoria_aprobacion_ahbb" SERIAL NOT NULL,
    "tipoOperacion_ahbb" VARCHAR(50) NOT NULL,
    "referenciaOperacion_ahbb" VARCHAR(120) NOT NULL,
    "observacion_ahbb" TEXT,
    "id_usuario_auditado_ahbb" INTEGER NOT NULL,
    "id_aprobador_ahbb" INTEGER NOT NULL,
    "creadoEn_ahbb" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_auditoria_aprobacion_ahbb_pkey" PRIMARY KEY ("id_auditoria_aprobacion_ahbb")
);

-- CreateTable
CREATE TABLE "td_producto_ahbb" (
    "id_producto_ahbb" SERIAL NOT NULL,
    "nombre_ahbb" VARCHAR(150) NOT NULL,
    "descripcion_ahbb" TEXT,
    "precio_ahbb" DECIMAL(10,2) NOT NULL,
    "stock_ahbb" INTEGER NOT NULL DEFAULT 0,
    "categoria_ahbb" VARCHAR(50) NOT NULL,
    "imagen_ahbb" TEXT,
    "estado_producto_ahbb" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "creadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "td_producto_ahbb_pkey" PRIMARY KEY ("id_producto_ahbb")
);

-- CreateTable
CREATE TABLE "td_carrito_ahbb" (
    "id_carrito_ahbb" SERIAL NOT NULL,
    "cantidad_ahbb" INTEGER NOT NULL DEFAULT 1,
    "fechaAgregado_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_carrito_ahbb" INTEGER NOT NULL,
    "id_producto_carrito_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_carrito_ahbb_pkey" PRIMARY KEY ("id_carrito_ahbb")
);

-- CreateTable
CREATE TABLE "td_factura_ahbb" (
    "id_factura_ahbb" SERIAL NOT NULL,
    "nroReferenciaPago_ahbb" VARCHAR(50) NOT NULL,
    "fechaFactura_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "total_ahbb" DECIMAL(10,2) NOT NULL,
    "estadoFactura_ahbb" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "id_usuario_factura_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_factura_ahbb_pkey" PRIMARY KEY ("id_factura_ahbb")
);

-- CreateTable
CREATE TABLE "td_detalle_factura_ahbb" (
    "id_detalle_factura_ahbb" SERIAL NOT NULL,
    "cantidad_ahbb" INTEGER NOT NULL,
    "precioUnitario_ahbb" DECIMAL(10,2) NOT NULL,
    "id_factura_detalle_ahbb" INTEGER NOT NULL,
    "id_producto_detalle_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_detalle_factura_ahbb_pkey" PRIMARY KEY ("id_detalle_factura_ahbb")
);

-- CreateTable
CREATE TABLE "td_favorito_ahbb" (
    "id_favorito_ahbb" SERIAL NOT NULL,
    "fechaAgregado_ahbb" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_favorito_ahbb" INTEGER NOT NULL,
    "id_producto_favorito_ahbb" INTEGER NOT NULL,

    CONSTRAINT "td_favorito_ahbb_pkey" PRIMARY KEY ("id_favorito_ahbb")
);

-- CreateIndex
CREATE UNIQUE INDEX "td_usuario_ahbb_cedula_ahbb_key" ON "td_usuario_ahbb"("cedula_ahbb");

-- CreateIndex
CREATE UNIQUE INDEX "td_usuario_ahbb_correo_ahbb_key" ON "td_usuario_ahbb"("correo_ahbb");

-- CreateIndex
CREATE INDEX "td_inscripcion_ahbb_id_usuario_inscripcion_ahbb_id_curso_in_idx" ON "td_inscripcion_ahbb"("id_usuario_inscripcion_ahbb", "id_curso_inscripcion_ahbb");

-- CreateIndex
CREATE UNIQUE INDEX "td_certificado_ahbb_id_inscripcion_certificado_ahbb_key" ON "td_certificado_ahbb"("id_inscripcion_certificado_ahbb");

-- CreateIndex
CREATE UNIQUE INDEX "td_carrito_ahbb_id_usuario_carrito_ahbb_id_producto_carrito_key" ON "td_carrito_ahbb"("id_usuario_carrito_ahbb", "id_producto_carrito_ahbb");

-- CreateIndex
CREATE UNIQUE INDEX "td_favorito_ahbb_id_usuario_favorito_ahbb_id_producto_favor_key" ON "td_favorito_ahbb"("id_usuario_favorito_ahbb", "id_producto_favorito_ahbb");

-- AddForeignKey
ALTER TABLE "td_curso_ahbb" ADD CONSTRAINT "td_curso_ahbb_id_usuario_curso_ahbb_fkey" FOREIGN KEY ("id_usuario_curso_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_curso_ahbb" ADD CONSTRAINT "td_curso_ahbb_id_curso_curso_ahbb_fkey" FOREIGN KEY ("id_curso_curso_ahbb") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_sesion_curso_ahbb" ADD CONSTRAINT "td_sesion_curso_ahbb_id_curso_sesion_ahbb_fkey" FOREIGN KEY ("id_curso_sesion_ahbb") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_horario_ahbb" ADD CONSTRAINT "td_horario_ahbb_id_curso_horario_ahbb_fkey" FOREIGN KEY ("id_curso_horario_ahbb") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_inscripcion_ahbb" ADD CONSTRAINT "td_inscripcion_ahbb_id_usuario_inscripcion_ahbb_fkey" FOREIGN KEY ("id_usuario_inscripcion_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_inscripcion_ahbb" ADD CONSTRAINT "td_inscripcion_ahbb_id_curso_inscripcion_ahbb_fkey" FOREIGN KEY ("id_curso_inscripcion_ahbb") REFERENCES "td_curso_ahbb"("id_curso_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_certificado_ahbb" ADD CONSTRAINT "td_certificado_ahbb_id_inscripcion_certificado_ahbb_fkey" FOREIGN KEY ("id_inscripcion_certificado_ahbb") REFERENCES "td_inscripcion_ahbb"("id_inscripcion_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_auditoria_aprobacion_ahbb" ADD CONSTRAINT "td_auditoria_aprobacion_ahbb_id_usuario_auditado_ahbb_fkey" FOREIGN KEY ("id_usuario_auditado_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_auditoria_aprobacion_ahbb" ADD CONSTRAINT "td_auditoria_aprobacion_ahbb_id_aprobador_ahbb_fkey" FOREIGN KEY ("id_aprobador_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_carrito_ahbb" ADD CONSTRAINT "td_carrito_ahbb_id_usuario_carrito_ahbb_fkey" FOREIGN KEY ("id_usuario_carrito_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_carrito_ahbb" ADD CONSTRAINT "td_carrito_ahbb_id_producto_carrito_ahbb_fkey" FOREIGN KEY ("id_producto_carrito_ahbb") REFERENCES "td_producto_ahbb"("id_producto_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_factura_ahbb" ADD CONSTRAINT "td_factura_ahbb_id_usuario_factura_ahbb_fkey" FOREIGN KEY ("id_usuario_factura_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_detalle_factura_ahbb" ADD CONSTRAINT "td_detalle_factura_ahbb_id_factura_detalle_ahbb_fkey" FOREIGN KEY ("id_factura_detalle_ahbb") REFERENCES "td_factura_ahbb"("id_factura_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_detalle_factura_ahbb" ADD CONSTRAINT "td_detalle_factura_ahbb_id_producto_detalle_ahbb_fkey" FOREIGN KEY ("id_producto_detalle_ahbb") REFERENCES "td_producto_ahbb"("id_producto_ahbb") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_favorito_ahbb" ADD CONSTRAINT "td_favorito_ahbb_id_usuario_favorito_ahbb_fkey" FOREIGN KEY ("id_usuario_favorito_ahbb") REFERENCES "td_usuario_ahbb"("id_usuario_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "td_favorito_ahbb" ADD CONSTRAINT "td_favorito_ahbb_id_producto_favorito_ahbb_fkey" FOREIGN KEY ("id_producto_favorito_ahbb") REFERENCES "td_producto_ahbb"("id_producto_ahbb") ON DELETE CASCADE ON UPDATE CASCADE;
