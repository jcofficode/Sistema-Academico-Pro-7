import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CarrerasController_cjgp } from './carreras.controller_cjgp';
import { CarrerasService_cjgp } from './carreras.service_cjgp';
import { PeriodosController_cjgp } from './periodos.controller_cjgp';
import { PeriodosService_cjgp } from './periodos.service_cjgp';
import { MotorReglasService_cjgp } from './motor-reglas.service_cjgp';
import { InscripcionMateriasController_cjgp } from './inscripcion-materias.controller_cjgp';
import { InscripcionMateriasService_cjgp } from './inscripcion-materias.service_cjgp';

/**
 * AcademicoModule_cjgp — Trabajo grupal (Coffi, Jorge, Guillermo, Padrino).
 *
 * Épica 1: Creación ágil de carreras y pensums (asistente + Excel + prelaciones).
 * Épica 2: Motor de Reglas Académicas ("El Guardián").
 * Épica 3: Inscripción sin fricción para el estudiante (vitrina + auditoría).
 */
@Module({
  controllers: [
    CarrerasController_cjgp,
    PeriodosController_cjgp,
    InscripcionMateriasController_cjgp,
  ],
  providers: [
    PrismaService,
    CarrerasService_cjgp,
    PeriodosService_cjgp,
    MotorReglasService_cjgp,
    InscripcionMateriasService_cjgp,
  ],
  exports: [MotorReglasService_cjgp],
})
export class AcademicoModule_cjgp {}
