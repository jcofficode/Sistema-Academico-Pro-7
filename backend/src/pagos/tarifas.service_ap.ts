import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearTarifaDto_ap } from './dto/crear-tarifa.dto_ap';

/**
 * TarifasService_ap — Gestión de tarifas configurables.
 *
 * Las tarifas son definidas por el administrador y determinan el monto
 * que deben pagar los alumnos al inscribir un período académico o un
 * curso extracurricular.
 */
@Injectable()
export class TarifasService_ap {
  constructor(private readonly prisma_ap: PrismaService) {}

  /** Lista todas las tarifas registradas. */
  async obtenerTodas_ap() {
    return this.prisma_ap.td_tarifa_ap.findMany({
      include: {
        curso_ap: {
          select: { id_curso_ahbb: true, nombre_ahbb: true },
        },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /** Obtiene una tarifa específica por ID. */
  async obtenerPorId_ap(id_tarifa_ap: number) {
    const tarifa_ap = await this.prisma_ap.td_tarifa_ap.findUnique({
      where: { id_tarifa_ap },
      include: { curso_ap: { select: { id_curso_ahbb: true, nombre_ahbb: true } } },
    });
    if (!tarifa_ap) throw new NotFoundException('Tarifa no encontrada.');
    return tarifa_ap;
  }

  /** Obtiene la tarifa activa de período (para mostrar al alumno cuánto debe pagar). */
  async obtenerTarifaPeriodoActiva_ap() {
    const tarifa_ap = await this.prisma_ap.td_tarifa_ap.findFirst({
      where: { concepto_ap: 'PERIODO', activa_ap: true },
      orderBy: { creadoEn_ap: 'desc' },
    });
    if (!tarifa_ap) {
      throw new NotFoundException(
        'No hay una tarifa de período activa. Contacta a la coordinación.',
      );
    }
    return tarifa_ap;
  }

  /** Obtiene la tarifa activa de un curso extracurricular específico. */
  async obtenerTarifaCurso_ap(id_curso_ap: number) {
    // Busca tarifa específica del curso, si no existe busca la genérica
    const tarifa_ap = await this.prisma_ap.td_tarifa_ap.findFirst({
      where: { concepto_ap: 'CURSO', id_curso_ap, activa_ap: true },
    }) ?? await this.prisma_ap.td_tarifa_ap.findFirst({
      where: { concepto_ap: 'CURSO', id_curso_ap: null, activa_ap: true },
    });
    return tarifa_ap;
  }

  /** Crea una nueva tarifa. */
  async crear_ap(datos_ap: CrearTarifaDto_ap) {
    if (datos_ap.concepto_ap === 'CURSO' && !datos_ap.id_curso_ap) {
      // Tarifa genérica de curso (sin curso específico) es válida
    }
    return this.prisma_ap.td_tarifa_ap.create({
      data: {
        concepto_ap: datos_ap.concepto_ap,
        id_curso_ap: datos_ap.id_curso_ap ?? null,
        monto_ap: datos_ap.monto_ap,
        descripcion_ap: datos_ap.descripcion_ap,
        activa_ap: datos_ap.activa_ap ?? true,
      },
    });
  }

  /** Actualiza una tarifa existente. */
  async actualizar_ap(id_tarifa_ap: number, datos_ap: Partial<CrearTarifaDto_ap>) {
    await this.obtenerPorId_ap(id_tarifa_ap);
    return this.prisma_ap.td_tarifa_ap.update({
      where: { id_tarifa_ap },
      data: { ...datos_ap, actualizadoEn_ap: new Date() },
    });
  }

  /** Elimina una tarifa (solo si no tiene pagos asociados). */
  async eliminar_ap(id_tarifa_ap: number) {
    await this.obtenerPorId_ap(id_tarifa_ap);
    const pagosExistentes_ap = await this.prisma_ap.td_pago_ap.count({
      where: { id_tarifa_ap },
    });
    if (pagosExistentes_ap > 0) {
      throw new BadRequestException(
        'No se puede eliminar una tarifa que ya tiene pagos asociados. Desactívala en su lugar.',
      );
    }
    await this.prisma_ap.td_tarifa_ap.delete({ where: { id_tarifa_ap } });
    return { exito: true, mensaje: 'Tarifa eliminada correctamente.' };
  }
}
