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
import { CertificadosSobresalienteService_jc } from './certificados-sobresaliente.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ROLES_JC } from '../common/constantes/roles_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Certificados de Sobresaliente de las materias de carrera.
 * (Los certificados de los cursos libres siguen viviendo en su módulo `_ahbb`:
 * son documentos distintos y no se mezclan.)
 */
@Controller('control-estudios/certificados-sobresaliente')
export class CertificadosSobresalienteController_jc {
  constructor(
    private readonly certificadosService_jc: CertificadosSobresalienteService_jc,
  ) {}

  /** Verificación pública que resuelve el QR impreso en el certificado. */
  @Get('verificar/:codigo')
  async verificar_jc(@Param('codigo') codigo_jc: string) {
    return this.certificadosService_jc.verificar_jc(codigo_jc);
  }

  /** Certificados del alumno autenticado (identidad tomada del token). */
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ALUMNO)
  @Get('mis-certificados')
  async obtenerMios_jc(@Req() request_jc: RequestConUsuario_ahbb) {
    return this.certificadosService_jc.obtenerMios_jc(
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  /** Listado institucional para Control de Estudios y administración. */
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get()
  async obtenerTodos_jc() {
    return this.certificadosService_jc.obtenerTodos_jc();
  }

  /** Descarga del PDF: el alumno solo el suyo, el personal cualquiera. */
  @UseGuards(JwtAuthGuard_ahbb)
  @Get(':id/pdf')
  async descargarPdf_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
    @Res() res_jc: Response,
  ) {
    const { buffer, codigo } = await this.certificadosService_jc.generarPdf_jc(
      id_jc,
      Number(request_jc.usuario_ahbb?.sub),
      String(request_jc.usuario_ahbb?.rol),
    );

    res_jc.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${codigo}.pdf`,
      'Content-Length': buffer.length,
    });
    res_jc.send(buffer);
  }
}
