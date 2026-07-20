import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContratosService_ap } from './contratos.service_ap';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearContratoDto_ap } from './dto/crear-contrato.dto_ap';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * ContratosController_ap — Gestión de contratos de profesores.
 * Admin: lista y crea contratos. Profesor: ve su propio contrato.
 */
@Controller('pagos/contratos')
export class ContratosController_ap {
  constructor(private readonly contratosService_ap: ContratosService_ap) {}

  // Ruta literal antes de paramétrica
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mi-contrato')
  async obtenerMiContrato_ap(@Req() request_ap: RequestConUsuario_ahbb) {
    return this.contratosService_ap.obtenerMiContrato_ap(
      Number(request_ap.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get()
  async obtenerTodos_ap() {
    return this.contratosService_ap.obtenerTodos_ap();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crear_ap(@Body() datos_ap: CrearContratoDto_ap) {
    return this.contratosService_ap.crear_ap(datos_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/desactivar')
  async desactivar_ap(@Param('id', ParseIntPipe) id_contrato_ap: number) {
    return this.contratosService_ap.desactivar_ap(id_contrato_ap);
  }
}
