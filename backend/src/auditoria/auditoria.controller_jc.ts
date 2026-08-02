import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService_jc } from './auditoria.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ROLES_JC } from '../common/constantes/roles_jc';
import { MODULOS_AUDITORIA_JC } from './constantes/acciones-auditoria_jc';

/**
 * API de la bitácora de auditoría.
 *
 *  - `/auditoria/...`                  → visión completa del sistema (ADMIN).
 *  - `/auditoria/control-estudios/...` → visión académica, acotada al módulo
 *    de Control de Estudios (ADMIN y CONTROL_ESTUDIOS).
 *
 * Ambas leen la misma tabla; la segunda fuerza el filtro de módulo para que el
 * personal de Control de Estudios no vea actividad ajena a lo académico.
 */
@Controller('auditoria')
export class AuditoriaController_jc {
  constructor(private readonly auditoriaService_jc: AuditoriaService_jc) {}

  // ── Auditoría general del sistema (solo administrador) ──────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN)
  @Get()
  async consultar_jc(@Query() filtros_jc: any) {
    return this.auditoriaService_jc.consultar_jc(filtros_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN)
  @Get('resumen')
  async resumen_jc(@Query('modulo_jc') modulo_jc?: string) {
    return this.auditoriaService_jc.resumen_jc(modulo_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get('catalogos')
  catalogos_jc() {
    return this.auditoriaService_jc.catalogos_jc();
  }

  // ── Auditoría académica de Control de Estudios ──────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get('control-estudios')
  async consultarControlEstudios_jc(@Query() filtros_jc: any) {
    return this.auditoriaService_jc.consultar_jc({
      ...filtros_jc,
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    });
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get('control-estudios/resumen')
  async resumenControlEstudios_jc() {
    return this.auditoriaService_jc.resumen_jc(
      MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    );
  }
}
