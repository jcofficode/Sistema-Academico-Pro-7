import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TarifasService_ap } from './tarifas.service_ap';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearTarifaDto_ap } from './dto/crear-tarifa.dto_ap';

/**
 * TarifasController_ap — CRUD de tarifas de pago.
 *
 * Las tarifas las gestiona el administrador. Los alumnos pueden
 * consultar la tarifa activa de período para saber cuánto deben pagar.
 */
@Controller('pagos/tarifas')
export class TarifasController_ap {
  constructor(private readonly tarifasService_ap: TarifasService_ap) {}

  // Rutas literales primero (antes de las paramétricas)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'ALUMNO', 'PROFESOR')
  @Get('periodo-activa')
  async obtenerTarifaPeriodoActiva_ap() {
    return this.tarifasService_ap.obtenerTarifaPeriodoActiva_ap();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get()
  async obtenerTodas_ap() {
    return this.tarifasService_ap.obtenerTodas_ap();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crear_ap(@Body() datos_ap: CrearTarifaDto_ap) {
    return this.tarifasService_ap.crear_ap(datos_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id')
  async actualizar_ap(
    @Param('id', ParseIntPipe) id_tarifa_ap: number,
    @Body() datos_ap: Partial<CrearTarifaDto_ap>,
  ) {
    return this.tarifasService_ap.actualizar_ap(id_tarifa_ap, datos_ap);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async eliminar_ap(@Param('id', ParseIntPipe) id_tarifa_ap: number) {
    return this.tarifasService_ap.eliminar_ap(id_tarifa_ap);
  }
}
