import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { CertificadosSobresalienteService_jc } from './certificados-sobresaliente.service_jc';
import { CargarNotasDto_jc } from './dto/cargar-notas.dto_jc';
import { AuditoriaService_jc } from '../auditoria/auditoria.service_jc';
import {
  ACCIONES_JC,
  MODULOS_AUDITORIA_JC,
} from '../auditoria/constantes/acciones-auditoria_jc';

/** Corte del plan tal como lo necesita el cálculo de la definitiva. */
export interface ItemPlan_jc {
  id_item_jc: number;
  nombre_jc?: string;
  peso_jc: any;
}

/**
 * CalificacionesService_jc — Carga de notas dirigida por metadatos.
 *
 * El código de este servicio no sabe cuántas evaluaciones existen ni cómo se
 * llaman: la matriz de notas y el cálculo de la definitiva se derivan
 * únicamente del plan de evaluación PUBLICADO que rige el período.
 *
 * Sobre ese esquema se apoya la mecánica de REPARACIONES: cada corte puede
 * tener una nota de reparación registrada durante la carga (no en el plan), y
 * la nota que entra en la ponderación es la mejor de las dos.
 */
@Injectable()
export class CalificacionesService_jc {
  /** Rango de excelencia que otorga el Certificado de Sobresaliente. */
  private static readonly NOTA_MINIMA_SOBRESALIENTE_JC = 17;

  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly planesService_jc: PlanesEvaluacionService_jc,
    private readonly certificadosService_jc: CertificadosSobresalienteService_jc,
    private readonly auditoriaService_jc: AuditoriaService_jc,
  ) {}

  /**
   * Nota efectiva de un corte: si el alumno presentó reparación, vale la mejor
   * de las dos. Reparar nunca puede bajar la nota original.
   */
  private notaEfectiva_jc(
    id_item_jc: number,
    notasPorItem_jc: Map<number, number>,
    reparacionesPorItem_jc: Map<number, number>,
  ): number | undefined {
    const nota_jc = notasPorItem_jc.get(id_item_jc);
    const reparacion_jc = reparacionesPorItem_jc.get(id_item_jc);

    if (reparacion_jc === undefined) return nota_jc;
    if (nota_jc === undefined) return reparacion_jc;
    return Math.max(nota_jc, reparacion_jc);
  }

  /**
   * Calcula la definitiva como la suma ponderada de los cortes del plan,
   * tomando de cada uno su nota efectiva (original o reparación).
   *
   * Todo sale de los metadatos: agregar o quitar cortes en la configuración
   * cambia el cálculo sin tocar este código.
   */
  calcularDefinitiva_jc(
    items_jc: ItemPlan_jc[],
    notasPorItem_jc: Map<number, number>,
    reparacionesPorItem_jc: Map<number, number> = new Map(),
  ): number {
    let definitiva_jc = 0;

    for (const item_jc of items_jc) {
      const valor_jc =
        this.notaEfectiva_jc(
          item_jc.id_item_jc,
          notasPorItem_jc,
          reparacionesPorItem_jc,
        ) ?? 0;
      definitiva_jc += (valor_jc * Number(item_jc.peso_jc)) / 100;
    }

    return Math.round(definitiva_jc * 100) / 100;
  }

  /**
   * Materias de un período que tienen alumnos inscritos (selector del docente).
   * Si se indica un profesor, se devuelven SOLO las materias que él dicta: al
   * asignar o cambiar el profesor de una materia, ésta aparece o desaparece de
   * su carga de notas automáticamente. El personal de Control de Estudios y el
   * administrador las ven todas.
   */
  async obtenerMateriasConInscritos_jc(
    id_periodo_jc: number,
    id_profesor_jc?: number,
  ) {
    const materias_jc = await this.prisma_jc.td_materia_cjgp.findMany({
      where: {
        inscripciones_cjgp: { some: { id_periodo_im_cjgp: id_periodo_jc } },
        ...(id_profesor_jc ? { id_profesor_materia_cjgp: id_profesor_jc } : {}),
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
   * Matriz de notas de una materia en un período: el plan vigente define las
   * columnas y cada fila es un alumno con sus notas, sus reparaciones, su
   * definitiva calculada en vivo y su condición actual.
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
          reparaciones_jc: {
            include: {
              registradoPor_jc: {
                select: { nombre_ahbb: true, apellido_ahbb: true },
              },
            },
          },
          certificadoSobresaliente_jc: true,
        },
        orderBy: { alumno_cjgp: { apellido_ahbb: 'asc' } },
      });

    const aprobatoria_jc = Number(plan_jc.notaAprobatoria_jc);

    const filas_jc = inscripciones_jc.map((inscripcion_jc) => {
      const notasPorItem_jc = new Map<number, number>(
        inscripcion_jc.calificaciones_jc.map((calificacion_jc) => [
          calificacion_jc.id_item_cal_jc,
          Number(calificacion_jc.valor_jc),
        ]),
      );
      const reparacionesPorItem_jc = new Map<number, number>(
        inscripcion_jc.reparaciones_jc.map((reparacion_jc) => [
          reparacion_jc.id_item_rep_jc,
          Number(reparacion_jc.valor_jc),
        ]),
      );

      const definitiva_jc = this.calcularDefinitiva_jc(
        plan_jc.items_jc as ItemPlan_jc[],
        notasPorItem_jc,
        reparacionesPorItem_jc,
      );

      return {
        id_inscripcion_materia_jc: inscripcion_jc.id_inscripcion_materia_cjgp,
        alumno_jc: inscripcion_jc.alumno_cjgp,
        estatus_jc: inscripcion_jc.estatus_cjgp,
        notaFinal_jc: inscripcion_jc.notaFinal_cjgp,
        notas_jc: Object.fromEntries(notasPorItem_jc),
        reparaciones_jc: inscripcion_jc.reparaciones_jc.map((reparacion_jc) => ({
          id_reparacion_jc: reparacion_jc.id_reparacion_jc,
          id_item_jc: reparacion_jc.id_item_rep_jc,
          valor_jc: Number(reparacion_jc.valor_jc),
          observacion_jc: reparacion_jc.observacion_jc,
          registradoPor_jc: reparacion_jc.registradoPor_jc,
          creadoEn_jc: reparacion_jc.creadoEn_jc,
        })),
        definitiva_jc,
        aprobado_jc: definitiva_jc >= aprobatoria_jc,
        sobresaliente_jc:
          definitiva_jc >= CalificacionesService_jc.NOTA_MINIMA_SOBRESALIENTE_JC,
        certificadoSobresaliente_jc:
          inscripcion_jc.certificadoSobresaliente_jc ?? null,
      };
    });

    return {
      materia: materia_jc,
      periodo: periodo_jc,
      plan: plan_jc,
      filas: filas_jc,
      notaMinimaSobresaliente_jc:
        CalificacionesService_jc.NOTA_MINIMA_SOBRESALIENTE_JC,
    };
  }

  /**
   * Guarda (upsert) las notas enviadas por el docente, validándolas contra la
   * configuración dinámica: el corte debe pertenecer al plan vigente y el valor
   * debe respetar la escala definida por la coordinación.
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
          `El corte ${nota_jc.id_item_jc} no pertenece al plan de evaluación vigente.`,
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

    await this.auditarCargaNotas_jc(datos_jc, idUsuarioCarga_jc, plan_jc);

    return {
      exito: true,
      guardadas: datos_jc.notas_jc.length,
      mensaje: `${datos_jc.notas_jc.length} nota(s) guardadas correctamente.`,
    };
  }

  /**
   * Deja en la bitácora QUÉ notas se cargaron y A QUIÉN, que es justamente lo
   * que la auditoría de Control de Estudios necesita mostrar.
   */
  private async auditarCargaNotas_jc(
    datos_jc: CargarNotasDto_jc,
    idUsuarioCarga_jc: number,
    plan_jc: any,
  ) {
    const [materia_jc, periodo_jc, inscripciones_jc] = await Promise.all([
      this.prisma_jc.td_materia_cjgp.findUnique({
        where: { id_materia_cjgp: datos_jc.id_materia_jc },
        select: { codigo_cjgp: true, nombre_cjgp: true },
      }),
      this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: datos_jc.id_periodo_jc },
        select: { nombre_cjgp: true },
      }),
      this.prisma_jc.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_inscripcion_materia_cjgp: {
            in: datos_jc.notas_jc.map((n_jc) => n_jc.id_inscripcion_materia_jc),
          },
        },
        include: {
          alumno_cjgp: {
            select: {
              id_usuario_ahbb: true,
              nombre_ahbb: true,
              apellido_ahbb: true,
              cedula_ahbb: true,
            },
          },
        },
      }),
    ]);

    const nombreItem_jc = (id_item_jc: number) =>
      plan_jc.items_jc.find((item_jc: any) => item_jc.id_item_jc === id_item_jc)
        ?.nombre_jc ?? `Corte ${id_item_jc}`;

    const alumnoPorInscripcion_jc = new Map(
      inscripciones_jc.map((inscripcion_jc) => [
        inscripcion_jc.id_inscripcion_materia_cjgp,
        inscripcion_jc.alumno_cjgp,
      ]),
    );

    const detalle_jc = datos_jc.notas_jc.map((nota_jc) => {
      const alumno_jc = alumnoPorInscripcion_jc.get(
        nota_jc.id_inscripcion_materia_jc,
      );
      return {
        alumno: alumno_jc
          ? `${alumno_jc.apellido_ahbb}, ${alumno_jc.nombre_ahbb} (${alumno_jc.cedula_ahbb})`
          : `Inscripción ${nota_jc.id_inscripcion_materia_jc}`,
        evaluacion: nombreItem_jc(nota_jc.id_item_jc),
        nota: nota_jc.valor_jc,
      };
    });

    const alumnosDistintos_jc = new Set(
      datos_jc.notas_jc.map((n_jc) => n_jc.id_inscripcion_materia_jc),
    ).size;

    await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioCarga_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
      accion_jc: ACCIONES_JC.NOTAS_CARGADAS,
      descripcion_jc: `cargó ${datos_jc.notas_jc.length} nota(s) de ${alumnosDistintos_jc} alumno(s) en ${materia_jc?.codigo_cjgp ?? 'la materia'} — ${materia_jc?.nombre_cjgp ?? ''} (${periodo_jc?.nombre_cjgp ?? ''})`,
      id_materia_aud_jc: datos_jc.id_materia_jc,
      id_periodo_aud_jc: datos_jc.id_periodo_jc,
      entidad_jc: 'td_calificacion_jc',
      metodo_jc: 'POST',
      ruta_jc: '/control-estudios/calificaciones',
      detalle_jc: { notas: detalle_jc },
    });
  }

  /**
   * Vista del ALUMNO: las materias que está CURSANDO ACTUALMENTE (estatus
   * INSCRITO) con las notas de cada corte del plan vigente, sus reparaciones,
   * la definitiva parcial y si va aprobando. Las materias ya cursadas viven en
   * el Historial de Carrera.
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
          reparaciones_jc: true,
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
      const reparacionesPorItem_jc = new Map<number, number>(
        inscripcion_jc.reparaciones_jc.map((reparacion_jc) => [
          reparacion_jc.id_item_rep_jc,
          Number(reparacion_jc.valor_jc),
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
                valor_jc: notasPorItem_jc.get(item_jc.id_item_jc) ?? null,
                reparacion_jc:
                  reparacionesPorItem_jc.get(item_jc.id_item_jc) ?? null,
                valorEfectivo_jc:
                  this.notaEfectiva_jc(
                    item_jc.id_item_jc,
                    notasPorItem_jc,
                    reparacionesPorItem_jc,
                  ) ?? null,
              })),
            }
          : null,
        definitivaParcial_jc: plan_jc
          ? this.calcularDefinitiva_jc(
              plan_jc.items_jc,
              notasPorItem_jc,
              reparacionesPorItem_jc,
            )
          : null,
      });
    }

    return { alumno: alumno_jc, periodo: periodo_jc, materias: materias_jc };
  }

  /**
   * Consulta de solo lectura para el ADMINISTRADOR (y Control de Estudios):
   * cómo van las notas de todos los alumnos, filtrando por carrera y materia.
   * No permite modificar nada; es el equivalente en consulta de la matriz.
   */
  async consultarNotas_jc(
    id_periodo_jc: number,
    filtros_jc: { id_carrera_jc?: number; id_materia_jc?: number } = {},
  ) {
    const periodo_jc =
      await this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: id_periodo_jc },
      });
    if (!periodo_jc) {
      throw new NotFoundException('Período no encontrado.');
    }

    const materias_jc = await this.prisma_jc.td_materia_cjgp.findMany({
      where: {
        inscripciones_cjgp: { some: { id_periodo_im_cjgp: id_periodo_jc } },
        ...(filtros_jc.id_materia_jc
          ? { id_materia_cjgp: Number(filtros_jc.id_materia_jc) }
          : {}),
        ...(filtros_jc.id_carrera_jc
          ? { id_carrera_materia_cjgp: Number(filtros_jc.id_carrera_jc) }
          : {}),
      },
      include: {
        carrera_cjgp: { select: { nombre_cjgp: true, codigo_cjgp: true } },
        profesor_cjgp: { select: { nombre_ahbb: true, apellido_ahbb: true } },
      },
      orderBy: [{ id_carrera_materia_cjgp: 'asc' }, { codigo_cjgp: 'asc' }],
    });

    const resultado_jc: any[] = [];
    for (const materia_jc of materias_jc) {
      let matriz_jc: any = null;
      try {
        matriz_jc = await this.obtenerMatriz_jc(
          materia_jc.id_materia_cjgp,
          id_periodo_jc,
        );
      } catch {
        // Materia sin plan de evaluación publicado: se informa igualmente
      }

      const filas_jc = matriz_jc?.filas ?? [];
      const conNota_jc = filas_jc.filter((fila_jc: any) => fila_jc.definitiva_jc > 0);

      resultado_jc.push({
        materia_jc,
        plan_jc: matriz_jc?.plan ?? null,
        sinPlan_jc: !matriz_jc,
        totalAlumnos_jc: filas_jc.length,
        aprobando_jc: filas_jc.filter((fila_jc: any) => fila_jc.aprobado_jc).length,
        enRiesgo_jc: filas_jc.filter((fila_jc: any) => !fila_jc.aprobado_jc).length,
        sobresalientes_jc: filas_jc.filter((fila_jc: any) => fila_jc.sobresaliente_jc)
          .length,
        promedio_jc: conNota_jc.length
          ? Math.round(
              (conNota_jc.reduce(
                (suma_jc: number, fila_jc: any) => suma_jc + fila_jc.definitiva_jc,
                0,
              ) /
                conNota_jc.length) *
                100,
            ) / 100
          : null,
        filas_jc,
      });
    }

    return { periodo: periodo_jc, totalMaterias: resultado_jc.length, materias: resultado_jc };
  }

  /**
   * Cierre del acta: calcula la definitiva de cada alumno con el plan vigente
   * (reparaciones incluidas) y actualiza su historial (APROBADO/REPROBADO +
   * nota final). Este paso alimenta al Motor de Reglas del módulo de carreras:
   * las materias aprobadas aquí desbloquean sus prelaciones en la vitrina.
   *
   * Además emite el Certificado de Sobresaliente a quienes cierren con 17 o más.
   */
  async cerrarActa_jc(
    id_materia_jc: number,
    id_periodo_jc: number,
    idUsuarioCierra_jc: number,
  ) {
    const matriz_jc = await this.obtenerMatriz_jc(id_materia_jc, id_periodo_jc);

    if (matriz_jc.filas.length === 0) {
      throw new BadRequestException(
        'No hay alumnos inscritos en esta materia para el período.',
      );
    }

    // Verificar completitud: todos los cortes del plan deben tener nota
    const incompletos_jc = matriz_jc.filas.filter((fila_jc) =>
      matriz_jc.plan.items_jc.some(
        (item_jc: any) =>
          fila_jc.notas_jc[item_jc.id_item_jc] === undefined &&
          !fila_jc.reparaciones_jc.some(
            (reparacion_jc: any) => reparacion_jc.id_item_jc === item_jc.id_item_jc,
          ),
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

    // Certificados de sobresaliente (17 a 20) + notificación de felicitación
    const certificados_jc = await this.certificadosService_jc.emitirPorCierre_jc(
      matriz_jc,
      idUsuarioCierra_jc,
      CalificacionesService_jc.NOTA_MINIMA_SOBRESALIENTE_JC,
    );

    const aprobados_jc = matriz_jc.filas.filter(
      (fila_jc) => fila_jc.definitiva_jc >= aprobatoria_jc,
    ).length;
    const reprobados_jc = matriz_jc.filas.length - aprobados_jc;

    await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioCierra_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
      accion_jc: ACCIONES_JC.ACTA_CERRADA,
      descripcion_jc: `cerró el acta de ${matriz_jc.materia.codigo_cjgp} — ${matriz_jc.materia.nombre_cjgp} (${matriz_jc.periodo.nombre_cjgp}): ${aprobados_jc} aprobado(s) y ${reprobados_jc} reprobado(s) de ${matriz_jc.filas.length}`,
      id_materia_aud_jc: id_materia_jc,
      id_periodo_aud_jc: id_periodo_jc,
      entidad_jc: 'td_inscripcion_materia_cjgp',
      metodo_jc: 'POST',
      ruta_jc: `/control-estudios/calificaciones/cerrar-acta/${id_materia_jc}/${id_periodo_jc}`,
      detalle_jc: {
        aprobados: aprobados_jc,
        reprobados: reprobados_jc,
        certificadosSobresaliente: certificados_jc.length,
        notas: matriz_jc.filas.map((fila_jc) => ({
          alumno: `${fila_jc.alumno_jc.apellido_ahbb}, ${fila_jc.alumno_jc.nombre_ahbb}`,
          definitiva: fila_jc.definitiva_jc,
        })),
      },
    });

    const mensajeCertificados_jc = certificados_jc.length
      ? ` Se emitieron ${certificados_jc.length} certificado(s) de sobresaliente.`
      : '';

    return {
      exito: true,
      totalAlumnos: matriz_jc.filas.length,
      aprobados: aprobados_jc,
      reprobados: reprobados_jc,
      certificadosSobresaliente: certificados_jc,
      mensaje: `Acta cerrada: ${aprobados_jc} aprobados y ${reprobados_jc} reprobados de ${matriz_jc.filas.length} alumnos.${mensajeCertificados_jc}`,
    };
  }
}
