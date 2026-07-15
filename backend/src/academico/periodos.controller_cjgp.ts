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
import { PeriodosService_cjgp } from './periodos.service_cjgp';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearPeriodoDto_cjgp } from './dto/crear-periodo.dto_cjgp';

@Controller('academico/periodos')
export class PeriodosController_cjgp {
  constructor(private readonly periodosService_cjgp: PeriodosService_cjgp) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get()
  async obtenerTodos_cjgp() {
    return this.periodosService_cjgp.obtenerTodos_cjgp();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get('activo')
  async obtenerActivo_cjgp() {
    return this.periodosService_cjgp.obtenerActivo_cjgp();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crear_cjgp(@Body() datos_cjgp: CrearPeriodoDto_cjgp) {
    return this.periodosService_cjgp.crear_cjgp(datos_cjgp);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id/activar')
  async activar_cjgp(@Param('id', ParseIntPipe) id_cjgp: number) {
    return this.periodosService_cjgp.activar_cjgp(id_cjgp);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async eliminar_cjgp(@Param('id', ParseIntPipe) id_cjgp: number) {
    return this.periodosService_cjgp.eliminar_cjgp(id_cjgp);
  }
}
