import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { ConfiguracionController_ahbb } from './configuracion.controller_ahbb';
import { ConfiguracionService_ahbb } from './configuracion.service_ahbb';

@Module({
  imports: [
    JwtModule.register({
      secret: 'super-secreto-ahbb',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [ConfiguracionController_ahbb],
  providers: [PrismaService, ConfiguracionService_ahbb],
  exports: [ConfiguracionService_ahbb],
})
export class ConfiguracionModule_ahbb {}
