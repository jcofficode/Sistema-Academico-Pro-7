import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { PlantillasService_ga } from './plantillas.service_ga';

/**
 * Controller para la Configuración Curricular del Período (_ga)
 */
@Controller('plan-estudio/configuracion_ga')
export class PlantillasController_ga {
  constructor(private readonly plantillasService_ga: PlantillasService_ga) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMINISTRADOR', 'PROFESOR', 'CONTROL_ESTUDIOS')
  @Get('vigente/:idPeriodo')
  async obtenerVigente_ga(@Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number) {
    return this.plantillasService_ga.obtenerVigente_ga(idPeriodo_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMINISTRADOR')
  @Put(':idPeriodo')
  async actualizarConfiguracion_ga(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
    @Body('formato_evaluacion_ga') formato_ga: 'CUANTITATIVO' | 'CUALITATIVO',
  ) {
    return this.plantillasService_ga.actualizarConfiguracion_ga(idPeriodo_ga, formato_ga);
  }
}
