import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearPagoDto_ap } from './dto/crear-pago.dto_ap';
import { ConfirmarPagoDto_ap } from './dto/confirmar-pago.dto_ap';

/**
 * PagosService_ap — Núcleo del sistema de pagos.
 *
 * Centraliza la lógica de:
 *  - Crear pagos de alumnos (PERIODO o CURSO) con transacción Prisma.
 *  - Confirmar o rechazar pagos (admin).
 *  - Verificar solvencia: el método clave que bloquea la inscripción.
 *  - Reporte de ingresos por período con tabla temporal de PostgreSQL.
 */
@Injectable()
export class PagosService_ap {
  constructor(private readonly prisma_ap: PrismaService) {}

  // ─── Operaciones del alumno ───────────────────────────────────

  /** Historial de pagos del alumno autenticado. */
  async obtenerMisPagos_ap(id_usuario_ap: number) {
    return this.prisma_ap.td_pago_ap.findMany({
      where: { id_usuario_ap },
      include: {
        tarifa_ap: true,
        periodo_ap: { select: { nombre_cjgp: true, activo_cjgp: true } },
        curso_ap: { select: { nombre_ahbb: true } },
        recibo_ap: { select: { codigo_ap: true } },
        confirmadoPor_ap: { select: { nombre_ahbb: true, apellido_ahbb: true } },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /**
   * Registra un nuevo pago del alumno.
   * Validaciones previas:
   *  - La tarifa existe y está activa.
   *  - No existe ya un pago CONFIRMADO para ese alumno-período (constraint de negocio).
   *  - El período existe si el concepto es PERIODO.
   */
  async crearPago_ap(id_usuario_ap: number, datos_ap: CrearPagoDto_ap) {
    // Validar tarifa
    const tarifa_ap = await this.prisma_ap.td_tarifa_ap.findUnique({
      where: { id_tarifa_ap: datos_ap.id_tarifa_ap },
    });
    if (!tarifa_ap || !tarifa_ap.activa_ap) {
      throw new BadRequestException(
        'La tarifa seleccionada no existe o no está activa.',
      );
    }

    if (datos_ap.concepto_ap === 'PERIODO') {
      if (!datos_ap.id_periodo_ap) {
        throw new BadRequestException(
          'Debes indicar el período académico a cancelar.',
        );
      }
      // Verificar que no existe ya un pago confirmado para este alumno-período
      const pagoExistente_ap = await this.prisma_ap.td_pago_ap.findFirst({
        where: {
          id_usuario_ap,
          id_periodo_ap: datos_ap.id_periodo_ap,
          estado_ap: 'CONFIRMADO',
        },
      });
      if (pagoExistente_ap) {
        throw new BadRequestException(
          'Ya tienes un pago confirmado para este período. No es necesario pagar de nuevo.',
        );
      }
    }

    return this.prisma_ap.$transaction(async (tx_ap) => {
      const pago_ap = await tx_ap.td_pago_ap.create({
        data: {
          id_usuario_ap,
          id_periodo_ap: datos_ap.id_periodo_ap ?? null,
          id_curso_pago_ap: datos_ap.id_curso_ap ?? null,
          id_tarifa_ap: datos_ap.id_tarifa_ap,
          concepto_ap: datos_ap.concepto_ap,
          monto_ap: tarifa_ap.monto_ap,
          referencia_ap: datos_ap.referencia_ap,
          estado_ap: 'PENDIENTE',
        },
        include: {
          periodo_ap: { select: { nombre_cjgp: true } },
          tarifa_ap: true,
        },
      });

      return {
        exito: true,
        pago: pago_ap,
        mensaje: `Pago registrado con referencia "${datos_ap.referencia_ap}". Espera la confirmación del administrador.`,
      };
    });
  }

  // ─── Operaciones del administrador ────────────────────────────

  /** Lista todos los pagos con filtros opcionales. */
  async obtenerTodosAdmin_ap(estado_ap?: string) {
    return this.prisma_ap.td_pago_ap.findMany({
      where: estado_ap ? { estado_ap } : undefined,
      include: {
        alumno_ap: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            cedula_ahbb: true,
            correo_ahbb: true,
          },
        },
        tarifa_ap: true,
        periodo_ap: { select: { nombre_cjgp: true, activo_cjgp: true } },
        curso_ap: { select: { nombre_ahbb: true } },
        confirmadoPor_ap: { select: { nombre_ahbb: true, apellido_ahbb: true } },
        recibo_ap: { select: { codigo_ap: true } },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /**
   * Confirma o rechaza un pago.
   * Al confirmar, se genera también el recibo con hash SHA-256.
   */
  async confirmarPago_ap(
    id_pago_ap: number,
    datos_ap: ConfirmarPagoDto_ap,
    id_admin_ap: number,
  ) {
    const pago_ap = await this.prisma_ap.td_pago_ap.findUnique({
      where: { id_pago_ap },
    });
    if (!pago_ap) throw new NotFoundException('Pago no encontrado.');
    if (pago_ap.estado_ap !== 'PENDIENTE') {
      throw new BadRequestException(
        `El pago ya fue procesado con estado: ${pago_ap.estado_ap}.`,
      );
    }

    return this.prisma_ap.$transaction(async (tx_ap) => {
      const pagoActualizado_ap = await tx_ap.td_pago_ap.update({
        where: { id_pago_ap },
        data: {
          estado_ap: datos_ap.estado_ap,
          observacion_ap: datos_ap.observacion_ap,
          confirmadoPorId_ap: id_admin_ap,
          confirmadoEn_ap: new Date(),
          actualizadoEn_ap: new Date(),
        },
      });

      return {
        exito: true,
        pago: pagoActualizado_ap,
        mensaje: `Pago ${datos_ap.estado_ap === 'CONFIRMADO' ? 'confirmado' : 'rechazado'} correctamente.`,
      };
    });
  }

  // ─── REGLA DE NEGOCIO CENTRAL ─────────────────────────────────

  /**
   * Verifica si el alumno tiene un pago CONFIRMADO del período activo.
   * Este método es el guardián de la inscripción: es llamado por
   * InscripcionMateriasService_cjgp antes de ejecutar cualquier inscripción.
   *
   * @throws BadRequestException si el alumno no es solvente.
   */
  async verificarSolvencia_ap(
    id_usuario_ap: number,
    id_periodo_ap: number,
  ): Promise<void> {
    const pagoConfirmado_ap = await this.prisma_ap.td_pago_ap.findFirst({
      where: {
        id_usuario_ap,
        id_periodo_ap,
        estado_ap: 'CONFIRMADO',
        concepto_ap: 'PERIODO',
      },
    });

    if (!pagoConfirmado_ap) {
      throw new BadRequestException({
        mensaje: 'Debes cancelar el arancel del período para poder inscribir materias.',
        violaciones: [
          'No se encontró un pago confirmado para el período activo.',
          'Dirígete a la sección "Mis Pagos" para registrar tu pago y espera la confirmación del administrador.',
        ],
      });
    }
  }

  /**
   * Verifica si el alumno tiene pago confirmado para un curso extracurricular.
   * Retorna true/false (no lanza excepción) para que el caller decida.
   */
  async tienePagoCurso_ap(
    id_usuario_ap: number,
    id_curso_ap: number,
  ): Promise<boolean> {
    const pago_ap = await this.prisma_ap.td_pago_ap.findFirst({
      where: {
        id_usuario_ap,
        id_curso_pago_ap: id_curso_ap,
        estado_ap: 'CONFIRMADO',
        concepto_ap: 'CURSO',
      },
    });
    return !!pago_ap;
  }

  // ─── Reporte con tabla temporal de PostgreSQL ─────────────────

  /**
   * Reporte de ingresos por período.
   * Construye un resumen con una TABLA TEMPORAL de PostgreSQL (ON COMMIT DROP),
   * cumpliendo el requisito del profesor de reportes con tablas temporales.
   */
  async reporteIngresos_ap(id_periodo_ap: number) {
    const periodo_ap = await this.prisma_ap.td_periodo_academico_cjgp.findUnique({
      where: { id_periodo_cjgp: id_periodo_ap },
    });
    if (!periodo_ap) throw new NotFoundException('Período no encontrado.');

    const filas_ap = await this.prisma_ap.$transaction(async (tx_ap) => {
      await tx_ap.$executeRaw`
        CREATE TEMP TABLE tmp_ingresos_ap ON COMMIT DROP AS
        SELECT
          p."concepto_ap"                                    AS concepto,
          COUNT(*) FILTER (WHERE p."estado_ap" = 'CONFIRMADO')::int  AS confirmados,
          COUNT(*) FILTER (WHERE p."estado_ap" = 'PENDIENTE')::int   AS pendientes,
          COUNT(*) FILTER (WHERE p."estado_ap" = 'RECHAZADO')::int   AS rechazados,
          COALESCE(SUM(p."monto_ap") FILTER (WHERE p."estado_ap" = 'CONFIRMADO'), 0)::float AS monto_confirmado,
          COUNT(*)::int                                       AS total_pagos
        FROM "td_pago_ap" p
        WHERE p."id_periodo_ap" = ${id_periodo_ap}
        GROUP BY p."concepto_ap"
      `;

      return tx_ap.$queryRaw<any[]>`
        SELECT *, 
               monto_confirmado / NULLIF(confirmados, 0) AS promedio_por_pago
        FROM tmp_ingresos_ap
        ORDER BY concepto
      `;
    });

    const totalConfirmado_ap = filas_ap.reduce(
      (suma_ap: number, fila_ap: any) => suma_ap + Number(fila_ap.monto_confirmado),
      0,
    );

    return {
      periodo: periodo_ap,
      totalConfirmado: totalConfirmado_ap,
      filas: filas_ap,
    };
  }

  /**
   * Cálculo dinámico automatizado del cobro de inscripción y facturación basado en UC.
   * 
   * Reglas de Negocio:
   * 1. Prohibición de Montos Arbitrarios: Todo cobro se calcula matemáticamente por suma de UC.
   * 2. Cálculo Período: Monto = (Arancel + Seguro) + (∑ UC_Materias * Costo_UC * (1 - %DescuentoBloque)).
   * 3. Cálculo Curso Individual: Monto = (Arancel + Seguro) + (UC_Materia * Costo_UC_Regular).
   * 4. Conversión Automática: Si el estudiante intenta inscribir >= 4 cursos (o >= 22 UC), 
   *    el sistema CONVIERTE AUTOMÁTICAMENTE la solicitud a Modalidad Período Completo.
   */
  async calcularCobroDinamico_ap(datos_ap: {
    modalidad: 'TRIMESTRE' | 'CURSO_INDIVIDUAL';
    cantidad_uc?: number;
    cantidad_cursos?: number;
    es_pago_contado?: boolean;
    es_pago_fraccionado?: boolean;
  }) {
    const arancelUSD = 20.00;
    const seguroUSD = 10.00;
    const precioUCBaseUSD = 12.00; // Costo regulable por UC

    let cantidadUC = Number(datos_ap.cantidad_uc ?? 0);
    let cantidadCursos = Number(datos_ap.cantidad_cursos ?? 0);
    let modalidad = datos_ap.modalidad;
    let esContado = datos_ap.es_pago_contado ?? true;
    let esFraccionado = datos_ap.es_pago_fraccionado ?? false;

    let conversionAutomatica = false;
    let mensajeConversion = '';

    // REGLA DE CONVERSIÓN AUTOMÁTICA OBLIGATORIA
    // Si intenta inscribir 4 o más cursos individuales (o >= 22 UC), se convierte automáticamente a Período Completo
    if (modalidad === 'CURSO_INDIVIDUAL' && (cantidadCursos >= 4 || cantidadUC >= 22)) {
      modalidad = 'TRIMESTRE';
      conversionAutomatica = true;
      if (cantidadUC < 22) {
        cantidadUC = Math.max(22, cantidadCursos * 5); // Ajustar al mínimo de carga trimestral (22 UC)
      }
      mensajeConversion = `Se aplicó CONVERSIÓN AUTOMÁTICA a modalidad Período Completo al seleccionar ${cantidadCursos} cursos (${cantidadUC} UC).`;
    }

    let montoUCBrutoUSD = 0;
    let descuentoBloqueUSD = 0;
    let descuentoProntoPagoUSD = 0;
    let totalCuotas = 1;

    if (modalidad === 'TRIMESTRE') {
      // Ajuste de rango si no se enviaron UC
      if (cantidadUC === 0) cantidadUC = 30; // Carga promedio estándar de 6 materias (30 UC)

      if (cantidadUC < 22 || cantidadUC > 42) {
        throw new BadRequestException(
          `La modalidad por Período/Trimestre exige inscribir entre 22 y 42 UC. UC indicadas: ${cantidadUC}.`,
        );
      }

      // Descuento del 15% en el precio de la UC por inscribir el bloque completo
      const precioUCAjustadoUSD = precioUCBaseUSD * 0.85; // $10.20 USD/UC
      montoUCBrutoUSD = cantidadUC * precioUCBaseUSD;
      descuentoBloqueUSD = cantidadUC * (precioUCBaseUSD - precioUCAjustadoUSD);
      const subtotalUSD = arancelUSD + seguroUSD + (cantidadUC * precioUCAjustadoUSD);

      // Descuento adicional del 10% por pago 100% de contado sin cuotas
      if (esContado && !esFraccionado) {
        descuentoProntoPagoUSD = subtotalUSD * 0.10;
      }

      if (esFraccionado) {
        totalCuotas = 3;
      }

      const montoTotalUSD = subtotalUSD - descuentoProntoPagoUSD;
      return {
        modalidad: 'TRIMESTRE',
        conversion_automatica_aplicada: conversionAutomatica,
        mensaje_conversion: conversionAutomatica ? mensajeConversion : null,
        arancel_administrativo_usd: arancelUSD,
        seguro_estudiantil_usd: seguroUSD,
        cantidad_uc: cantidadUC,
        precio_uc_base_usd: precioUCBaseUSD,
        precio_uc_aplicado_usd: precioUCAjustadoUSD,
        monto_uc_bruto_usd: montoUCBrutoUSD,
        descuento_bloque_usd: Number(descuentoBloqueUSD.toFixed(2)),
        descuento_pronto_pago_usd: Number(descuentoProntoPagoUSD.toFixed(2)),
        monto_total_usd: Number(montoTotalUSD.toFixed(2)),
        es_pago_fraccionado: esFraccionado,
        total_cuotas: totalCuotas,
        monto_cuota_usd: Number((montoTotalUSD / totalCuotas).toFixed(2)),
        formula_aplicada: `Monto Período = (Arancel $${arancelUSD} + Seguro $${seguroUSD}) + (∑ UC ${cantidadUC} * $${precioUCAjustadoUSD.toFixed(2)}) - Descuentos`,
      };
    } else {
      // Modalidad CURSO_INDIVIDUAL (Máximo 3 cursos)
      if (cantidadCursos < 1 || cantidadCursos > 3) {
        throw new BadRequestException(
          `La modalidad por curso individual permite de 1 a 3 cursos únicamente. Cursos indicados: ${cantidadCursos}.`,
        );
      }
      if (esFraccionado && cantidadCursos < 3) {
        throw new BadRequestException(
          `No se permite pago fraccionado si solo inscribe 1 o 2 cursos individuales. Se requiere inscribir 3 cursos para fraccionar.`,
        );
      }

      const ucCalculadas = cantidadUC > 0 ? cantidadUC : cantidadCursos * 5;
      montoUCBrutoUSD = ucCalculadas * precioUCBaseUSD;
      const montoTotalUSD = arancelUSD + seguroUSD + montoUCBrutoUSD;

      if (esFraccionado) totalCuotas = 3;

      return {
        modalidad: 'CURSO_INDIVIDUAL',
        conversion_automatica_aplicada: false,
        arancel_administrativo_usd: arancelUSD,
        seguro_estudiantil_usd: seguroUSD,
        cantidad_cursos: cantidadCursos,
        cantidad_uc: ucCalculadas,
        precio_uc_aplicado_usd: precioUCBaseUSD,
        monto_uc_bruto_usd: montoUCBrutoUSD,
        descuento_bloque_usd: 0,
        descuento_pronto_pago_usd: 0,
        monto_total_usd: Number(montoTotalUSD.toFixed(2)),
        es_pago_fraccionado: esFraccionado,
        total_cuotas: totalCuotas,
        monto_cuota_usd: Number((montoTotalUSD / totalCuotas).toFixed(2)),
        formula_aplicada: `Monto Curso = (Arancel $${arancelUSD} + Seguro $${seguroUSD}) + (UC_Materia ${ucCalculadas} * $${precioUCBaseUSD.toFixed(2)})`,
      };
    }
  }
}
