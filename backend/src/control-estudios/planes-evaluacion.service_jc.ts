import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearPlanEvaluacionDto_jc } from './dto/crear-plan-evaluacion.dto_jc';

/**
 * PlanesEvaluacionService_jc — Esquema de Evaluación Parametrizado.
 *
 * Enfoque de Desarrollo Basado en Metadatos: el número de cortes, sus
 * nombres, sus pesos y las condiciones especiales (ej. "Reparación")
 * viven en la base de datos. El resto del módulo (carga de notas,
 * cálculo de definitivas, actas) se limita a leer esta configuración,
 * por lo que la coordinación puede agregar opciones sin tocar el código.
 */
@Injectable()
export class PlanesEvaluacionService_jc {
  constructor(private readonly prisma_jc: PrismaService) {}

  /** Los pesos de los ítems regulares (no recuperación) deben sumar 100%. */
  private validarPesos_jc(datos_jc: CrearPlanEvaluacionDto_jc) {
    const sumaPesos_jc = datos_jc.items_jc
      .filter((item_jc) => !item_jc.esRecuperacion_jc)
      .reduce((suma_jc, item_jc) => suma_jc + Number(item_jc.peso_jc), 0);

    if (Math.abs(sumaPesos_jc - 100) > 0.01) {
      throw new BadRequestException(
        `Los pesos de las evaluaciones regulares deben sumar 100% (actualmente suman ${sumaPesos_jc}%).`,
      );
    }

    if (datos_jc.notaAprobatoria_jc > datos_jc.notaMaxima_jc) {
      throw new BadRequestException(
        'La nota aprobatoria no puede ser mayor que la nota máxima de la escala.',
      );
    }

    const ordenes_jc = datos_jc.items_jc.map((item_jc) => item_jc.orden_jc);
    if (new Set(ordenes_jc).size !== ordenes_jc.length) {
      throw new BadRequestException(
        'Cada evaluación debe tener un número de orden distinto.',
      );
    }
  }

  async obtenerTodos_jc() {
    return this.prisma_jc.td_plan_evaluacion_jc.findMany({
      include: {
        items_jc: { orderBy: { orden_jc: 'asc' } },
        periodo_jc: true,
        carrera_jc: true,
      },
      orderBy: { creadoEn_jc: 'desc' },
    });
  }

  async obtenerPorId_jc(id_plan_jc: number) {
    const plan_jc = await this.prisma_jc.td_plan_evaluacion_jc.findUnique({
      where: { id_plan_jc },
      include: {
        items_jc: { orderBy: { orden_jc: 'asc' } },
        periodo_jc: true,
        carrera_jc: true,
      },
    });
    if (!plan_jc) {
      throw new NotFoundException('Plan de evaluación no encontrado.');
    }
    return plan_jc;
  }

  /**
   * Resuelve el plan PUBLICADO que rige a una materia en un período:
   * primero busca un plan específico de la carrera de la materia y,
   * si no existe, cae al plan institucional (sin carrera) del período.
   */
  async resolverPlanVigente_jc(id_materia_jc: number, id_periodo_jc: number) {
    const materia_jc = await this.prisma_jc.td_materia_cjgp.findUnique({
      where: { id_materia_cjgp: id_materia_jc },
    });
    if (!materia_jc) {
      throw new NotFoundException('Materia no encontrada.');
    }

    const planCarrera_jc = await this.prisma_jc.td_plan_evaluacion_jc.findFirst({
      where: {
        id_periodo_plan_jc: id_periodo_jc,
        id_carrera_plan_jc: materia_jc.id_carrera_materia_cjgp,
        estado_jc: 'PUBLICADO',
      },
      include: { items_jc: { orderBy: { orden_jc: 'asc' } } },
    });
    if (planCarrera_jc) {
      return planCarrera_jc;
    }

    const planInstitucional_jc =
      await this.prisma_jc.td_plan_evaluacion_jc.findFirst({
        where: {
          id_periodo_plan_jc: id_periodo_jc,
          id_carrera_plan_jc: null,
          estado_jc: 'PUBLICADO',
        },
        include: { items_jc: { orderBy: { orden_jc: 'asc' } } },
      });

    if (!planInstitucional_jc) {
      throw new BadRequestException(
        'No hay un plan de evaluación PUBLICADO para este período. La coordinación debe configurarlo primero.',
      );
    }
    return planInstitucional_jc;
  }

  /** Crea el plan con sus ítems en una transacción (queda en BORRADOR). */
  async crear_jc(datos_jc: CrearPlanEvaluacionDto_jc) {
    this.validarPesos_jc(datos_jc);

    const duplicado_jc = await this.prisma_jc.td_plan_evaluacion_jc.findFirst({
      where: {
        id_periodo_plan_jc: datos_jc.id_periodo_jc,
        id_carrera_plan_jc: datos_jc.id_carrera_jc ?? null,
      },
    });
    if (duplicado_jc) {
      throw new BadRequestException(
        'Ya existe un plan de evaluación para ese período y alcance. Edita el existente para mantener la uniformidad de las actas.',
      );
    }

    const plan_jc = await this.prisma_jc.td_plan_evaluacion_jc.create({
      data: {
        nombre_jc: datos_jc.nombre_jc.trim(),
        id_periodo_plan_jc: datos_jc.id_periodo_jc,
        id_carrera_plan_jc: datos_jc.id_carrera_jc ?? null,
        notaMaxima_jc: datos_jc.notaMaxima_jc,
        notaAprobatoria_jc: datos_jc.notaAprobatoria_jc,
        items_jc: {
          create: datos_jc.items_jc.map((item_jc) => ({
            nombre_jc: item_jc.nombre_jc.trim(),
            orden_jc: item_jc.orden_jc,
            peso_jc: item_jc.peso_jc,
            esRecuperacion_jc: item_jc.esRecuperacion_jc ?? false,
          })),
        },
      },
      include: { items_jc: { orderBy: { orden_jc: 'asc' } } },
    });

    return {
      exito: true,
      plan: plan_jc,
      mensaje: `Plan "${plan_jc.nombre_jc}" creado con ${plan_jc.items_jc.length} evaluaciones.`,
    };
  }

  /**
   * Reemplaza la configuración de un plan (solo en BORRADOR, o publicado
   * sin notas cargadas: cambiar reglas con notas registradas rompería actas).
   */
  async actualizar_jc(id_plan_jc: number, datos_jc: CrearPlanEvaluacionDto_jc) {
    this.validarPesos_jc(datos_jc);
    const plan_jc = await this.obtenerPorId_jc(id_plan_jc);

    const notasCargadas_jc = await this.prisma_jc.td_calificacion_jc.count({
      where: { item_jc: { id_plan_item_jc: id_plan_jc } },
    });
    if (notasCargadas_jc > 0) {
      throw new BadRequestException(
        'Este plan ya tiene notas cargadas: modificar su estructura invalidaría las actas. Crea un plan para el siguiente período.',
      );
    }

    const actualizado_jc = await this.prisma_jc.$transaction(async (tx_jc) => {
      await tx_jc.td_item_evaluacion_jc.deleteMany({
        where: { id_plan_item_jc: id_plan_jc },
      });
      return tx_jc.td_plan_evaluacion_jc.update({
        where: { id_plan_jc },
        data: {
          nombre_jc: datos_jc.nombre_jc.trim(),
          notaMaxima_jc: datos_jc.notaMaxima_jc,
          notaAprobatoria_jc: datos_jc.notaAprobatoria_jc,
          actualizadoEn_jc: new Date(),
          items_jc: {
            create: datos_jc.items_jc.map((item_jc) => ({
              nombre_jc: item_jc.nombre_jc.trim(),
              orden_jc: item_jc.orden_jc,
              peso_jc: item_jc.peso_jc,
              esRecuperacion_jc: item_jc.esRecuperacion_jc ?? false,
            })),
          },
        },
        include: { items_jc: { orderBy: { orden_jc: 'asc' } } },
      });
    });

    return {
      exito: true,
      plan: actualizado_jc,
      mensaje: `Plan "${plan_jc.nombre_jc}" actualizado.`,
    };
  }

  /** Publica el plan: desde ese momento rige la carga de notas del período. */
  async publicar_jc(id_plan_jc: number) {
    const plan_jc = await this.obtenerPorId_jc(id_plan_jc);
    if (plan_jc.estado_jc === 'PUBLICADO') {
      throw new BadRequestException('El plan ya está publicado.');
    }

    await this.prisma_jc.td_plan_evaluacion_jc.update({
      where: { id_plan_jc },
      data: { estado_jc: 'PUBLICADO', actualizadoEn_jc: new Date() },
    });

    return {
      exito: true,
      mensaje: `Plan "${plan_jc.nombre_jc}" publicado: ya rige la carga de notas.`,
    };
  }

  async eliminar_jc(id_plan_jc: number) {
    await this.obtenerPorId_jc(id_plan_jc);

    const notasCargadas_jc = await this.prisma_jc.td_calificacion_jc.count({
      where: { item_jc: { id_plan_item_jc: id_plan_jc } },
    });
    if (notasCargadas_jc > 0) {
      throw new BadRequestException(
        'No se puede eliminar un plan con notas cargadas.',
      );
    }

    await this.prisma_jc.td_plan_evaluacion_jc.delete({ where: { id_plan_jc } });
    return { exito: true, mensaje: 'Plan de evaluación eliminado.' };
  }

  /**
   * Metadatos del módulo: consulta information_schema para exponer la
   * estructura real de las tablas académicas. Demuestra que la interfaz
   * se puede construir a partir del diccionario de datos de PostgreSQL.
   */
  async obtenerMetadatos_jc() {
    const columnas_jc = await this.prisma_jc.$queryRaw<any[]>`
      SELECT table_name   AS tabla,
             column_name  AS columna,
             data_type    AS tipo,
             is_nullable  AS admite_nulos,
             ordinal_position AS posicion
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name LIKE '%\\_jc' OR table_name LIKE '%\\_cjgp')
      ORDER BY table_name, ordinal_position
    `;

    // Agrupar por tabla para que el frontend lo muestre como diccionario de datos
    const porTabla_jc: Record<string, any[]> = {};
    for (const columna_jc of columnas_jc) {
      const tabla_jc = String(columna_jc.tabla);
      porTabla_jc[tabla_jc] = porTabla_jc[tabla_jc] ?? [];
      porTabla_jc[tabla_jc].push({
        columna: columna_jc.columna,
        tipo: columna_jc.tipo,
        admiteNulos: columna_jc.admite_nulos === 'YES',
        posicion: Number(columna_jc.posicion),
      });
    }

    return { totalTablas: Object.keys(porTabla_jc).length, tablas: porTabla_jc };
  }
}
