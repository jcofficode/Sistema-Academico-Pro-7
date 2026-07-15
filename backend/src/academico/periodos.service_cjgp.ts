import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearPeriodoDto_cjgp } from './dto/crear-periodo.dto_cjgp';

/**
 * PeriodosService_cjgp — Gestión de períodos académicos.
 * El período activo define sobre cuál se procesan las inscripciones
 * y la carga de notas. Solo puede existir uno activo a la vez.
 */
@Injectable()
export class PeriodosService_cjgp {
  constructor(private readonly prisma_cjgp: PrismaService) {}

  async obtenerTodos_cjgp() {
    return this.prisma_cjgp.td_periodo_academico_cjgp.findMany({
      orderBy: { fechaInicio_cjgp: 'desc' },
      include: { _count: { select: { inscripciones_cjgp: true } } },
    });
  }

  /** Devuelve el período activo, o null si la coordinación no ha abierto ninguno. */
  async obtenerActivo_cjgp() {
    return this.prisma_cjgp.td_periodo_academico_cjgp.findFirst({
      where: { activo_cjgp: true },
    });
  }

  async crear_cjgp(datos_cjgp: CrearPeriodoDto_cjgp) {
    const fechaInicio_cjgp = new Date(datos_cjgp.fechaInicio_cjgp);
    const fechaFin_cjgp = new Date(datos_cjgp.fechaFin_cjgp);

    if (fechaFin_cjgp <= fechaInicio_cjgp) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    const periodo_cjgp = await this.prisma_cjgp.$transaction(async (tx_cjgp) => {
      // Si el nuevo período nace activo, desactivar cualquier otro
      if (datos_cjgp.activo_cjgp) {
        await tx_cjgp.td_periodo_academico_cjgp.updateMany({
          where: { activo_cjgp: true },
          data: { activo_cjgp: false },
        });
      }

      return tx_cjgp.td_periodo_academico_cjgp.create({
        data: {
          nombre_cjgp: datos_cjgp.nombre_cjgp.trim(),
          fechaInicio_cjgp,
          fechaFin_cjgp,
          activo_cjgp: datos_cjgp.activo_cjgp ?? false,
        },
      });
    });

    return {
      exito: true,
      periodo: periodo_cjgp,
      mensaje: `Período "${periodo_cjgp.nombre_cjgp}" registrado.`,
    };
  }

  /** Marca un período como activo y desactiva el resto (operación atómica). */
  async activar_cjgp(id_periodo_cjgp: number) {
    const periodo_cjgp =
      await this.prisma_cjgp.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp },
      });
    if (!periodo_cjgp) {
      throw new NotFoundException('Período académico no encontrado.');
    }

    await this.prisma_cjgp.$transaction([
      this.prisma_cjgp.td_periodo_academico_cjgp.updateMany({
        where: { activo_cjgp: true },
        data: { activo_cjgp: false },
      }),
      this.prisma_cjgp.td_periodo_academico_cjgp.update({
        where: { id_periodo_cjgp },
        data: { activo_cjgp: true },
      }),
    ]);

    return {
      exito: true,
      mensaje: `El período "${periodo_cjgp.nombre_cjgp}" ahora está activo.`,
    };
  }

  async eliminar_cjgp(id_periodo_cjgp: number) {
    const periodo_cjgp =
      await this.prisma_cjgp.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp },
        include: { _count: { select: { inscripciones_cjgp: true } } },
      });
    if (!periodo_cjgp) {
      throw new NotFoundException('Período académico no encontrado.');
    }
    if (periodo_cjgp._count.inscripciones_cjgp > 0) {
      throw new BadRequestException(
        'No se puede eliminar un período con inscripciones registradas.',
      );
    }

    await this.prisma_cjgp.td_periodo_academico_cjgp.delete({
      where: { id_periodo_cjgp },
    });
    return { exito: true, mensaje: 'Período eliminado correctamente.' };
  }
}
