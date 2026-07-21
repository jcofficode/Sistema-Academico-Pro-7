import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearPlantillaDto_ga } from './dto/crear-plantilla.dto_ga';

/**
 * PlantillasService_ga — Configuración del Formato de Planificación.
 *
 * Enfoque de Desarrollo Basado en Metadatos (idéntico a planes-evaluacion _jc):
 * la coordinación define cuántas secciones lleva el plan, qué tipo de valoración
 * se usa (cuantitativa o cualitativa), y cuáles son los niveles. El resto del
 * módulo lee esta configuración y genera la interfaz dinámicamente.
 */
@Injectable()
export class PlantillasService_ga {
  constructor(private readonly prisma_ga: PrismaService) {}

  /** Valida coherencia interna de la plantilla. */
  private validarPlantilla_ga(datos_ga: CrearPlantillaDto_ga) {
    // Órdenes de secciones no repetidos
    const ordenes_ga = datos_ga.secciones_ga.map((s_ga) => s_ga.orden_ga);
    if (new Set(ordenes_ga).size !== ordenes_ga.length) {
      throw new BadRequestException(
        'Cada sección debe tener un número de orden distinto.',
      );
    }

    // Validaciones según tipo de valoración
    if (datos_ga.tipo_valoracion_ga === 'CUANTITATIVO') {
      if (
        datos_ga.escala_min_ga == null ||
        datos_ga.escala_max_ga == null
      ) {
        throw new BadRequestException(
          'Para valoración cuantitativa debes definir la escala mínima y máxima.',
        );
      }
      if (datos_ga.escala_min_ga >= datos_ga.escala_max_ga) {
        throw new BadRequestException(
          'La escala mínima debe ser menor que la máxima.',
        );
      }
    }

    if (datos_ga.tipo_valoracion_ga === 'CUALITATIVO') {
      if (!datos_ga.niveles_ga || datos_ga.niveles_ga.length === 0) {
        throw new BadRequestException(
          'Para valoración cualitativa debes definir al menos un nivel (ej. Iniciado, En Proceso, Consolidado).',
        );
      }
      const ordenesNiveles_ga = datos_ga.niveles_ga.map((n_ga) => n_ga.orden_ga);
      if (new Set(ordenesNiveles_ga).size !== ordenesNiveles_ga.length) {
        throw new BadRequestException(
          'Cada nivel cualitativo debe tener un número de orden distinto.',
        );
      }
    }
  }

  async obtenerTodas_ga() {
    return this.prisma_ga.td_plantilla_plan_ga.findMany({
      include: {
        secciones_ga: { orderBy: { orden_ga: 'asc' } },
        niveles_ga: { orderBy: { orden_ga: 'asc' } },
        periodo_ga: true,
      },
      orderBy: { creadoEn_ga: 'desc' },
    });
  }

  async obtenerPorId_ga(id_plantilla_ga: number) {
    const plantilla_ga =
      await this.prisma_ga.td_plantilla_plan_ga.findUnique({
        where: { id_plantilla_ga },
        include: {
          secciones_ga: { orderBy: { orden_ga: 'asc' } },
          niveles_ga: { orderBy: { orden_ga: 'asc' } },
          periodo_ga: true,
        },
      });
    if (!plantilla_ga) {
      throw new NotFoundException('Plantilla de planificación no encontrada.');
    }
    return plantilla_ga;
  }

  /**
   * Resuelve la plantilla PUBLICADA que rige un período.
   * Una sola plantilla por período (@@unique en schema).
   */
  async obtenerVigente_ga(id_periodo_ga: number) {
    const plantilla_ga =
      await this.prisma_ga.td_plantilla_plan_ga.findFirst({
        where: {
          id_periodo_ga,
          estado_ga: 'PUBLICADA',
        },
        include: {
          secciones_ga: { orderBy: { orden_ga: 'asc' } },
          niveles_ga: { orderBy: { orden_ga: 'asc' } },
          periodo_ga: true,
        },
      });

    if (!plantilla_ga) {
      throw new BadRequestException(
        'No hay una plantilla de planificación PUBLICADA para este período. La coordinación debe configurarla primero.',
      );
    }
    return plantilla_ga;
  }

  /** Crea la plantilla con secciones y niveles en una transacción. */
  async crear_ga(datos_ga: CrearPlantillaDto_ga) {
    this.validarPlantilla_ga(datos_ga);

    const duplicado_ga =
      await this.prisma_ga.td_plantilla_plan_ga.findFirst({
        where: { id_periodo_ga: datos_ga.id_periodo_ga },
      });
    if (duplicado_ga) {
      throw new BadRequestException(
        'Ya existe una plantilla para ese período. Edita la existente.',
      );
    }

    const plantilla_ga = await this.prisma_ga.td_plantilla_plan_ga.create({
      data: {
        nombre_ga: datos_ga.nombre_ga.trim(),
        id_periodo_ga: datos_ga.id_periodo_ga,
        tipo_valoracion_ga: datos_ga.tipo_valoracion_ga,
        escala_min_ga: datos_ga.escala_min_ga ?? null,
        escala_max_ga: datos_ga.escala_max_ga ?? null,
        ponderado_ga: datos_ga.ponderado_ga ?? false,
        secciones_ga: {
          create: datos_ga.secciones_ga.map((seccion_ga) => ({
            nombre_ga: seccion_ga.nombre_ga.trim(),
            orden_ga: seccion_ga.orden_ga,
            obligatoria_ga: seccion_ga.obligatoria_ga ?? true,
            tipo_contenido_ga: seccion_ga.tipo_contenido_ga,
          })),
        },
        ...(datos_ga.tipo_valoracion_ga === 'CUALITATIVO' &&
        datos_ga.niveles_ga
          ? {
              niveles_ga: {
                create: datos_ga.niveles_ga.map((nivel_ga) => ({
                  etiqueta_ga: nivel_ga.etiqueta_ga.trim(),
                  descripcion_ga: nivel_ga.descripcion_ga?.trim() ?? null,
                  orden_ga: nivel_ga.orden_ga,
                })),
              },
            }
          : {}),
      },
      include: {
        secciones_ga: { orderBy: { orden_ga: 'asc' } },
        niveles_ga: { orderBy: { orden_ga: 'asc' } },
      },
    });

    return {
      exito: true,
      plantilla: plantilla_ga,
      mensaje: `Plantilla "${plantilla_ga.nombre_ga}" creada con ${plantilla_ga.secciones_ga.length} secciones.`,
    };
  }

  /** Actualiza una plantilla (solo BORRADOR sin planes asociados). */
  async actualizar_ga(
    id_plantilla_ga: number,
    datos_ga: CrearPlantillaDto_ga,
  ) {
    this.validarPlantilla_ga(datos_ga);
    const plantilla_ga = await this.obtenerPorId_ga(id_plantilla_ga);

    const planesAsociados_ga = await this.prisma_ga.td_plan_estudio_ga.count({
      where: { id_plantilla_ga },
    });
    if (planesAsociados_ga > 0) {
      throw new BadRequestException(
        'Esta plantilla ya tiene planes de estudio asociados: modificar su estructura los invalidaría.',
      );
    }

    const actualizada_ga = await this.prisma_ga.$transaction(
      async (tx_ga) => {
        await tx_ga.td_seccion_plantilla_ga.deleteMany({
          where: { id_plantilla_seccion_ga: id_plantilla_ga },
        });
        await tx_ga.td_nivel_cualitativo_ga.deleteMany({
          where: { id_plantilla_nivel_ga: id_plantilla_ga },
        });
        return tx_ga.td_plantilla_plan_ga.update({
          where: { id_plantilla_ga },
          data: {
            nombre_ga: datos_ga.nombre_ga.trim(),
            tipo_valoracion_ga: datos_ga.tipo_valoracion_ga,
            escala_min_ga: datos_ga.escala_min_ga ?? null,
            escala_max_ga: datos_ga.escala_max_ga ?? null,
            ponderado_ga: datos_ga.ponderado_ga ?? false,
            actualizadoEn_ga: new Date(),
            secciones_ga: {
              create: datos_ga.secciones_ga.map((seccion_ga) => ({
                nombre_ga: seccion_ga.nombre_ga.trim(),
                orden_ga: seccion_ga.orden_ga,
                obligatoria_ga: seccion_ga.obligatoria_ga ?? true,
                tipo_contenido_ga: seccion_ga.tipo_contenido_ga,
              })),
            },
            ...(datos_ga.tipo_valoracion_ga === 'CUALITATIVO' &&
            datos_ga.niveles_ga
              ? {
                  niveles_ga: {
                    create: datos_ga.niveles_ga.map((nivel_ga) => ({
                      etiqueta_ga: nivel_ga.etiqueta_ga.trim(),
                      descripcion_ga:
                        nivel_ga.descripcion_ga?.trim() ?? null,
                      orden_ga: nivel_ga.orden_ga,
                    })),
                  },
                }
              : {}),
          },
          include: {
            secciones_ga: { orderBy: { orden_ga: 'asc' } },
            niveles_ga: { orderBy: { orden_ga: 'asc' } },
          },
        });
      },
    );

    return {
      exito: true,
      plantilla: actualizada_ga,
      mensaje: `Plantilla "${plantilla_ga.nombre_ga}" actualizada.`,
    };
  }

  /** Publica la plantilla: desde ese momento rige la planificación del período. */
  async publicar_ga(id_plantilla_ga: number) {
    const plantilla_ga = await this.obtenerPorId_ga(id_plantilla_ga);
    if (plantilla_ga.estado_ga === 'PUBLICADA') {
      throw new BadRequestException('La plantilla ya está publicada.');
    }

    await this.prisma_ga.td_plantilla_plan_ga.update({
      where: { id_plantilla_ga },
      data: { estado_ga: 'PUBLICADA', actualizadoEn_ga: new Date() },
    });

    return {
      exito: true,
      mensaje: `Plantilla "${plantilla_ga.nombre_ga}" publicada: los profesores ya pueden elaborar sus planes.`,
    };
  }

  async eliminar_ga(id_plantilla_ga: number) {
    await this.obtenerPorId_ga(id_plantilla_ga);

    const planesAsociados_ga = await this.prisma_ga.td_plan_estudio_ga.count({
      where: { id_plantilla_ga },
    });
    if (planesAsociados_ga > 0) {
      throw new BadRequestException(
        'No se puede eliminar una plantilla con planes de estudio asociados.',
      );
    }

    await this.prisma_ga.td_plantilla_plan_ga.delete({
      where: { id_plantilla_ga },
    });
    return { exito: true, mensaje: 'Plantilla de planificación eliminada.' };
  }
}
