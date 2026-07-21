import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';
import { PlanesEstudioService_ga } from './planes-estudio.service_ga';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearPlanEstudioDto_ga } from './dto/crear-plan-estudio.dto_ga';
import { RevisarPlanDto_ga } from './dto/revisar-plan.dto_ga';

/**
 * Endpoints del Plan de Estudio (Épica B y C).
 * Profesor: elabora y entrega. Admin: revisa y aprueba. Alumno: consulta.
 */
@Controller('plan-estudio')
export class PlanesEstudioController_ga {
  constructor(
    private readonly planesService_ga: PlanesEstudioService_ga,
  ) {}

  // ─── Profesor ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mis-planes/:idPeriodo')
  async obtenerMisPlanes_ga(
    @Req() request_ga: RequestConUsuario_ahbb,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    return this.planesService_ga.obtenerMisPlanes_ga(
      Number(request_ga.usuario_ahbb?.sub),
      idPeriodo_ga,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Post()
  async crear_ga(
    @Body() datos_ga: CrearPlanEstudioDto_ga,
    @Req() request_ga: RequestConUsuario_ahbb,
  ) {
    return this.planesService_ga.crear_ga(
      datos_ga,
      Number(request_ga.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Put(':id')
  async actualizar_ga(
    @Param('id', ParseIntPipe) id_ga: number,
    @Body() datos_ga: CrearPlanEstudioDto_ga,
    @Req() request_ga: RequestConUsuario_ahbb,
  ) {
    return this.planesService_ga.actualizar_ga(
      id_ga,
      datos_ga,
      Number(request_ga.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Patch(':id/entregar')
  async entregar_ga(
    @Param('id', ParseIntPipe) id_ga: number,
    @Req() request_ga: RequestConUsuario_ahbb,
  ) {
    return this.planesService_ga.entregar_ga(
      id_ga,
      Number(request_ga.usuario_ahbb?.sub),
    );
  }

  // ─── Admin (coordinación) ───────────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('bandeja/:idPeriodo')
  async obtenerBandeja_ga(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    return this.planesService_ga.obtenerBandeja_ga(idPeriodo_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/revisar')
  async revisar_ga(
    @Param('id', ParseIntPipe) id_ga: number,
    @Body() datos_ga: RevisarPlanDto_ga,
    @Req() request_ga: RequestConUsuario_ahbb,
  ) {
    return this.planesService_ga.revisar_ga(
      id_ga,
      datos_ga,
      Number(request_ga.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('reporte-cumplimiento/:idPeriodo')
  async reporteCumplimiento_ga(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    return this.planesService_ga.reporteCumplimiento_ga(idPeriodo_ga);
  }

  // ─── Alumno ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Get('alumno/mis-planes/:idPeriodo')
  async obtenerPlanesAlumno_ga(
    @Req() request_ga: RequestConUsuario_ahbb,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_ga: number,
  ) {
    return this.planesService_ga.obtenerPlanesAlumno_ga(
      Number(request_ga.usuario_ahbb?.sub),
      idPeriodo_ga,
    );
  }

  // ─── Detalle y PDF (compartido) ─────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get(':id')
  async obtenerPorId_ga(@Param('id', ParseIntPipe) id_ga: number) {
    return this.planesService_ga.obtenerPorId_ga(id_ga);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get(':id/pdf')
  async descargarPdf_ga(
    @Param('id', ParseIntPipe) id_ga: number,
    @Res() res_ga: Response,
  ) {
    const buffer_ga = await this.planesService_ga.generarPdf_ga(id_ga);
    res_ga.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="plan-estudio-${id_ga}.pdf"`,
    });
    res_ga.end(buffer_ga);
  }
}
