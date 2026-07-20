import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { NominaService_ap } from './nomina.service_ap';
import { RecibosService_ap } from './recibos.service_ap';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * NominaController_ap — Generación y gestión de nóminas de profesores.
 * Rutas literales antes que paramétricas.
 */
@Controller('pagos/nomina')
export class NominaController_ap {
  constructor(
    private readonly nominaService_ap: NominaService_ap,
    private readonly recibosService_ap: RecibosService_ap,
  ) {}

  // Rutas del PROFESOR
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mis-recibos')
  async obtenerMisNominas_ap(@Req() request_ap: RequestConUsuario_ahbb) {
    return this.nominaService_ap.obtenerMisNominas_ap(
      Number(request_ap.usuario_ahbb?.sub),
    );
  }

  // Rutas del ADMIN
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('generar/:idPeriodo')
  async generarNomina_ap(
    @Param('idPeriodo', ParseIntPipe) id_periodo_ap: number,
  ) {
    return this.nominaService_ap.generarNomina_ap(id_periodo_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('periodo/:idPeriodo')
  async obtenerNominas_ap(
    @Param('idPeriodo', ParseIntPipe) id_periodo_ap: number,
  ) {
    return this.nominaService_ap.obtenerNominas_ap(id_periodo_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/pagar')
  async marcarPagada_ap(@Param('id', ParseIntPipe) id_nomina_ap: number) {
    return this.nominaService_ap.marcarPagada_ap(id_nomina_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('recibo/:idNomina')
  async descargarReciboNomina_ap(
    @Param('idNomina', ParseIntPipe) id_nomina_ap: number,
    @Res() respuesta_ap: Response,
  ) {
    const { buffer, codigo } =
      await this.recibosService_ap.generarReciboNomina_ap(id_nomina_ap);
    respuesta_ap.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-nomina-${codigo}.pdf"`,
      'Content-Length': buffer.length,
    });
    respuesta_ap.end(buffer);
  }
}
