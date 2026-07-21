import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlantillasService_ga } from './plantillas.service_ga';
import { CrearPlanEstudioDto_ga } from './dto/crear-plan-estudio.dto_ga';
import { RevisarPlanDto_ga } from './dto/revisar-plan.dto_ga';
import * as crypto from 'crypto';
// @ts-ignore - pdfmake 0.3.x exporta el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * PlanesEstudioService_ga — Elaboración, revisión y consumo de planes.
 *
 * El profesor llena las secciones y unidades definidas por la plantilla
 * institucional. La coordinación revisa, aprueba o devuelve.
 * Los alumnos consultan los planes aprobados de sus materias.
 */
@Injectable()
export class PlanesEstudioService_ga {
  constructor(
    private readonly prisma_ga: PrismaService,
    private readonly plantillasService_ga: PlantillasService_ga,
  ) {}

  /** Include estándar para las consultas de planes. */
  private readonly includeCompleto_ga = {
    materia_ga: {
      include: {
        carrera_cjgp: { select: { nombre_cjgp: true, codigo_cjgp: true } },
      },
    },
    periodo_ga: true,
    profesor_ga: {
      select: {
        id_usuario_ahbb: true,
        nombre_ahbb: true,
        apellido_ahbb: true,
        cedula_ahbb: true,
      },
    },
    plantilla_ga: {
      include: {
        secciones_ga: { orderBy: { orden_ga: 'asc' as const } },
        niveles_ga: { orderBy: { orden_ga: 'asc' as const } },
      },
    },
    contenidos_ga: {
      include: { seccion_ga: true },
      orderBy: { seccion_ga: { orden_ga: 'asc' as const } },
    },
    unidades_ga: {
      include: {
        indicadores_ga: {
          include: { nivel_ga: true },
          orderBy: { orden_ga: 'asc' as const },
        },
        itemEvaluacion_ga: true,
      },
      orderBy: { orden_ga: 'asc' as const },
    },
    revisiones_ga: {
      include: {
        revisor_ga: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
      },
      orderBy: { creadoEn_ga: 'desc' as const },
    },
  };

  /** Planes del profesor autenticado en un período. */
  async obtenerMisPlanes_ga(id_profesor_ga: number, id_periodo_ga: number) {
    return this.prisma_ga.td_plan_estudio_ga.findMany({
      where: { id_profesor_ga, id_periodo_ga },
      include: this.includeCompleto_ga,
      orderBy: { creadoEn_ga: 'desc' },
    });
  }

  /** Detalle completo de un plan. */
  async obtenerPorId_ga(id_plan_estudio_ga: number) {
    const plan_ga = await this.prisma_ga.td_plan_estudio_ga.findUnique({
      where: { id_plan_estudio_ga },
      include: this.includeCompleto_ga,
    });
    if (!plan_ga) {
      throw new NotFoundException('Plan de estudio no encontrado.');
    }
    return plan_ga;
  }

  /**
   * El profesor crea un plan para una de sus materias asignadas.
   * Valida: materia asignada al profesor, plantilla publicada, unicidad.
   */
  async crear_ga(datos_ga: CrearPlanEstudioDto_ga, id_profesor_ga: number) {
    // Verificar que la materia está asignada al profesor
    const materia_ga = await this.prisma_ga.td_materia_cjgp.findUnique({
      where: { id_materia_cjgp: datos_ga.id_materia_ga },
    });
    if (!materia_ga) {
      throw new NotFoundException('Materia no encontrada.');
    }
    if (materia_ga.id_profesor_materia_cjgp !== id_profesor_ga) {
      throw new ForbiddenException(
        'Solo puedes elaborar el plan de las materias que tienes asignadas.',
      );
    }

    // Verificar unicidad materia-período
    const duplicado_ga = await this.prisma_ga.td_plan_estudio_ga.findFirst({
      where: {
        id_materia_ga: datos_ga.id_materia_ga,
        id_periodo_ga: datos_ga.id_periodo_ga,
      },
    });
    if (duplicado_ga) {
      throw new BadRequestException(
        'Ya existe un plan de estudio para esta materia en este período.',
      );
    }

    // Obtener la plantilla vigente del período
    const plantilla_ga = await this.plantillasService_ga.obtenerVigente_ga(
      datos_ga.id_periodo_ga,
    );

    // Validar cronograma contra las fechas del período
    const periodo_ga =
      await this.prisma_ga.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: datos_ga.id_periodo_ga },
      });
    if (!periodo_ga) {
      throw new NotFoundException('Período no encontrado.');
    }

    if (datos_ga.unidades_ga) {
      for (const unidad_ga of datos_ga.unidades_ga) {
        const inicio_ga = new Date(unidad_ga.fecha_inicio_ga);
        const fin_ga = new Date(unidad_ga.fecha_fin_ga);
        if (inicio_ga >= fin_ga) {
          throw new BadRequestException(
            `La unidad "${unidad_ga.nombre_ga}" tiene la fecha de inicio posterior o igual a la de fin.`,
          );
        }
        if (
          inicio_ga < periodo_ga.fechaInicio_cjgp ||
          fin_ga > periodo_ga.fechaFin_cjgp
        ) {
          throw new BadRequestException(
            `La unidad "${unidad_ga.nombre_ga}" se sale del rango del período (${periodo_ga.fechaInicio_cjgp.toISOString().slice(0, 10)} a ${periodo_ga.fechaFin_cjgp.toISOString().slice(0, 10)}).`,
          );
        }
      }
    }

    const plan_ga = await this.prisma_ga.$transaction(async (tx_ga) => {
      const planCreado_ga = await tx_ga.td_plan_estudio_ga.create({
        data: {
          id_materia_ga: datos_ga.id_materia_ga,
          id_periodo_ga: datos_ga.id_periodo_ga,
          id_profesor_ga,
          id_plantilla_ga: plantilla_ga.id_plantilla_ga,
          estado_ga: 'BORRADOR',
        },
      });

      // Crear contenidos de secciones
      if (datos_ga.contenidos_ga) {
        for (const contenido_ga of datos_ga.contenidos_ga) {
          await tx_ga.td_contenido_seccion_ga.create({
            data: {
              id_plan_contenido_ga: planCreado_ga.id_plan_estudio_ga,
              id_seccion_contenido_ga: contenido_ga.id_seccion_ga,
              texto_ga: contenido_ga.texto_ga ?? null,
            },
          });
        }
      }

      // Crear unidades con indicadores
      if (datos_ga.unidades_ga) {
        for (const unidad_ga of datos_ga.unidades_ga) {
          const unidadCreada_ga = await tx_ga.td_unidad_ga.create({
            data: {
              id_plan_unidad_ga: planCreado_ga.id_plan_estudio_ga,
              nombre_ga: unidad_ga.nombre_ga.trim(),
              orden_ga: unidad_ga.orden_ga,
              fecha_inicio_ga: new Date(unidad_ga.fecha_inicio_ga),
              fecha_fin_ga: new Date(unidad_ga.fecha_fin_ga),
              id_item_evaluacion_ga:
                unidad_ga.id_item_evaluacion_ga ?? null,
            },
          });

          if (unidad_ga.indicadores_ga) {
            for (const indicador_ga of unidad_ga.indicadores_ga) {
              await tx_ga.td_indicador_ga.create({
                data: {
                  id_unidad_indicador_ga: unidadCreada_ga.id_unidad_ga,
                  descripcion_ga: indicador_ga.descripcion_ga.trim(),
                  orden_ga: indicador_ga.orden_ga,
                  valor_ga: indicador_ga.valor_ga ?? null,
                  id_nivel_ga: indicador_ga.id_nivel_ga ?? null,
                },
              });
            }
          }
        }
      }

      return planCreado_ga;
    });

    const planCompleto_ga = await this.obtenerPorId_ga(
      plan_ga.id_plan_estudio_ga,
    );

    return {
      exito: true,
      plan: planCompleto_ga,
      mensaje: `Plan de estudio para "${materia_ga.nombre_cjgp}" creado en estado BORRADOR.`,
    };
  }

  /** Actualiza un plan (solo BORRADOR o DEVUELTO). */
  async actualizar_ga(
    id_plan_estudio_ga: number,
    datos_ga: CrearPlanEstudioDto_ga,
    id_profesor_ga: number,
  ) {
    const plan_ga = await this.obtenerPorId_ga(id_plan_estudio_ga);

    if (plan_ga.id_profesor_ga !== id_profesor_ga) {
      throw new ForbiddenException('Solo puedes editar tus propios planes.');
    }
    if (!['BORRADOR', 'DEVUELTO'].includes(plan_ga.estado_ga)) {
      throw new BadRequestException(
        `El plan está en estado "${plan_ga.estado_ga}" y no se puede editar.`,
      );
    }

    // Validar cronograma
    if (datos_ga.unidades_ga) {
      const periodo_ga = plan_ga.periodo_ga;
      for (const unidad_ga of datos_ga.unidades_ga) {
        const inicio_ga = new Date(unidad_ga.fecha_inicio_ga);
        const fin_ga = new Date(unidad_ga.fecha_fin_ga);
        if (inicio_ga >= fin_ga) {
          throw new BadRequestException(
            `La unidad "${unidad_ga.nombre_ga}" tiene la fecha de inicio posterior o igual a la de fin.`,
          );
        }
        if (
          inicio_ga < periodo_ga.fechaInicio_cjgp ||
          fin_ga > periodo_ga.fechaFin_cjgp
        ) {
          throw new BadRequestException(
            `La unidad "${unidad_ga.nombre_ga}" se sale del rango del período.`,
          );
        }
      }
    }

    await this.prisma_ga.$transaction(async (tx_ga) => {
      // Limpiar contenidos y unidades previas
      await tx_ga.td_contenido_seccion_ga.deleteMany({
        where: { id_plan_contenido_ga: id_plan_estudio_ga },
      });
      await tx_ga.td_unidad_ga.deleteMany({
        where: { id_plan_unidad_ga: id_plan_estudio_ga },
      });

      // Recrear contenidos
      if (datos_ga.contenidos_ga) {
        for (const contenido_ga of datos_ga.contenidos_ga) {
          await tx_ga.td_contenido_seccion_ga.create({
            data: {
              id_plan_contenido_ga: id_plan_estudio_ga,
              id_seccion_contenido_ga: contenido_ga.id_seccion_ga,
              texto_ga: contenido_ga.texto_ga ?? null,
            },
          });
        }
      }

      // Recrear unidades con indicadores
      if (datos_ga.unidades_ga) {
        for (const unidad_ga of datos_ga.unidades_ga) {
          const unidadCreada_ga = await tx_ga.td_unidad_ga.create({
            data: {
              id_plan_unidad_ga: id_plan_estudio_ga,
              nombre_ga: unidad_ga.nombre_ga.trim(),
              orden_ga: unidad_ga.orden_ga,
              fecha_inicio_ga: new Date(unidad_ga.fecha_inicio_ga),
              fecha_fin_ga: new Date(unidad_ga.fecha_fin_ga),
              id_item_evaluacion_ga:
                unidad_ga.id_item_evaluacion_ga ?? null,
            },
          });

          if (unidad_ga.indicadores_ga) {
            for (const indicador_ga of unidad_ga.indicadores_ga) {
              await tx_ga.td_indicador_ga.create({
                data: {
                  id_unidad_indicador_ga: unidadCreada_ga.id_unidad_ga,
                  descripcion_ga: indicador_ga.descripcion_ga.trim(),
                  orden_ga: indicador_ga.orden_ga,
                  valor_ga: indicador_ga.valor_ga ?? null,
                  id_nivel_ga: indicador_ga.id_nivel_ga ?? null,
                },
              });
            }
          }
        }
      }

      // Si era DEVUELTO, vuelve a BORRADOR al editar
      if (plan_ga.estado_ga === 'DEVUELTO') {
        await tx_ga.td_plan_estudio_ga.update({
          where: { id_plan_estudio_ga },
          data: { estado_ga: 'BORRADOR', actualizadoEn_ga: new Date() },
        });
      } else {
        await tx_ga.td_plan_estudio_ga.update({
          where: { id_plan_estudio_ga },
          data: { actualizadoEn_ga: new Date() },
        });
      }
    });

    return {
      exito: true,
      plan: await this.obtenerPorId_ga(id_plan_estudio_ga),
      mensaje: 'Plan de estudio actualizado.',
    };
  }

  /** El profesor entrega el plan para revisión de la coordinación. */
  async entregar_ga(id_plan_estudio_ga: number, id_profesor_ga: number) {
    const plan_ga = await this.obtenerPorId_ga(id_plan_estudio_ga);

    if (plan_ga.id_profesor_ga !== id_profesor_ga) {
      throw new ForbiddenException('Solo puedes entregar tus propios planes.');
    }
    if (!['BORRADOR', 'DEVUELTO'].includes(plan_ga.estado_ga)) {
      throw new BadRequestException(
        `El plan está en estado "${plan_ga.estado_ga}" y no se puede entregar.`,
      );
    }

    // Validar que las secciones obligatorias tengan contenido
    const seccionesObligatorias_ga = plan_ga.plantilla_ga.secciones_ga.filter(
      (s_ga) => s_ga.obligatoria_ga,
    );
    for (const seccion_ga of seccionesObligatorias_ga) {
      const contenido_ga = plan_ga.contenidos_ga.find(
        (c_ga) => c_ga.id_seccion_contenido_ga === seccion_ga.id_seccion_ga,
      );
      if (!contenido_ga || !contenido_ga.texto_ga?.trim()) {
        throw new BadRequestException(
          `La sección obligatoria "${seccion_ga.nombre_ga}" está vacía. Complétala antes de entregar.`,
        );
      }
    }

    if (plan_ga.unidades_ga.length === 0) {
      throw new BadRequestException(
        'El plan debe tener al menos una unidad temática con cronograma.',
      );
    }

    await this.prisma_ga.td_plan_estudio_ga.update({
      where: { id_plan_estudio_ga },
      data: { estado_ga: 'ENTREGADO', actualizadoEn_ga: new Date() },
    });

    return {
      exito: true,
      mensaje: 'Plan de estudio entregado. La coordinación lo revisará.',
    };
  }

  // ─── Operaciones de la coordinación (Admin) ─────────────────

  /** Bandeja de revisión: planes entregados por período. */
  async obtenerBandeja_ga(id_periodo_ga: number) {
    return this.prisma_ga.td_plan_estudio_ga.findMany({
      where: { id_periodo_ga },
      include: this.includeCompleto_ga,
      orderBy: [{ estado_ga: 'asc' }, { actualizadoEn_ga: 'desc' }],
    });
  }

  /** Aprobar o devolver un plan entregado. */
  async revisar_ga(
    id_plan_estudio_ga: number,
    datos_ga: RevisarPlanDto_ga,
    id_revisor_ga: number,
  ) {
    const plan_ga = await this.obtenerPorId_ga(id_plan_estudio_ga);

    if (plan_ga.estado_ga !== 'ENTREGADO') {
      throw new BadRequestException(
        `Solo se pueden revisar planes en estado ENTREGADO (actual: ${plan_ga.estado_ga}).`,
      );
    }

    if (
      datos_ga.accion_ga === 'DEVUELTO' &&
      !datos_ga.observacion_ga?.trim()
    ) {
      throw new BadRequestException(
        'Debes indicar una observación al devolver el plan.',
      );
    }

    await this.prisma_ga.$transaction(async (tx_ga) => {
      // Registrar la revisión
      await tx_ga.td_revision_plan_ga.create({
        data: {
          id_plan_revision_ga: id_plan_estudio_ga,
          id_revisor_ga,
          accion_ga: datos_ga.accion_ga,
          observacion_ga: datos_ga.observacion_ga?.trim() ?? null,
        },
      });

      const updateData_ga: any = {
        estado_ga: datos_ga.accion_ga,
        actualizadoEn_ga: new Date(),
      };

      // Al aprobar: generar código y hash de verificación
      if (datos_ga.accion_ga === 'APROBADO') {
        const contenidoVerificable_ga = JSON.stringify({
          materia: plan_ga.materia_ga.codigo_cjgp,
          periodo: plan_ga.periodo_ga.nombre_cjgp,
          profesor: plan_ga.profesor_ga.cedula_ahbb,
          unidades: plan_ga.unidades_ga.map((u_ga) => ({
            nombre: u_ga.nombre_ga,
            indicadores: u_ga.indicadores_ga.map((i_ga) => i_ga.descripcion_ga),
          })),
        });
        updateData_ga.hashVerificacion_ga = crypto
          .createHash('sha256')
          .update(contenidoVerificable_ga)
          .digest('hex');
        updateData_ga.codigo_ga = `PE-${plan_ga.periodo_ga.nombre_cjgp}-${plan_ga.materia_ga.codigo_cjgp}-${Date.now().toString(36).toUpperCase()}`;
      }

      await tx_ga.td_plan_estudio_ga.update({
        where: { id_plan_estudio_ga },
        data: updateData_ga,
      });
    });

    return {
      exito: true,
      mensaje:
        datos_ga.accion_ga === 'APROBADO'
          ? 'Plan de estudio aprobado correctamente.'
          : 'Plan devuelto al profesor con observaciones.',
    };
  }

  // ─── Vista del alumno ───────────────────────────────────────

  /** Planes aprobados de las materias inscritas del alumno. */
  async obtenerPlanesAlumno_ga(
    id_alumno_ga: number,
    id_periodo_ga: number,
  ) {
    // Obtener las materias inscritas del alumno en el período
    const inscripciones_ga =
      await this.prisma_ga.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_usuario_im_cjgp: id_alumno_ga,
          id_periodo_im_cjgp: id_periodo_ga,
          estatus_cjgp: 'INSCRITO',
        },
        select: { id_materia_im_cjgp: true },
      });

    const idsMateria_ga = inscripciones_ga.map(
      (i_ga) => i_ga.id_materia_im_cjgp,
    );

    return this.prisma_ga.td_plan_estudio_ga.findMany({
      where: {
        id_materia_ga: { in: idsMateria_ga },
        id_periodo_ga,
        estado_ga: 'APROBADO',
      },
      include: this.includeCompleto_ga,
      orderBy: { materia_ga: { codigo_cjgp: 'asc' } },
    });
  }

  // ─── Reporte con tabla temporal ─────────────────────────────

  /**
   * Reporte de cumplimiento de planificación por período.
   * Usa una TABLA TEMPORAL de PostgreSQL (ON COMMIT DROP).
   */
  async reporteCumplimiento_ga(id_periodo_ga: number) {
    const periodo_ga =
      await this.prisma_ga.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: id_periodo_ga },
      });
    if (!periodo_ga) {
      throw new NotFoundException('Período no encontrado.');
    }

    const filas_ga = await this.prisma_ga.$transaction(async (tx_ga) => {
      await tx_ga.$executeRaw`
        CREATE TEMP TABLE tmp_cumplimiento_ga ON COMMIT DROP AS
        SELECT
          c."id_carrera_cjgp"                                       AS id_carrera,
          c."codigo_cjgp"                                           AS codigo_carrera,
          c."nombre_cjgp"                                           AS carrera,
          COUNT(DISTINCT m."id_materia_cjgp")::int                  AS total_materias,
          COUNT(DISTINCT pe."id_plan_estudio_ga")
            FILTER (WHERE pe."estado_ga" IS NOT NULL)::int          AS con_plan,
          COUNT(DISTINCT pe."id_plan_estudio_ga")
            FILTER (WHERE pe."estado_ga" = 'APROBADO')::int         AS aprobados,
          COUNT(DISTINCT pe."id_plan_estudio_ga")
            FILTER (WHERE pe."estado_ga" = 'ENTREGADO')::int        AS entregados,
          COUNT(DISTINCT pe."id_plan_estudio_ga")
            FILTER (WHERE pe."estado_ga" = 'DEVUELTO')::int         AS devueltos,
          COUNT(DISTINCT pe."id_plan_estudio_ga")
            FILTER (WHERE pe."estado_ga" = 'BORRADOR')::int         AS borradores
        FROM "td_materia_cjgp" m
        JOIN "td_carrera_cjgp" c ON c."id_carrera_cjgp" = m."id_carrera_materia_cjgp"
        LEFT JOIN "td_plan_estudio_ga" pe
          ON pe."id_materia_ga" = m."id_materia_cjgp"
          AND pe."id_periodo_ga" = ${id_periodo_ga}
        WHERE m."id_profesor_materia_cjgp" IS NOT NULL
        GROUP BY c."id_carrera_cjgp", c."codigo_cjgp", c."nombre_cjgp"
      `;

      return tx_ga.$queryRaw<any[]>`
        SELECT *,
               CASE WHEN total_materias > 0
                    THEN ROUND(aprobados::numeric * 100 / total_materias, 1)::float
                    ELSE 0
               END AS porcentaje_aprobados,
               total_materias - con_plan AS sin_plan
        FROM tmp_cumplimiento_ga
        ORDER BY carrera
      `;
    });

    return {
      periodo: periodo_ga,
      totalCarreras: filas_ga.length,
      filas: filas_ga,
    };
  }

  // ─── Export PDF ─────────────────────────────────────────────

  /** Genera el PDF del plan aprobado con pdfmake. */
  async generarPdf_ga(id_plan_estudio_ga: number): Promise<Buffer> {
    const plan_ga = await this.obtenerPorId_ga(id_plan_estudio_ga);

    if (plan_ga.estado_ga !== 'APROBADO') {
      throw new BadRequestException(
        'Solo se pueden exportar planes en estado APROBADO.',
      );
    }

    const fonts_ga = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Italic.ttf',
        bolditalics:
          'node_modules/pdfmake/build/vfs_fonts/Roboto-MediumItalic.ttf',
      },
    };
    const printer_ga = new PdfPrinter(fonts_ga);

    // Construir contenido del PDF dinámicamente desde metadatos
    const contenidoPdf_ga: any[] = [
      {
        text: 'PLAN DE ESTUDIO',
        style: 'titulo',
        alignment: 'center',
        margin: [0, 0, 0, 5],
      },
      {
        text: `Academia H&B — ${plan_ga.periodo_ga.nombre_cjgp}`,
        alignment: 'center',
        fontSize: 11,
        color: '#555',
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          { text: `Materia: ${plan_ga.materia_ga.codigo_cjgp} — ${plan_ga.materia_ga.nombre_cjgp}`, bold: true },
          {
            text: `Profesor: ${plan_ga.profesor_ga.nombre_ahbb} ${plan_ga.profesor_ga.apellido_ahbb}`,
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 5],
      },
      {
        columns: [
          { text: `Código: ${plan_ga.codigo_ga}`, fontSize: 9, color: '#777' },
          {
            text: `Hash: ${plan_ga.hashVerificacion_ga?.substring(0, 16)}...`,
            fontSize: 9,
            color: '#777',
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 15],
      },
    ];

    // Secciones (generadas desde metadatos de la plantilla)
    for (const seccion_ga of plan_ga.plantilla_ga.secciones_ga) {
      const contenido_ga = plan_ga.contenidos_ga.find(
        (c_ga) => c_ga.id_seccion_contenido_ga === seccion_ga.id_seccion_ga,
      );
      contenidoPdf_ga.push(
        { text: seccion_ga.nombre_ga, style: 'subtitulo', margin: [0, 10, 0, 3] },
        {
          text: contenido_ga?.texto_ga || '(Sin completar)',
          margin: [0, 0, 0, 5],
          color: contenido_ga?.texto_ga ? '#333' : '#999',
        },
      );
    }

    // Cronograma (tabla de unidades)
    if (plan_ga.unidades_ga.length > 0) {
      contenidoPdf_ga.push(
        { text: 'Cronograma de Unidades', style: 'subtitulo', margin: [0, 15, 0, 5] },
      );

      const tablaUnidades_ga: any = {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: '#', bold: true, fillColor: '#1a237e', color: '#fff' },
              { text: 'Unidad', bold: true, fillColor: '#1a237e', color: '#fff' },
              { text: 'Inicio', bold: true, fillColor: '#1a237e', color: '#fff' },
              { text: 'Fin', bold: true, fillColor: '#1a237e', color: '#fff' },
              { text: 'Evaluación', bold: true, fillColor: '#1a237e', color: '#fff' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      };

      for (const unidad_ga of plan_ga.unidades_ga) {
        tablaUnidades_ga.table.body.push([
          unidad_ga.orden_ga.toString(),
          unidad_ga.nombre_ga,
          new Date(unidad_ga.fecha_inicio_ga).toLocaleDateString('es-VE'),
          new Date(unidad_ga.fecha_fin_ga).toLocaleDateString('es-VE'),
          unidad_ga.itemEvaluacion_ga?.nombre_jc ?? '—',
        ]);
      }
      contenidoPdf_ga.push(tablaUnidades_ga);

      // Indicadores por unidad
      for (const unidad_ga of plan_ga.unidades_ga) {
        if (unidad_ga.indicadores_ga.length > 0) {
          contenidoPdf_ga.push(
            {
              text: `Indicadores — ${unidad_ga.nombre_ga}`,
              style: 'subtitulo',
              fontSize: 10,
              margin: [0, 10, 0, 3],
            },
            {
              ul: unidad_ga.indicadores_ga.map((ind_ga) => {
                let texto_ga = ind_ga.descripcion_ga;
                if (ind_ga.valor_ga != null) {
                  texto_ga += ` (Valor: ${ind_ga.valor_ga})`;
                }
                if (ind_ga.nivel_ga) {
                  texto_ga += ` [${ind_ga.nivel_ga.etiqueta_ga}]`;
                }
                return texto_ga;
              }),
              margin: [10, 0, 0, 5],
            },
          );
        }
      }
    }

    const definicion_ga: TDocumentDefinitions = {
      content: contenidoPdf_ga,
      styles: {
        titulo: { fontSize: 16, bold: true, color: '#1a237e' },
        subtitulo: { fontSize: 12, bold: true, color: '#283593' },
      },
      defaultStyle: { fontSize: 10 },
      footer: (currentPage_ga: number, pageCount_ga: number) => ({
        text: `Página ${currentPage_ga} de ${pageCount_ga} — Documento generado el ${new Date().toLocaleString('es-VE')}`,
        alignment: 'center',
        fontSize: 8,
        color: '#aaa',
        margin: [0, 10, 0, 0],
      }),
    };

    const pdfDoc_ga = await printer_ga.createPdfKitDocument(definicion_ga);

    return new Promise<Buffer>((resolve_ga, reject_ga) => {
      const chunks_ga: Uint8Array[] = [];
      pdfDoc_ga.on('data', (chunk_ga: Uint8Array) =>
        chunks_ga.push(chunk_ga),
      );
      pdfDoc_ga.on('end', () => resolve_ga(Buffer.concat(chunks_ga)));
      pdfDoc_ga.on('error', reject_ga);
      pdfDoc_ga.end();
    });
  }
}
