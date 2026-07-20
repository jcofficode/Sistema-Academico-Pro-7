import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TarifasController_ap } from './tarifas.controller_ap';
import { TarifasService_ap } from './tarifas.service_ap';
import { PagosController_ap } from './pagos.controller_ap';
import { PagosService_ap } from './pagos.service_ap';
import { RecibosService_ap } from './recibos.service_ap';
import { ContratosController_ap } from './contratos.controller_ap';
import { ContratosService_ap } from './contratos.service_ap';
import { NominaController_ap } from './nomina.controller_ap';
import { NominaService_ap } from './nomina.service_ap';

/**
 * PagosModule_ap — Módulo individual del Sistema de Pagos.
 *
 * Épica A: Pago del estudiante (período académico y cursos extracurriculares).
 * Épica B: Registro y nómina de profesores (FIJO / POR_HORA).
 *
 * Exporta PagosService_ap para que sea consumido por:
 *  - AcademicoModule_cjgp (verifica solvencia antes de inscribir materias)
 *  - InscripcionesModule_ahbb (verifica pago antes de inscribir curso)
 */
@Module({
  controllers: [
    TarifasController_ap,
    PagosController_ap,
    ContratosController_ap,
    NominaController_ap,
  ],
  providers: [
    PrismaService,
    TarifasService_ap,
    PagosService_ap,
    RecibosService_ap,
    ContratosService_ap,
    NominaService_ap,
  ],
  exports: [PagosService_ap],
})
export class PagosModule_ap {}
