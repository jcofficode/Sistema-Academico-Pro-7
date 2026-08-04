// ══════════════════════════════════════════════════════════════
// configuracion-curricular.service_ga.ts
// Servicio de Configuración Curricular Global (_ga)
//
// SOLID: Single Responsibility — solo gestiona td_configuraciones_periodo_ga.
//        Open/Closed — extensible sin tocar la interfaz del controlador.
//        Dependency Inversion — depende del PrismaService inyectado.
// ══════════════════════════════════════════════════════════════

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ActualizarConfiguracionDto_ga } from './dto/actualizar-configuracion.dto_ga';

/**
 * ConfiguracionCurricularService_ga
 *
 * Gestiona la lectura y escritura de la configuración global de planificación
 * para cada período académico. Estos parámetros rigen el comportamiento de
 * todo el módulo _ga:
 *   - Formato de evaluación (CUANTITATIVO | CUALITATIVO)
 *   - Lapsos totales (2, inamovible — PO)
 *   - Máx. actividades de evaluación por lapso (4, inamovible — PO)
 */
@Injectable()
export class ConfiguracionCurricularService_ga {
  // Logger dedicado al servicio para trazabilidad en producción
  private readonly logger_ga = new Logger(ConfiguracionCurricularService_ga.name);

  constructor(private readonly prisma_ga: PrismaService) {}

  // ────────────────────────────────────────────────────────────
  // MÉTODO: obtenerPorPeriodo_ga
  // Por qué: el administrador necesita leer la config vigente antes
  //          de editarla; si no existe, se auto-crea con valores por defecto
  //          para no bloquear el flujo.
  // ────────────────────────────────────────────────────────────
  async obtenerPorPeriodo_ga(idPeriodo_ga: number) {
    this.logger_ga.log(`[obtenerPorPeriodo_ga] Buscando config del período ${idPeriodo_ga}...`);

    // Verificar que el período exista antes de devolver config
    const periodo_ga = await this.prisma_ga.td_periodo_academico_cjgp.findUnique({
      where: { id_periodo_cjgp: idPeriodo_ga },
      select: {
        id_periodo_cjgp: true,
        nombre_cjgp: true,
        activo_cjgp: true,
        fechaInicio_cjgp: true,
        fechaFin_cjgp: true,
      },
    });

    if (!periodo_ga) {
      throw new NotFoundException(`Período académico con id ${idPeriodo_ga} no encontrado.`);
    }

    // Buscar configuración existente para este período
    let config_ga = await this.prisma_ga.td_configuraciones_periodo_ga.findUnique({
      where: { id_periodo_ga: idPeriodo_ga },
    });

    // Auto-crear con valores por defecto del PO si no existe
    if (!config_ga) {
      this.logger_ga.warn(`[obtenerPorPeriodo_ga] Config no encontrada. Creando por defecto para período ${idPeriodo_ga}.`);
      config_ga = await this.prisma_ga.td_configuraciones_periodo_ga.create({
        data: {
          id_periodo_ga: idPeriodo_ga,
          formato_evaluacion_ga: 'CUANTITATIVO',
          max_evaluaciones_lapso_ga: 4,
          lapsos_totales_ga: 2,
        },
      });
    }

    console.log('[_ga] Config curricular obtenida:', JSON.stringify(config_ga, null, 2));

    // Retornar config enriquecida con datos del período para el frontend
    return {
      configuracion_ga: config_ga,
      periodo_ga,
    };
  }

  // ────────────────────────────────────────────────────────────
  // MÉTODO: listarPeriodosConConfig_ga
  // Por qué: el admin necesita el selector de períodos para elegir cuál
  //          configurar; este método devuelve todos los períodos con su
  //          configuración actual (o null si aún no tiene).
  // ────────────────────────────────────────────────────────────
  async listarPeriodosConConfig_ga() {
    this.logger_ga.log('[listarPeriodosConConfig_ga] Listando todos los períodos con su configuración...');

    const periodos_ga = await this.prisma_ga.td_periodo_academico_cjgp.findMany({
      orderBy: { id_periodo_cjgp: 'desc' },
      select: {
        id_periodo_cjgp: true,
        nombre_cjgp: true,
        activo_cjgp: true,
        fechaInicio_cjgp: true,
        fechaFin_cjgp: true,
        // Incluir config _ga si existe
        configuracionesPeriodo_ga: {
          select: {
            id_configuracion_periodo_ga: true,
            formato_evaluacion_ga: true,
            max_evaluaciones_lapso_ga: true,
            lapsos_totales_ga: true,
            creadoEn_ga: true,
            actualizadoEn_ga: true,
          },
        },
      },
    });

    console.log(`[_ga] Total períodos listados: ${periodos_ga.length}`);
    return periodos_ga;
  }

  // ────────────────────────────────────────────────────────────
  // MÉTODO: actualizarConfiguracion_ga
  // Por qué: es la única operación de escritura del administrador en este
  //          módulo. Se usa upsert para idempotencia: crear o actualizar
  //          según exista o no la configuración para el período dado.
  //          Las restricciones (lapsos=2, max=4) se fuerzan en capa de servicio.
  // ────────────────────────────────────────────────────────────
  async actualizarConfiguracion_ga(
    idPeriodo_ga: number,
    dto_ga: ActualizarConfiguracionDto_ga,
  ) {
    this.logger_ga.log(`[actualizarConfiguracion_ga] Actualizando período ${idPeriodo_ga} → formato: ${dto_ga.formato_evaluacion_ga}`);

    // Verificar que el período exista (Fail-Fast)
    const periodo_ga = await this.prisma_ga.td_periodo_academico_cjgp.findUnique({
      where: { id_periodo_cjgp: idPeriodo_ga },
    });

    if (!periodo_ga) {
      throw new NotFoundException(`Período académico con id ${idPeriodo_ga} no encontrado.`);
    }

    // Verificar formato válido (doble validación: DTO + servicio)
    const formatosValidos_ga: string[] = ['CUANTITATIVO', 'CUALITATIVO'];
    if (!formatosValidos_ga.includes(dto_ga.formato_evaluacion_ga)) {
      throw new BadRequestException(
        `Formato "${dto_ga.formato_evaluacion_ga}" no válido. Use CUANTITATIVO o CUALITATIVO.`,
      );
    }

    // INAMOVIBLE PO: lapsos=2, max_evaluaciones=4 siempre, sin importar el DTO
    const configGuardada_ga = await this.prisma_ga.td_configuraciones_periodo_ga.upsert({
      where: { id_periodo_ga: idPeriodo_ga },
      update: {
        formato_evaluacion_ga: dto_ga.formato_evaluacion_ga,
        // Los campos inamovibles no se tocan desde el DTO
        lapsos_totales_ga: 2,
        max_evaluaciones_lapso_ga: 4,
        actualizadoEn_ga: new Date(),
      },
      create: {
        id_periodo_ga: idPeriodo_ga,
        formato_evaluacion_ga: dto_ga.formato_evaluacion_ga,
        lapsos_totales_ga: 2,
        max_evaluaciones_lapso_ga: 4,
      },
    });

    console.log('[_ga] Configuración curricular guardada:', JSON.stringify(configGuardada_ga, null, 2));

    return {
      mensaje_ga: `Configuración curricular del período "${periodo_ga.nombre_cjgp}" actualizada correctamente.`,
      configuracion_ga: configGuardada_ga,
    };
  }
}
