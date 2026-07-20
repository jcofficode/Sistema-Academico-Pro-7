import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * NominaService_ap — Simulación y pago de nómina docente.
 *
 * Calcula el monto a pagar a cada profesor según su contrato:
 *  - POR_HORA: suma las horas de sesiones de sus cursos extracurriculares
 *    (td_sesion_curso_ahbb) más una estimación de las materias de carrera
 *    asignadas (td_materia_cjgp) en el período.
 *  - FIJO: directamente el monto del contrato.
 *
 * El proceso genera registros en td_nomina_ap con estado SIMULADO.
 * El administrador revisa y aprueba cada nómina (estado PAGADO).
 */
@Injectable()
export class NominaService_ap {
  constructor(private readonly prisma_ap: PrismaService) {}

  /** Lista las nóminas de un período con estado y profesor. */
  async obtenerNominas_ap(id_periodo_ap: number) {
    return this.prisma_ap.td_nomina_ap.findMany({
      where: { id_periodo_ap },
      include: {
        contrato_ap: {
          include: {
            profesor_ap: {
              select: {
                id_usuario_ahbb: true,
                nombre_ahbb: true,
                apellido_ahbb: true,
                cedula_ahbb: true,
              },
            },
          },
        },
        periodo_ap: { select: { nombre_cjgp: true } },
        recibo_ap: { select: { codigo_ap: true } },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /** Lista las nóminas del profesor autenticado. */
  async obtenerMisNominas_ap(id_profesor_ap: number) {
    const contrato_ap = await this.prisma_ap.td_contrato_profesor_ap.findUnique({
      where: { id_profesor_ap },
    });
    if (!contrato_ap) {
      return [];
    }
    return this.prisma_ap.td_nomina_ap.findMany({
      where: { id_contrato_ap: contrato_ap.id_contrato_ap },
      include: {
        periodo_ap: { select: { nombre_cjgp: true } },
        recibo_ap: { select: { codigo_ap: true } },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /**
   * Genera la nómina del período para todos los profesores con contrato activo.
   * Usa upsert para poder regenerar sin duplicar.
   */
  async generarNomina_ap(id_periodo_ap: number) {
    const periodo_ap = await this.prisma_ap.td_periodo_academico_cjgp.findUnique({
      where: { id_periodo_cjgp: id_periodo_ap },
    });
    if (!periodo_ap) throw new NotFoundException('Período no encontrado.');

    const contratos_ap = await this.prisma_ap.td_contrato_profesor_ap.findMany({
      where: { activo_ap: true },
      include: { profesor_ap: true },
    });

    if (contratos_ap.length === 0) {
      throw new BadRequestException(
        'No hay profesores con contratos activos registrados.',
      );
    }

    const resultados_ap: any[] = [];

    for (const contrato_ap of contratos_ap) {
      let horas_ap = 0;
      let monto_calculado_ap = 0;

      if (contrato_ap.tipo_ap === 'POR_HORA') {
        // Horas por cursos extracurriculares dictados en el período
        const sesiones_ap = await this.prisma_ap.td_sesion_curso_ahbb.findMany({
          where: {
            curso: { id_usuario_curso_ahbb: contrato_ap.id_profesor_ap },
          },
          select: { horasDuracion_ahbb: true },
        });
        const horasCursos_ap = sesiones_ap.reduce(
          (total_ap, sesion_ap) => total_ap + Number(sesion_ap.horasDuracion_ahbb),
          0,
        );

        // Estimación de horas por materias de carrera: se usa 3h/semana × 16 semanas por bloque
        const materias_ap = await this.prisma_ap.td_materia_cjgp.count({
          where: { id_profesor_materia_cjgp: contrato_ap.id_profesor_ap },
        });
        const horasMaterias_ap = materias_ap * 3 * 16; // estimación estándar

        horas_ap = horasCursos_ap + horasMaterias_ap;
        monto_calculado_ap = horas_ap * Number(contrato_ap.monto_ap);
      } else {
        // FIJO: sueldo directo del contrato
        monto_calculado_ap = Number(contrato_ap.monto_ap);
      }

      const nomina_ap = await this.prisma_ap.td_nomina_ap.upsert({
        where: {
          id_contrato_ap_id_periodo_ap: {
            id_contrato_ap: contrato_ap.id_contrato_ap,
            id_periodo_ap,
          },
        },
        create: {
          id_contrato_ap: contrato_ap.id_contrato_ap,
          id_periodo_ap,
          horas_ap: contrato_ap.tipo_ap === 'POR_HORA' ? horas_ap : null,
          monto_calculado_ap,
          estado_ap: 'SIMULADO',
        },
        update: {
          horas_ap: contrato_ap.tipo_ap === 'POR_HORA' ? horas_ap : null,
          monto_calculado_ap,
          estado_ap: 'SIMULADO',
        },
        include: {
          contrato_ap: {
            include: {
              profesor_ap: { select: { nombre_ahbb: true, apellido_ahbb: true } },
            },
          },
        },
      });

      resultados_ap.push(nomina_ap);
    }

    return {
      exito: true,
      periodo: periodo_ap.nombre_cjgp,
      totalProfesores: resultados_ap.length,
      totalMonto: resultados_ap.reduce(
        (suma_ap, n_ap) => suma_ap + Number(n_ap.monto_calculado_ap),
        0,
      ),
      nominas: resultados_ap,
    };
  }

  /** Marca una nómina como PAGADA. */
  async marcarPagada_ap(id_nomina_ap: number) {
    const nomina_ap = await this.prisma_ap.td_nomina_ap.findUnique({
      where: { id_nomina_ap },
    });
    if (!nomina_ap) throw new NotFoundException('Nómina no encontrada.');
    if (nomina_ap.estado_ap === 'PAGADO') {
      throw new BadRequestException('Esta nómina ya fue marcada como pagada.');
    }

    await this.prisma_ap.td_nomina_ap.update({
      where: { id_nomina_ap },
      data: { estado_ap: 'PAGADO' },
    });
    return { exito: true, mensaje: 'Nómina marcada como pagada correctamente.' };
  }
}
