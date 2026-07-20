import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PagosService_ap } from './pagos.service_ap';
import { RecibosService_ap } from './recibos.service_ap';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearPagoDto_ap } from './dto/crear-pago.dto_ap';
import { ConfirmarPagoDto_ap } from './dto/confirmar-pago.dto_ap';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * PagosController_ap — Endpoints del sistema de pagos de alumnos.
 *
 * Convención: rutas literales ANTES que paramétricas.
 */
@Controller('pagos')
export class PagosController_ap {
  constructor(
    private readonly pagosService_ap: PagosService_ap,
    private readonly recibosService_ap: RecibosService_ap,
  ) {}

  // ─── Alumno: ver y crear sus pagos ────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Get('mis-pagos')
  async obtenerMisPagos_ap(@Req() request_ap: RequestConUsuario_ahbb) {
    return this.pagosService_ap.obtenerMisPagos_ap(
      Number(request_ap.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Post()
  async crearPago_ap(
    @Body() datos_ap: CrearPagoDto_ap,
    @Req() request_ap: RequestConUsuario_ahbb,
  ) {
    return this.pagosService_ap.crearPago_ap(
      Number(request_ap.usuario_ahbb?.sub),
      datos_ap,
    );
  }

  // ─── Admin: gestionar todos los pagos ────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('admin/todos')
  async obtenerTodosAdmin_ap(@Query('estado') estado_ap?: string) {
    return this.pagosService_ap.obtenerTodosAdmin_ap(estado_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('admin/reporte-ingresos/:idPeriodo')
  async reporteIngresos_ap(
    @Param('idPeriodo', ParseIntPipe) id_periodo_ap: number,
  ) {
    return this.pagosService_ap.reporteIngresos_ap(id_periodo_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch('admin/:id/confirmar')
  async confirmarPago_ap(
    @Param('id', ParseIntPipe) id_pago_ap: number,
    @Body() datos_ap: ConfirmarPagoDto_ap,
    @Req() request_ap: RequestConUsuario_ahbb,
  ) {
    return this.pagosService_ap.confirmarPago_ap(
      id_pago_ap,
      datos_ap,
      Number(request_ap.usuario_ahbb?.sub),
    );
  }

  // ─── Recibos PDF ──────────────────────────────────────────────

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'ALUMNO')
  @Get('recibo/:idPago')
  async descargarReciboPago_ap(
    @Param('idPago', ParseIntPipe) id_pago_ap: number,
    @Res() respuesta_ap: Response,
  ) {
    const { buffer, codigo } =
      await this.recibosService_ap.generarReciboPago_ap(id_pago_ap);
    respuesta_ap.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${codigo}.pdf"`,
      'Content-Length': buffer.length,
    });
    respuesta_ap.end(buffer);
  }
}
