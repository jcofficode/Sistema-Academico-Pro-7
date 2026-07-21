import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlantillasController_ga } from './plantillas.controller_ga';
import { PlantillasService_ga } from './plantillas.service_ga';
import { PlanesEstudioController_ga } from './planes-estudio.controller_ga';
import { PlanesEstudioService_ga } from './planes-estudio.service_ga';

/**
 * PlanEstudioModule_ga — Módulo de Planificación Académica.
 *
 * Permite a la coordinación configurar el formato de planificación y a los
 * profesores elaborar sus planes dentro de ese formato (Desarrollo Basado
 * en Metadatos).
 */
@Module({
  controllers: [PlantillasController_ga, PlanesEstudioController_ga],
  providers: [PrismaService, PlantillasService_ga, PlanesEstudioService_ga],
})
export class PlanEstudioModule_ga {}
