// ══════════════════════════════════════════════════════════════
// configuracion-curricular.controller_ga.ts
// Controlador REST de Configuración Curricular (_ga)
//
// SOLID: Single Responsibility — solo expone los endpoints HTTP.
//        Dependency Inversion — delega toda la lógica al service.
// Ruta base: /configuracion-curricular_ga
// ══════════════════════════════════════════════════════════════

import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ConfiguracionCurricularService_ga } from './configuracion-curricular.service_ga';
import { ActualizarConfiguracionDto_ga } from './dto/actualizar-configuracion.dto_ga';

/**
 * ConfiguracionCurricularController_ga
 *
 * Expone 3 endpoints REST para la Configuración Curricular Global:
 *   GET  /configuracion-curricular_ga/periodos          — lista períodos con config
 *   GET  /configuracion-curricular_ga/periodo/:id       — config de un período
 *   PUT  /configuracion-curricular_ga/periodo/:id       — actualiza config (ADMIN)
 */
@Controller('configuracion-curricular_ga')
export class ConfiguracionCurricularController_ga {
  // Logger dedicado al controlador para auditoría de peticiones HTTP
  private readonly logger_ga = new Logger(ConfiguracionCurricularController_ga.name);

  constructor(
    private readonly configuracionService_ga: ConfiguracionCurricularService_ga,
  ) {}

  // ────────────────────────────────────────────────────────────
  // GET /configuracion-curricular_ga/periodos
  // Acceso: ADMINISTRADOR
  // Por qué: el admin necesita el listado completo de períodos para
  //          el q-select del frontend (selector de período activo).
  // ────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'ADMINISTRADOR')
  @Get('periodos')
  async listarPeriodos_ga() {
    this.logger_ga.log('[GET] /configuracion-curricular_ga/periodos');
    return this.configuracionService_ga.listarPeriodosConConfig_ga();
  }

  // ────────────────────────────────────────────────────────────
  // GET /configuracion-curricular_ga/periodo/:idPeriodo
  // Acceso: ADMINISTRADOR, PROFESOR, CONTROL_ESTUDIOS
  // Por qué: todos los roles necesitan leer la config vigente para
  //          saber el formato con que deben elaborar/revisar el plan.
  // ────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'ADMINISTRADOR', 'PROFESOR', 'CONTROL_ESTUDIOS')
  @Get('periodo/:idPeriodo')
  async obtenerPorPeriodo_ga(@Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number) {
    this.logger_ga.log(`[GET] /configuracion-curricular_ga/periodo/${idPeriodo_ga}`);
    return this.configuracionService_ga.obtenerPorPeriodo_ga(idPeriodo_ga);
  }

  // ────────────────────────────────────────────────────────────
  // PUT /configuracion-curricular_ga/periodo/:idPeriodo
  // Acceso: ADMINISTRADOR
  // Por qué: SOLO el administrador puede cambiar el formato global
  //          de evaluación del período. Los demás roles solo leen.
  // ────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'ADMINISTRADOR')
  @Put('periodo/:idPeriodo')
  async actualizarConfiguracion_ga(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
    @Body() dto_ga: ActualizarConfiguracionDto_ga,
  ) {
    this.logger_ga.log(`[PUT] /configuracion-curricular_ga/periodo/${idPeriodo_ga} → ${dto_ga.formato_evaluacion_ga}`);
    return this.configuracionService_ga.actualizarConfiguracion_ga(idPeriodo_ga, dto_ga);
  }
}
