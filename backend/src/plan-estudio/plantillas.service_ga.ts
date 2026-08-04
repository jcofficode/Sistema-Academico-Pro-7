import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * PlantillasService_ga — Configuración Curricular del Período Académico (_ga)
 */
@Injectable()
export class PlantillasService_ga {
  constructor(private readonly prisma_ga: PrismaService) {}

  /**
   * Obtiene la configuración del período académico
   */
  async obtenerVigente_ga(id_periodo_ga: number) {
    let config_ga = await this.prisma_ga.td_configuraciones_periodo_ga.findUnique({
      where: { id_periodo_ga: Number(id_periodo_ga) },
    });

    if (!config_ga) {
      // Configuración predeterminada si no existe aún para el período
      config_ga = await this.prisma_ga.td_configuraciones_periodo_ga.create({
        data: {
          id_periodo_ga: Number(id_periodo_ga),
          formato_evaluacion_ga: 'CUANTITATIVO',
          max_evaluaciones_lapso_ga: 4,
          lapsos_totales_ga: 2,
        },
      });
    }

    return config_ga;
  }

  /**
   * Actualiza la configuración curricular del período
   */
  async actualizarConfiguracion_ga(
    id_periodo_ga: number,
    formato_evaluacion_ga: 'CUANTITATIVO' | 'CUALITATIVO',
  ) {
    return this.prisma_ga.td_configuraciones_periodo_ga.upsert({
      where: { id_periodo_ga: Number(id_periodo_ga) },
      update: {
        formato_evaluacion_ga,
        actualizadoEn_ga: new Date(),
      },
      create: {
        id_periodo_ga: Number(id_periodo_ga),
        formato_evaluacion_ga,
        max_evaluaciones_lapso_ga: 4,
        lapsos_totales_ga: 2,
      },
    });
  }
}
