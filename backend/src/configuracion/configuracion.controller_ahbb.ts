import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ConfiguracionService_ahbb } from './configuracion.service_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';

@Controller('configuracion')
@UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
@RolesDecorator_ahbb('ADMIN')
export class ConfiguracionController_ahbb {
  constructor(
    private readonly configuracionService_ahbb: ConfiguracionService_ahbb,
  ) {}

  @Get()
  async obtenerConfiguracion_ahbb() {
    return this.configuracionService_ahbb.obtenerConfiguracion_ahbb();
  }

  @Put('imagen-certificado')
  async actualizarImagenCertificado_ahbb(
    @Body() datos_ahbb: { imagenBase64: string },
  ) {
    return this.configuracionService_ahbb.actualizarImagenCertificado_ahbb(
      datos_ahbb.imagenBase64,
    );
  }
}
