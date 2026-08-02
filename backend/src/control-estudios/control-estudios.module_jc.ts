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
import { ReparacionesController_jc } from './reparaciones.controller_jc';
import { ReparacionesService_jc } from './reparaciones.service_jc';
import { CertificadosSobresalienteController_jc } from './certificados-sobresaliente.controller_jc';
import { CertificadosSobresalienteService_jc } from './certificados-sobresaliente.service_jc';
import { NotificacionesController_jc } from './notificaciones.controller_jc';
import { NotificacionesService_jc } from './notificaciones.service_jc';

/**
 * ControlEstudiosModule_jc — Módulo individual de Control de Estudios.
 *
 * Submódulo: Gestión de Notas y Actas.
 *  - Esquema de evaluación parametrizado (metadatos en BD).
 *  - Carga de notas con matriz dinámica y reparaciones por corte.
 *  - Motor de carga masiva ETL/CSV con validación en dos fases.
 *  - Generación del acta oficial en PDF con hash de verificación.
 *  - Certificados de Sobresaliente con notificación al alumno.
 *  - Reportes con tablas temporales de PostgreSQL.
 *
 * La bitácora de auditoría (`AuditoriaModule_jc`) y el servicio de túnel
 * (`TunnelModule_ahbb`) son globales, por lo que se inyectan aquí sin
 * necesidad de importarlos explícitamente.
 */
@Module({
  controllers: [
    PlanesEvaluacionController_jc,
    CalificacionesController_jc,
    ReparacionesController_jc,
    ActasController_jc,
    CargaMasivaController_jc,
    CertificadosSobresalienteController_jc,
    NotificacionesController_jc,
  ],
  providers: [
    PrismaService,
    PlanesEvaluacionService_jc,
    CalificacionesService_jc,
    ReparacionesService_jc,
    ActasService_jc,
    EtlCsvService_jc,
    CertificadosSobresalienteService_jc,
    NotificacionesService_jc,
  ],
})
export class ControlEstudiosModule_jc {}
