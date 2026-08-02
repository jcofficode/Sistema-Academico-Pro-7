import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ActasService_jc } from './actas.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ROLES_JC, ROLES_OPERADORES_NOTAS_JC } from '../common/constantes/roles_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Subsistema de Generación de Actas y reportes de Control de Estudios.
 *
 * El acta se emite en una única modalidad (Acta Blanca de auditoría). La
 * antigua Acta Verde de llenado manual fue descontinuada.
 *
 * Emitir actas corresponde a quien gestiona las notas (PROFESOR y
 * CONTROL_ESTUDIOS); el administrador conserva el registro auditable y los
 * reportes, que son de consulta.
 */
@Controller('control-estudios/actas')
export class ActasController_jc {
  constructor(private readonly actasService_jc: ActasService_jc) {}

  // Registro auditable de todas las actas emitidas
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get()
  async obtenerRegistro_jc() {
    return this.actasService_jc.obtenerRegistro_jc();
  }

  // Reporte de rendimiento del período (usa TABLA TEMPORAL en PostgreSQL)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get('reporte-rendimiento/:idPeriodo')
  async reporteRendimiento_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
  ) {
    return this.actasService_jc.reporteRendimiento_jc(idPeriodo_jc);
  }

  // Descarga del acta en PDF
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC)
  @Get(':idMateria/:idPeriodo/pdf')
  async descargarActaPdf_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
    @Res() res_jc: Response,
  ) {
    const { buffer, codigo } = await this.actasService_jc.generarActaPdf_jc(
      idMateria_jc,
      idPeriodo_jc,
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
