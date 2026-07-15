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
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearPlanEvaluacionDto_jc } from './dto/crear-plan-evaluacion.dto_jc';

/**
 * Admin UI del Esquema de Evaluación Parametrizado.
 * Solo el administrador define la estructura de evaluación de la
 * institución (uniformidad de las actas); los docentes la consumen.
 */
@Controller('control-estudios/planes-evaluacion')
export class PlanesEvaluacionController_jc {
  constructor(
    private readonly planesService_jc: PlanesEvaluacionService_jc,
  ) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get()
  async obtenerTodos_jc() {
    return this.planesService_jc.obtenerTodos_jc();
  }

  // Diccionario de datos vía information_schema (requisito de metadatos)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('metadatos')
  async obtenerMetadatos_jc() {
    return this.planesService_jc.obtenerMetadatos_jc();
  }

  // Plan vigente que rige una materia en un período (lo usa la UI docente)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('vigente/:idMateria/:idPeriodo')
  async resolverVigente_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
  ) {
    return this.planesService_jc.resolverPlanVigente_jc(idMateria_jc, idPeriodo_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get(':id')
  async obtenerPorId_jc(@Param('id', ParseIntPipe) id_jc: number) {
    return this.planesService_jc.obtenerPorId_jc(id_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crear_jc(@Body() datos_jc: CrearPlanEvaluacionDto_jc) {
    return this.planesService_jc.crear_jc(datos_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Put(':id')
  async actualizar_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Body() datos_jc: CrearPlanEvaluacionDto_jc,
  ) {
    return this.planesService_jc.actualizar_jc(id_jc, datos_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/publicar')
  async publicar_jc(@Param('id', ParseIntPipe) id_jc: number) {
    return this.planesService_jc.publicar_jc(id_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async eliminar_jc(@Param('id', ParseIntPipe) id_jc: number) {
    return this.planesService_jc.eliminar_jc(id_jc);
  }
}
