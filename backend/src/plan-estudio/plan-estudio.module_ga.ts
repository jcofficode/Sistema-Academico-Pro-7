import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlantillasController_ga } from './plantillas.controller_ga';
import { PlantillasService_ga } from './plantillas.service_ga';
import { PlanesEstudioController_ga } from './planes-estudio.controller_ga';
import { PlanesEstudioService_ga } from './planes-estudio.service_ga';
import { ConfiguracionCurricularController_ga } from './configuracion-curricular.controller_ga';
import { ConfiguracionCurricularService_ga } from './configuracion-curricular.service_ga';

/**
 * PlanEstudioModule_ga — Módulo de Planificación Académica.
 *
 * Expone tres sub-módulos funcionales:
 *   1. ConfiguracionCurricular_ga — configuración global del período (Admin).
 *   2. Plantillas_ga              — configuración heredada / periodo (retrocompat).
 *   3. PlanesEstudio_ga           — elaboración del cronograma por el docente.
 */
@Module({
  controllers: [
    ConfiguracionCurricularController_ga,
    PlantillasController_ga,
    PlanesEstudioController_ga,
  ],
  providers: [
    PrismaService,
    ConfiguracionCurricularService_ga,
    PlantillasService_ga,
    PlanesEstudioService_ga,
  ],
  exports: [ConfiguracionCurricularService_ga],
})
export class PlanEstudioModule_ga {}

