import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlantillasService_ga } from './plantillas.service_ga';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearPlantillaDto_ga } from './dto/crear-plantilla.dto_ga';

/**
 * Admin UI de la Plantilla Institucional de Planificación (Épica A).
 * Solo el administrador define la estructura del plan de estudio.
 */
@Controller('plan-estudio/plantillas')
export class PlantillasController_ga {
  constructor(
    private readonly plantillasService_ga: PlantillasService_ga,
  ) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get()
  async obtenerTodas_ga() {
    return this.plantillasService_ga.obtenerTodas_ga();
  }

  // Plantilla vigente del período (usada por profesores para generar el formulario)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('vigente/:idPeriodo')
  async obtenerVigente_ga(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    return this.plantillasService_ga.obtenerVigente_ga(idPeriodo_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get(':id')
  async obtenerPorId_ga(@Param('id', ParseIntPipe) id_ga: number) {
    return this.plantillasService_ga.obtenerPorId_ga(id_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crear_ga(@Body() datos_ga: CrearPlantillaDto_ga) {
    return this.plantillasService_ga.crear_ga(datos_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Put(':id')
  async actualizar_ga(
    @Param('id', ParseIntPipe) id_ga: number,
    @Body() datos_ga: CrearPlantillaDto_ga,
  ) {
    return this.plantillasService_ga.actualizar_ga(id_ga, datos_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/publicar')
  async publicar_ga(@Param('id', ParseIntPipe) id_ga: number) {
    return this.plantillasService_ga.publicar_ga(id_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async eliminar_ga(@Param('id', ParseIntPipe) id_ga: number) {
    return this.plantillasService_ga.eliminar_ga(id_ga);
  }
}
