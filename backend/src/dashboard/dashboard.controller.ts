import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService_ahbb: DashboardService) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get('stats')
  async obtenerEstadisticas_ahbb(@Req() request_ahbb: RequestConUsuario_ahbb) {
    return this.dashboardService_ahbb.getDashboardStats_ahbb(
      Number(request_ahbb.usuario_ahbb?.sub),
      request_ahbb.usuario_ahbb?.rol || ''
    );
  }
}
