import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { AuditoriaService_jc } from './auditoria.service_jc';
import { AuditoriaController_jc } from './auditoria.controller_jc';
import { AuditoriaInterceptor_jc } from './auditoria.interceptor_jc';

/**
 * AuditoriaModule_jc — Bitácora transversal del sistema.
 *
 * Se declara `@Global` porque cualquier módulo de negocio puede necesitar
 * enriquecer la bitácora con su propio contexto (Control de Estudios lo hace
 * en cada carga de notas y en cada acta). El interceptor se registra con
 * `APP_INTERCEPTOR`, de modo que se aplica a toda la aplicación sin que cada
 * controlador tenga que declararlo.
 */
@Global()
@Module({
  controllers: [AuditoriaController_jc],
  providers: [
    PrismaService,
    AuditoriaService_jc,
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor_jc },
  ],
  exports: [AuditoriaService_jc],
})
export class AuditoriaModule_jc {}
