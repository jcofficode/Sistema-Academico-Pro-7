import {
  Body,
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
import { FacturasService_ahbb } from './facturas.service_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('facturas')
export class FacturasPublicController_ahbb {
  constructor(private readonly facturasService_ahbb: FacturasService_ahbb) {}

  // Endpoint público: acceso al PDF sin autenticación (para QR escaneado desde cualquier dispositivo)
  @Get('publica/:id/pdf')
  async descargarPdfPublico_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Res() res_ahbb: any,
  ) {
    try {
      const pdfBuffer = await this.facturasService_ahbb.generarPdf_ahbb(id_ahbb);

      res_ahbb.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-${id_ahbb}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res_ahbb.end(pdfBuffer);
    } catch (error) {
      console.error(`Error al servir PDF público para la factura ${id_ahbb}:`, error);
      if (!res_ahbb.headersSent) {
        res_ahbb.status(500).json({ message: 'Error interno al generar el PDF de la factura.' });
      }
    }
  }
}

@Controller('facturas')
@UseGuards(JwtAuthGuard_ahbb)
export class FacturasController_ahbb {
  constructor(private readonly facturasService_ahbb: FacturasService_ahbb) {}

  // CHECKOUT: crear factura desde el carrito
  @Post()
  async crearFactura_ahbb(
    @Req() req_ahbb: RequestConUsuario_ahbb,
    @Body() datos_ahbb: { nroReferenciaPago: string },
  ) {
    return this.facturasService_ahbb.crearFactura_ahbb(
      Number(req_ahbb.usuario_ahbb?.sub),
      datos_ahbb.nroReferenciaPago,
    );
  }

  // Historial de compras del usuario logueado
  @Get()
  async obtenerHistorial_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    return this.facturasService_ahbb.obtenerHistorial_ahbb(Number(req_ahbb.usuario_ahbb?.sub));
  }

  // Detalle de una factura del usuario
  @Get(':id')
  async obtenerPorId_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.facturasService_ahbb.obtenerPorId_ahbb(id_ahbb, Number(req_ahbb.usuario_ahbb?.sub));
  }

  // ADMIN: ver todas las facturas
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('admin/todas')
  async obtenerTodas_ahbb() {
    return this.facturasService_ahbb.obtenerTodas_ahbb();
  }

  // ADMIN: cambiar estado de factura
  @UseGuards(RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/estado')
  async cambiarEstado_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Body() datos_ahbb: { estado: string },
  ) {
    return this.facturasService_ahbb.cambiarEstado_ahbb(id_ahbb, datos_ahbb.estado);
  }

  // Descargar o ver factura en PDF
  @Get(':id/pdf')
  async descargarPdf_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
    @Res() res_ahbb: any,
  ) {
    try {
      const pdfBuffer = await this.facturasService_ahbb.generarPdf_ahbb(
        id_ahbb,
        Number(req_ahbb.usuario_ahbb?.sub),
      );

      res_ahbb.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-${id_ahbb}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res_ahbb.end(pdfBuffer);
    } catch (error) {
      console.error(`Error al servir PDF para la factura ${id_ahbb}:`, error);
      if (!res_ahbb.headersSent) {
        res_ahbb.status(500).json({ message: 'Error interno al generar el PDF de la factura.' });
      }
    }
  }
}
