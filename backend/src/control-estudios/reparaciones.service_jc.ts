import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { RegistrarReparacionDto_jc } from './dto/registrar-reparacion.dto_jc';
import { AuditoriaService_jc } from '../auditoria/auditoria.service_jc';
import {
  ACCIONES_JC,
  MODULOS_AUDITORIA_JC,
} from '../auditoria/constantes/acciones-auditoria_jc';

/**
 * ReparacionesService_jc — Reparación de cortes.
 *
 * Cambio de modelo respecto a la versión anterior: la reparación dejó de ser un
 * ítem del plan de evaluación (donde la coordinación decidía de antemano si
 * existía) y pasó a ser una decisión de quien carga las notas.
 *
 * Reglas:
 *  - Se repara UN corte concreto del plan vigente, tantos como haga falta.
 *  - Solo hay una reparación por alumno y corte (constraint en la BD); volver a
 *    registrarla actualiza el valor.
 *  - La nota efectiva del corte es MAX(nota original, reparación): reparar
 *    nunca perjudica al alumno.
 *  - No se puede reparar un acta ya cerrada.
 */
@Injectable()
export class ReparacionesService_jc {
  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly planesService_jc: PlanesEvaluacionService_jc,
    private readonly auditoriaService_jc: AuditoriaService_jc,
  ) {}

  /** Registra o actualiza la reparación de un corte. */
  async registrar_jc(
    datos_jc: RegistrarReparacionDto_jc,
    idUsuarioRegistra_jc: number,
  ) {
    const inscripcion_jc = await this.obtenerInscripcion_jc(
      datos_jc.id_inscripcion_materia_jc,
    );

    if (inscripcion_jc.estatus_cjgp !== 'INSCRITO') {
      throw new BadRequestException(
        'Solo se pueden registrar reparaciones mientras la materia está en curso: el acta de este alumno ya fue cerrada.',
      );
    }

    const plan_jc = await this.planesService_jc.resolverPlanVigente_jc(
      inscripcion_jc.id_materia_im_cjgp,
      inscripcion_jc.id_periodo_im_cjgp,
    );

    const item_jc = plan_jc.items_jc.find(
      (candidato_jc) => candidato_jc.id_item_jc === datos_jc.id_item_jc,
    );
    if (!item_jc) {
      throw new BadRequestException(
        'El corte indicado no pertenece al plan de evaluación vigente de esta materia.',
      );
    }

    const notaMaxima_jc = Number(plan_jc.notaMaxima_jc);
    if (datos_jc.valor_jc < 0 || datos_jc.valor_jc > notaMaxima_jc) {
      throw new BadRequestException(
        `La nota de la reparación (${datos_jc.valor_jc}) está fuera de la escala del plan (0 a ${notaMaxima_jc}).`,
      );
    }

    const reparacion_jc = await this.prisma_jc.td_reparacion_jc.upsert({
      where: {
        id_inscripcion_materia_rep_jc_id_item_rep_jc: {
          id_inscripcion_materia_rep_jc: datos_jc.id_inscripcion_materia_jc,
          id_item_rep_jc: datos_jc.id_item_jc,
        },
      },
      create: {
        id_inscripcion_materia_rep_jc: datos_jc.id_inscripcion_materia_jc,
        id_item_rep_jc: datos_jc.id_item_jc,
        valor_jc: datos_jc.valor_jc,
        observacion_jc: datos_jc.observacion_jc?.trim() || null,
        registradoPorUsuarioId_jc: idUsuarioRegistra_jc,
      },
      update: {
        valor_jc: datos_jc.valor_jc,
        observacion_jc: datos_jc.observacion_jc?.trim() || null,
        registradoPorUsuarioId_jc: idUsuarioRegistra_jc,
        actualizadoEn_jc: new Date(),
      },
    });

    const notaOriginal_jc = await this.prisma_jc.td_calificacion_jc.findUnique({
      where: {
        id_inscripcion_materia_cal_jc_id_item_cal_jc: {
          id_inscripcion_materia_cal_jc: datos_jc.id_inscripcion_materia_jc,
          id_item_cal_jc: datos_jc.id_item_jc,
        },
      },
      select: { valor_jc: true },
    });

    await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioRegistra_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
      accion_jc: ACCIONES_JC.REPARACION_REGISTRADA,
      descripcion_jc: `registró la reparación de "${item_jc.nombre_jc}" a ${inscripcion_jc.alumno_cjgp.apellido_ahbb}, ${inscripcion_jc.alumno_cjgp.nombre_ahbb} en ${inscripcion_jc.materia_cjgp.codigo_cjgp} con ${datos_jc.valor_jc} punto(s)`,
      id_afectado_jc: inscripcion_jc.id_usuario_im_cjgp,
      id_materia_aud_jc: inscripcion_jc.id_materia_im_cjgp,
      id_periodo_aud_jc: inscripcion_jc.id_periodo_im_cjgp,
      entidad_jc: 'td_reparacion_jc',
      id_entidad_jc: reparacion_jc.id_reparacion_jc,
      metodo_jc: 'POST',
      ruta_jc: '/control-estudios/reparaciones',
      detalle_jc: {
        corte: item_jc.nombre_jc,
        notaOriginal: notaOriginal_jc ? Number(notaOriginal_jc.valor_jc) : null,
        notaReparacion: datos_jc.valor_jc,
        observacion: datos_jc.observacion_jc ?? null,
      },
    });

    const notaEfectiva_jc = Math.max(
      Number(notaOriginal_jc?.valor_jc ?? 0),
      datos_jc.valor_jc,
    );

    return {
      exito: true,
      reparacion: reparacion_jc,
      notaEfectiva_jc,
      mensaje: `Reparación de "${item_jc.nombre_jc}" registrada. La nota que cuenta para la definitiva es ${notaEfectiva_jc}.`,
    };
  }

  /** Elimina una reparación (por ejemplo, si se registró por error). */
  async eliminar_jc(id_reparacion_jc: number, idUsuarioElimina_jc: number) {
    const reparacion_jc = await this.prisma_jc.td_reparacion_jc.findUnique({
      where: { id_reparacion_jc },
      include: {
        item_jc: true,
        inscripcionMateria_jc: {
          include: { alumno_cjgp: true, materia_cjgp: true },
        },
      },
    });
    if (!reparacion_jc) {
      throw new NotFoundException('Reparación no encontrada.');
    }

    if (reparacion_jc.inscripcionMateria_jc.estatus_cjgp !== 'INSCRITO') {
      throw new BadRequestException(
        'No se puede eliminar la reparación de un acta ya cerrada.',
      );
    }

    await this.prisma_jc.td_reparacion_jc.delete({ where: { id_reparacion_jc } });

    await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioElimina_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
      accion_jc: ACCIONES_JC.REPARACION_ELIMINADA,
      descripcion_jc: `eliminó la reparación de "${reparacion_jc.item_jc.nombre_jc}" de ${reparacion_jc.inscripcionMateria_jc.alumno_cjgp.apellido_ahbb}, ${reparacion_jc.inscripcionMateria_jc.alumno_cjgp.nombre_ahbb} en ${reparacion_jc.inscripcionMateria_jc.materia_cjgp.codigo_cjgp}`,
      id_afectado_jc: reparacion_jc.inscripcionMateria_jc.id_usuario_im_cjgp,
      id_materia_aud_jc: reparacion_jc.inscripcionMateria_jc.id_materia_im_cjgp,
      id_periodo_aud_jc: reparacion_jc.inscripcionMateria_jc.id_periodo_im_cjgp,
      entidad_jc: 'td_reparacion_jc',
      id_entidad_jc: id_reparacion_jc,
      metodo_jc: 'DELETE',
      ruta_jc: `/control-estudios/reparaciones/${id_reparacion_jc}`,
    });

    return { exito: true, mensaje: 'Reparación eliminada.' };
  }

  /** Reparaciones de un alumno en una materia, para el diálogo de la matriz. */
  async obtenerPorInscripcion_jc(id_inscripcion_jc: number) {
    const inscripcion_jc = await this.obtenerInscripcion_jc(id_inscripcion_jc);

    const [plan_jc, reparaciones_jc, calificaciones_jc] = await Promise.all([
      this.planesService_jc.resolverPlanVigente_jc(
        inscripcion_jc.id_materia_im_cjgp,
        inscripcion_jc.id_periodo_im_cjgp,
      ),
      this.prisma_jc.td_reparacion_jc.findMany({
        where: { id_inscripcion_materia_rep_jc: id_inscripcion_jc },
        include: {
          registradoPor_jc: {
            select: { nombre_ahbb: true, apellido_ahbb: true },
          },
        },
      }),
      this.prisma_jc.td_calificacion_jc.findMany({
        where: { id_inscripcion_materia_cal_jc: id_inscripcion_jc },
      }),
    ]);

    const notaPorItem_jc = new Map(
      calificaciones_jc.map((calificacion_jc) => [
        calificacion_jc.id_item_cal_jc,
        Number(calificacion_jc.valor_jc),
      ]),
    );
    const reparacionPorItem_jc = new Map(
      reparaciones_jc.map((reparacion_jc) => [
        reparacion_jc.id_item_rep_jc,
        reparacion_jc,
      ]),
    );

    return {
      alumno: inscripcion_jc.alumno_cjgp,
      materia: inscripcion_jc.materia_cjgp,
      escala: Number(plan_jc.notaMaxima_jc),
      cortes: plan_jc.items_jc.map((item_jc) => {
        const reparacion_jc = reparacionPorItem_jc.get(item_jc.id_item_jc);
        const nota_jc = notaPorItem_jc.get(item_jc.id_item_jc) ?? null;
        return {
          id_item_jc: item_jc.id_item_jc,
          nombre_jc: item_jc.nombre_jc,
          peso_jc: Number(item_jc.peso_jc),
          nota_jc,
          reparacion_jc: reparacion_jc
            ? {
                id_reparacion_jc: reparacion_jc.id_reparacion_jc,
                valor_jc: Number(reparacion_jc.valor_jc),
                observacion_jc: reparacion_jc.observacion_jc,
                registradoPor_jc: reparacion_jc.registradoPor_jc,
              }
            : null,
          notaEfectiva_jc: reparacion_jc
            ? Math.max(nota_jc ?? 0, Number(reparacion_jc.valor_jc))
            : nota_jc,
        };
      }),
    };
  }

  private async obtenerInscripcion_jc(id_inscripcion_jc: number) {
    const inscripcion_jc =
      await this.prisma_jc.td_inscripcion_materia_cjgp.findUnique({
        where: { id_inscripcion_materia_cjgp: id_inscripcion_jc },
        include: { alumno_cjgp: true, materia_cjgp: true },
      });
    if (!inscripcion_jc) {
      throw new NotFoundException('Inscripción no encontrada.');
    }
    return inscripcion_jc;
  }
}
