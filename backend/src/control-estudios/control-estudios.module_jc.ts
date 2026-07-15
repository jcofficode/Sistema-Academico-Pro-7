import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanesEvaluacionController_jc } from './planes-evaluacion.controller_jc';
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { CalificacionesController_jc } from './calificaciones.controller_jc';
import { CalificacionesService_jc } from './calificaciones.service_jc';
import { ActasController_jc } from './actas.controller_jc';
import { ActasService_jc } from './actas.service_jc';
import { CargaMasivaController_jc } from './carga-masiva.controller_jc';
import { EtlCsvService_jc } from './etl-csv.service_jc';

/**
 * ControlEstudiosModule_jc — Módulo individual de Control de Estudios.
 *
 * Submódulo: Gestión de Notas y Actas.
 *  - Esquema de evaluación parametrizado (metadatos en BD).
 *  - Carga de notas con matriz dinámica para el docente.
 *  - Motor de carga masiva ETL/CSV con validación en dos fases.
 *  - Generación de actas PDF (blanca de auditoría y verde de seguridad).
 *  - Reportes con tablas temporales de PostgreSQL.
 */
@Module({
  controllers: [
    PlanesEvaluacionController_jc,
    CalificacionesController_jc,
    ActasController_jc,
    CargaMasivaController_jc,
  ],
  providers: [
    PrismaService,
    PlanesEvaluacionService_jc,
    CalificacionesService_jc,
    ActasService_jc,
    EtlCsvService_jc,
  ],
})
export class ControlEstudiosModule_jc {}
