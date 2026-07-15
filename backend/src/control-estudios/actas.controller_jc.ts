import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ActasService_jc } from './actas.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/** Subsistema de Generación de Actas y reportes de Control de Estudios. */
@Controller('control-estudios/actas')
export class ActasController_jc {
  constructor(private readonly actasService_jc: ActasService_jc) {}

  // Registro auditable de todas las actas emitidas
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get()
  async obtenerRegistro_jc() {
    return this.actasService_jc.obtenerRegistro_jc();
  }

  // Reporte de rendimiento del período (usa TABLA TEMPORAL en PostgreSQL)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('reporte-rendimiento/:idPeriodo')
  async reporteRendimiento_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
  ) {
    return this.actasService_jc.reporteRendimiento_jc(idPeriodo_jc);
  }

  // Descarga del PDF (tipo=BLANCA | VERDE)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get(':idMateria/:idPeriodo/pdf')
  async descargarActaPdf_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Query('tipo') tipo_jc: string,
    @Req() request_jc: RequestConUsuario_ahbb,
    @Res() res_jc: Response,
  ) {
    const tipoNormalizado_jc = (tipo_jc ?? 'BLANCA').toUpperCase();
    if (!['BLANCA', 'VERDE'].includes(tipoNormalizado_jc)) {
      throw new BadRequestException('El tipo de acta debe ser BLANCA o VERDE.');
    }

    const { buffer, codigo } = await this.actasService_jc.generarActaPdf_jc(
      idMateria_jc,
      idPeriodo_jc,
      tipoNormalizado_jc as 'BLANCA' | 'VERDE',
      Number(request_jc.usuario_ahbb?.sub),
    );

    res_jc.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${codigo}.pdf`,
      'Content-Length': buffer.length,
    });
    res_jc.send(buffer);
  }
}
