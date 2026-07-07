import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard_ahbb } from './common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from './common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from './common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from './common/interfaces/request-usuario.interface_ahbb';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get('dashboard/stats')
  async getDashboardStats(@Req() request_ahbb: RequestConUsuario_ahbb) {
    const userId = Number(request_ahbb.usuario_ahbb?.sub);
    const rol = request_ahbb.usuario_ahbb?.rol || '';
    return this.appService.getDashboardStats(userId, rol);
  }
}
