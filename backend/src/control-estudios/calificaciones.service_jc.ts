import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { CargarNotasDto_jc } from './dto/cargar-notas.dto_jc';

/**
 * CalificacionesService_jc — Carga de notas dirigida por metadatos.
 *
 * El código de este servicio no sabe cuántas evaluaciones existen ni cómo
 * se llaman: la matriz de notas y el cálculo de la definitiva se derivan
 * únicamente del plan de evaluación PUBLICADO que rige el período.
 */
@Injectable()
export class CalificacionesService_jc {
  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly planesService_jc: PlanesEvaluacionService_jc,
  ) {}

  /**
   * Calcula la definitiva de un alumno según la configuración del plan:
   *  - Ítems regulares: suma ponderada (valor × peso / 100).
   *  - Ítems de recuperación (ej. "Reparación"): si el alumno la presentó,
   *    sustituye la definitiva cuando la mejora.
   * Todo sale de los metadatos: agregar un corte o una reparación en la
   * configuración cambia el cálculo sin tocar este código.
   */
  calcularDefinitiva_jc(
    items_jc: { id_item_jc: number; peso_jc: any; esRecuperacion_jc: boolean }[],
    notasPorItem_jc: Map<number, number>,
  ): number {
    let definitiva_jc = 0;

    for (const item_jc of items_jc) {
      if (item_jc.esRecuperacion_jc) continue;
      const valor_jc = notasPorItem_jc.get(item_jc.id_item_jc) ?? 0;
      definitiva_jc += (valor_jc * Number(item_jc.peso_jc)) / 100;
    }

    for (const item_jc of items_jc) {
      if (!item_jc.esRecuperacion_jc) continue;
      const valorRecuperacion_jc = notasPorItem_jc.get(item_jc.id_item_jc);
      if (valorRecuperacion_jc !== undefined) {
        definitiva_jc = Math.max(definitiva_jc, valorRecuperacion_jc);
      }
    }

    return Math.round(definitiva_jc * 100) / 100;
  }

  /**
   * Materias de un período que tienen alumnos inscritos (selector del docente).
   * Si se indica un profesor, se devuelven SOLO las materias que él dicta:
   * al asignar/cambiar el profesor de una materia, esta aparece o desaparece
   * de su Carga de Notas automáticamente (la asignación vive en la BD).
   */
  async obtenerMateriasConInscritos_jc(
    id_periodo_jc: number,
    id_profesor_jc?: number,
  ) {
    const materias_jc = await this.prisma_jc.td_materia_cjgp.findMany({
      where: {
        inscripciones_cjgp: { some: { id_periodo_im_cjgp: id_periodo_jc } },
        ...(id_profesor_jc
          ? { id_profesor_materia_cjgp: id_profesor_jc }
          : {}),
      },
      include: {
        carrera_cjgp: { select: { nombre_cjgp: true, codigo_cjgp: true } },
        profesor_cjgp: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
        _count: {
          select: {
            inscripciones_cjgp: {
              where: { id_periodo_im_cjgp: id_periodo_jc },
            },
          },
        },
      },
      orderBy: { codigo_cjgp: 'asc' },
    });

    return materias_jc.map((materia_jc) => ({
      ...materia_jc,
      totalInscritos_jc: materia_jc._count.inscripciones_cjgp,
    }));
  }

  /**
   * Matriz de notas de una materia en un período: el plan vigente define
   * las columnas y cada fila es un alumno con sus notas, su definitiva
   * calculada en vivo y su condición actual.
   */
  async obtenerMatriz_jc(id_materia_jc: number, id_periodo_jc: number) {
    const materia_jc = await this.prisma_jc.td_materia_cjgp.findUnique({
      where: { id_materia_cjgp: id_materia_jc },
      include: {
        carrera_cjgp: true,
        profesor_cjgp: {
          select: { nombre_ahbb: true, apellido_ahbb: true, cedula_ahbb: true },
        },
      },
    });
    if (!materia_jc) {
      throw new NotFoundException('Materia no encontrada.');
    }

    const periodo_jc =
      await this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: id_periodo_jc },
      });
    if (!periodo_jc) {
      throw new NotFoundException('Período no encontrado.');
    }

    // Las columnas de la matriz nacen del plan (metadatos), no del código
    const plan_jc = await this.planesService_jc.resolverPlanVigente_jc(
      id_materia_jc,
      id_periodo_jc,
    );

    const inscripciones_jc =
      await this.prisma_jc.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_materia_im_cjgp: id_materia_jc,
          id_periodo_im_cjgp: id_periodo_jc,
          estatus_cjgp: { not: 'RETIRADO' },
        },
        include: {
          alumno_cjgp: {
            select: {
              id_usuario_ahbb: true,
              cedula_ahbb: true,
              nombre_ahbb: true,
              apellido_ahbb: true,
            },
          },
          calificaciones_jc: true,
        },
        orderBy: { alumno_cjgp: { apellido_ahbb: 'asc' } },
      });

    const filas_jc = inscripciones_jc.map((inscripcion_jc) => {
      const notasPorItem_jc = new Map<number, number>(
        inscripcion_jc.calificaciones_jc.map((calificacion_jc) => [
          calificacion_jc.id_item_cal_jc,
          Number(calificacion_jc.valor_jc),
        ]),
      );

      const definitiva_jc = this.calcularDefinitiva_jc(
        plan_jc.items_jc as any[],
        notasPorItem_jc,
      );

      return {
        id_inscripcion_materia_jc: inscripcion_jc.id_inscripcion_materia_cjgp,
        alumno_jc: inscripcion_jc.alumno_cjgp,
        estatus_jc: inscripcion_jc.estatus_cjgp,
        notaFinal_jc: inscripcion_jc.notaFinal_cjgp,
        notas_jc: Object.fromEntries(notasPorItem_jc),
        definitiva_jc,
        aprobado_jc: definitiva_jc >= Number(plan_jc.notaAprobatoria_jc),
      };
    });

    return {
      materia: materia_jc,
      periodo: periodo_jc,
      plan: plan_jc,
      filas: filas_jc,
    };
  }

  /**
   * Guarda (upsert) las notas enviadas por el docente, validándolas contra
   * la configuración dinámica: el ítem debe pertenecer al plan vigente y el
   * valor debe respetar la escala definida por la coordinación.
   */
  async cargarNotas_jc(datos_jc: CargarNotasDto_jc, idUsuarioCarga_jc: number) {
    const plan_jc = await this.planesService_jc.resolverPlanVigente_jc(
      datos_jc.id_materia_jc,
      datos_jc.id_periodo_jc,
    );

    const idsItemsValidos_jc = new Set(
      plan_jc.items_jc.map((item_jc) => item_jc.id_item_jc),
    );
    const notaMaxima_jc = Number(plan_jc.notaMaxima_jc);

    // Verificar que las inscripciones pertenezcan a la materia y período indicados
    const idsInscripciones_jc = [
      ...new Set(datos_jc.notas_jc.map((n_jc) => n_jc.id_inscripcion_materia_jc)),
    ];
    const inscripcionesValidas_jc =
      await this.prisma_jc.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_inscripcion_materia_cjgp: { in: idsInscripciones_jc },
          id_materia_im_cjgp: datos_jc.id_materia_jc,
          id_periodo_im_cjgp: datos_jc.id_periodo_jc,
        },
        select: { id_inscripcion_materia_cjgp: true },
      });
    const setInscripciones_jc = new Set(
      inscripcionesValidas_jc.map((i_jc) => i_jc.id_inscripcion_materia_cjgp),
    );

    const errores_jc: string[] = [];
    for (const nota_jc of datos_jc.notas_jc) {
      if (!idsItemsValidos_jc.has(nota_jc.id_item_jc)) {
        errores_jc.push(
          `El ítem ${nota_jc.id_item_jc} no pertenece al plan de evaluación vigente.`,
        );
      }
      if (!setInscripciones_jc.has(nota_jc.id_inscripcion_materia_jc)) {
        errores_jc.push(
          `La inscripción ${nota_jc.id_inscripcion_materia_jc} no corresponde a esta materia y período.`,
        );
      }
      if (nota_jc.valor_jc < 0 || nota_jc.valor_jc > notaMaxima_jc) {
        errores_jc.push(
          `La nota ${nota_jc.valor_jc} está fuera de la escala del plan (0 a ${notaMaxima_jc}).`,
        );
      }
    }
    if (errores_jc.length > 0) {
      throw new BadRequestException({
        mensaje: 'Algunas notas no superaron la validación.',
        errores: errores_jc,
      });
    }

    await this.prisma_jc.$transaction(
      datos_jc.notas_jc.map((nota_jc) =>
        this.prisma_jc.td_calificacion_jc.upsert({
          where: {
            id_inscripcion_materia_cal_jc_id_item_cal_jc: {
              id_inscripcion_materia_cal_jc: nota_jc.id_inscripcion_materia_jc,
              id_item_cal_jc: nota_jc.id_item_jc,
            },
          },
          create: {
            id_inscripcion_materia_cal_jc: nota_jc.id_inscripcion_materia_jc,
            id_item_cal_jc: nota_jc.id_item_jc,
            valor_jc: nota_jc.valor_jc,
            cargadoPorUsuarioId_jc: idUsuarioCarga_jc,
          },
          update: {
            valor_jc: nota_jc.valor_jc,
            cargadoPorUsuarioId_jc: idUsuarioCarga_jc,
            actualizadoEn_jc: new Date(),
          },
        }),
      ),
    );

    return {
      exito: true,
      guardadas: datos_jc.notas_jc.length,
      mensaje: `${datos_jc.notas_jc.length} nota(s) guardadas correctamente.`,
    };
  }

  /**
   * Vista del ALUMNO: las materias que está CURSANDO ACTUALMENTE (estatus
   * INSCRITO) con las notas de cada hito del plan vigente, la definitiva
   * parcial y si va aprobando o no. Las materias ya cursadas viven en el
   * Historial de Carrera. También aquí las columnas nacen de los metadatos.
   */
  async obtenerMisNotas_jc(id_usuario_jc: number, id_periodo_jc: number) {
    const [alumno_jc, periodo_jc, inscripciones_jc] = await Promise.all([
      this.prisma_jc.td_usuario_ahbb.findUnique({
        where: { id_usuario_ahbb: id_usuario_jc },
        select: {
          id_usuario_ahbb: true,
          cedula_ahbb: true,
          nombre_ahbb: true,
          apellido_ahbb: true,
        },
      }),
      this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: id_periodo_jc },
      }),
      this.prisma_jc.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_usuario_im_cjgp: id_usuario_jc,
          id_periodo_im_cjgp: id_periodo_jc,
          // Solo lo que cursa AHORA: lo aprobado/reprobado pasa al historial
          estatus_cjgp: 'INSCRITO',
        },
        include: {
          materia_cjgp: {
            include: {
              carrera_cjgp: true,
              profesor_cjgp: {
                select: { nombre_ahbb: true, apellido_ahbb: true },
              },
            },
          },
          calificaciones_jc: true,
        },
        orderBy: { materia_cjgp: { codigo_cjgp: 'asc' } },
      }),
    ]);

    if (!periodo_jc) {
      throw new NotFoundException('Período no encontrado.');
    }

    const materias_jc: any[] = [];
    for (const inscripcion_jc of inscripciones_jc) {
      // El plan puede variar por carrera: se resuelve materia por materia
      let plan_jc: any = null;
      try {
        plan_jc = await this.planesService_jc.resolverPlanVigente_jc(
          inscripcion_jc.id_materia_im_cjgp,
          id_periodo_jc,
        );
      } catch {
        // Sin plan publicado: se muestra la materia sin desglose de notas
      }

      const notasPorItem_jc = new Map<number, number>(
        inscripcion_jc.calificaciones_jc.map((calificacion_jc) => [
          calificacion_jc.id_item_cal_jc,
          Number(calificacion_jc.valor_jc),
        ]),
      );

      materias_jc.push({
        id_inscripcion_materia_jc: inscripcion_jc.id_inscripcion_materia_cjgp,
        materia_jc: {
          id_materia_cjgp: inscripcion_jc.materia_cjgp.id_materia_cjgp,
          codigo_cjgp: inscripcion_jc.materia_cjgp.codigo_cjgp,
          nombre_cjgp: inscripcion_jc.materia_cjgp.nombre_cjgp,
          creditos_cjgp: inscripcion_jc.materia_cjgp.creditos_cjgp,
          nroBloque_cjgp: inscripcion_jc.materia_cjgp.nroBloque_cjgp,
          carrera_cjgp: {
            nombre_cjgp: inscripcion_jc.materia_cjgp.carrera_cjgp.nombre_cjgp,
            codigo_cjgp: inscripcion_jc.materia_cjgp.carrera_cjgp.codigo_cjgp,
            regimen_cjgp: inscripcion_jc.materia_cjgp.carrera_cjgp.regimen_cjgp,
          },
          profesor_cjgp: inscripcion_jc.materia_cjgp.profesor_cjgp ?? null,
        },
        estatus_jc: inscripcion_jc.estatus_cjgp,
        notaFinal_jc: inscripcion_jc.notaFinal_cjgp,
        plan_jc: plan_jc
          ? {
              nombre_jc: plan_jc.nombre_jc,
              notaMaxima_jc: plan_jc.notaMaxima_jc,
              notaAprobatoria_jc: plan_jc.notaAprobatoria_jc,
              items_jc: plan_jc.items_jc.map((item_jc: any) => ({
                id_item_jc: item_jc.id_item_jc,
                nombre_jc: item_jc.nombre_jc,
                peso_jc: item_jc.peso_jc,
                esRecuperacion_jc: item_jc.esRecuperacion_jc,
                valor_jc: notasPorItem_jc.get(item_jc.id_item_jc) ?? null,
              })),
            }
          : null,
        definitivaParcial_jc: plan_jc
          ? this.calcularDefinitiva_jc(plan_jc.items_jc, notasPorItem_jc)
          : null,
      });
    }

    return { alumno: alumno_jc, periodo: periodo_jc, materias: materias_jc };
  }

  /**
   * Cierre del acta: calcula la definitiva de cada alumno con el plan
   * vigente y actualiza su historial (APROBADO/REPROBADO + nota final).
   * Este paso alimenta al Motor de Reglas del módulo de carreras: las
   * materias aprobadas aquí desbloquean sus prelaciones en la vitrina.
   */
  async cerrarActa_jc(id_materia_jc: number, id_periodo_jc: number) {
    const matriz_jc = await this.obtenerMatriz_jc(id_materia_jc, id_periodo_jc);

    if (matriz_jc.filas.length === 0) {
      throw new BadRequestException(
        'No hay alumnos inscritos en esta materia para el período.',
      );
    }

    // Verificar completitud: todos los ítems regulares deben tener nota
    const itemsRegulares_jc = matriz_jc.plan.items_jc.filter(
      (item_jc: any) => !item_jc.esRecuperacion_jc,
    );
    const incompletos_jc = matriz_jc.filas.filter((fila_jc) =>
      itemsRegulares_jc.some(
        (item_jc: any) => fila_jc.notas_jc[item_jc.id_item_jc] === undefined,
      ),
    );
    if (incompletos_jc.length > 0) {
      const nombres_jc = incompletos_jc
        .map(
          (fila_jc) =>
            `${fila_jc.alumno_jc.apellido_ahbb} ${fila_jc.alumno_jc.nombre_ahbb}`,
        )
        .join(', ');
      throw new BadRequestException(
        `No se puede cerrar el acta: faltan notas de ${nombres_jc}.`,
      );
    }

    const aprobatoria_jc = Number(matriz_jc.plan.notaAprobatoria_jc);

    await this.prisma_jc.$transaction(
      matriz_jc.filas.map((fila_jc) =>
        this.prisma_jc.td_inscripcion_materia_cjgp.update({
          where: {
            id_inscripcion_materia_cjgp: fila_jc.id_inscripcion_materia_jc,
          },
          data: {
            notaFinal_cjgp: fila_jc.definitiva_jc,
            estatus_cjgp:
              fila_jc.definitiva_jc >= aprobatoria_jc ? 'APROBADO' : 'REPROBADO',
            actualizadoEn_cjgp: new Date(),
          },
        }),
      ),
    );

    const aprobados_jc = matriz_jc.filas.filter(
      (fila_jc) => fila_jc.definitiva_jc >= aprobatoria_jc,
    ).length;

    return {
      exito: true,
      totalAlumnos: matriz_jc.filas.length,
      aprobados: aprobados_jc,
      reprobados: matriz_jc.filas.length - aprobados_jc,
      mensaje: `Acta cerrada: ${aprobados_jc} aprobados y ${matriz_jc.filas.length - aprobados_jc} reprobados de ${matriz_jc.filas.length} alumnos.`,
    };
  }
}
