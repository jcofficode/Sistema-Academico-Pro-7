import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import * as express from 'express';
import { CertificadosService_ahbb } from './certificados.service_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Controlador público de certificados (verificación QR sin autenticación).
 */
@Controller('certificados')
export class CertificadosPublicController_ahbb {
  constructor(
    private readonly certificadosService_ahbb: CertificadosService_ahbb,
  ) {}

  @Get('verificar/:id')
  async verificarCertificado_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Res() res_ahbb: express.Response,
  ) {
    // Redirigir al endpoint público de PDF para que sea accesible desde cualquier red
    // (el túnel de Cloudflare expone el backend, no el frontend)
    return res_ahbb.redirect(`/api/certificados/publico/${id_ahbb}/pdf`);
  }

  // Endpoint público para descargar PDF (sin JWT, para escaneo QR)
  @Get('publico/:id/pdf')
  async descargarPdfPublico_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Res() res_ahbb: any,
  ) {
    try {
      const pdfBuffer =
        await this.certificadosService_ahbb.generarPdfCertificado_ahbb(
          id_ahbb,
        );

      res_ahbb.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificado-${id_ahbb}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res_ahbb.end(pdfBuffer);
    } catch (error) {
      console.error(
        `Error al servir PDF público del certificado ${id_ahbb}:`,
        error,
      );
      if (!res_ahbb.headersSent) {
        res_ahbb
          .status(500)
          .json({ message: 'Error interno al generar el PDF del certificado.' });
      }
    }
  }
}

/**
 * Controlador autenticado de certificados.
 */
@Controller('certificados')
@UseGuards(JwtAuthGuard_ahbb)
export class CertificadosController_ahbb {
  constructor(
    private readonly certificadosService_ahbb: CertificadosService_ahbb,
  ) {}

  // Emitir certificado individual
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('emitir/:id_inscripcion')
  async emitirCertificado_ahbb(
    @Param('id_inscripcion', ParseIntPipe) id_inscripcion_ahbb: number,
  ) {
    return this.certificadosService_ahbb.emitirCertificado_ahbb(
      id_inscripcion_ahbb,
    );
  }

  // Emitir certificados masivos para un curso
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('emitir-masivo/:id_curso')
  async emitirCertificadosMasivo_ahbb(
    @Param('id_curso', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.certificadosService_ahbb.emitirCertificadosMasivo_ahbb(
      id_curso_ahbb,
    );
  }

  // Certificados de un alumno
  @Get('alumno/:id_usuario')
  async obtenerCertificadosAlumno_ahbb(
    @Param('id_usuario', ParseIntPipe) id_usuario_ahbb: number,
  ) {
    return this.certificadosService_ahbb.obtenerCertificadosAlumno_ahbb(
      id_usuario_ahbb,
    );
  }

  // Certificados de un curso
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('curso/:id_curso')
  async obtenerCertificadosCurso_ahbb(
    @Param('id_curso', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.certificadosService_ahbb.obtenerCertificadosCurso_ahbb(
      id_curso_ahbb,
    );
  }

  // Todos los certificados (admin ve todos, profesor ve los de sus cursos)
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get()
  async obtenerTodos_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    const rol_ahbb = req_ahbb.usuario_ahbb?.rol;
    const idUsuario_ahbb = Number(req_ahbb.usuario_ahbb?.sub);

    if (rol_ahbb === 'PROFESOR') {
      return this.certificadosService_ahbb.obtenerCertificadosProfesor_ahbb(idUsuario_ahbb);
    }
    return this.certificadosService_ahbb.obtenerTodos_ahbb();
  }

  // Descargar PDF del certificado
  @Get(':id/pdf')
  async descargarPdf_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Res() res_ahbb: any,
  ) {
    try {
      const pdfBuffer =
        await this.certificadosService_ahbb.generarPdfCertificado_ahbb(
          id_ahbb,
        );

      res_ahbb.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificado-${id_ahbb}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res_ahbb.end(pdfBuffer);
    } catch (error) {
      console.error(
        `Error al servir PDF del certificado ${id_ahbb}:`,
        error,
      );
      if (!res_ahbb.headersSent) {
        res_ahbb
          .status(500)
          .json({ message: 'Error interno al generar el PDF del certificado.' });
      }
    }
  }

  // Anular certificado (admin)
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async anularCertificado_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
  ) {
    return this.certificadosService_ahbb.anularCertificado_ahbb(id_ahbb);
  }
}
