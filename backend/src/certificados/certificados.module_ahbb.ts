import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { CertificadosController_ahbb, CertificadosPublicController_ahbb } from './certificados.controller_ahbb';
import { CertificadosService_ahbb } from './certificados.service_ahbb';

@Module({
  imports: [
    JwtModule.register({
      secret: 'super-secreto-ahbb',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [CertificadosController_ahbb, CertificadosPublicController_ahbb],
  providers: [PrismaService, CertificadosService_ahbb],
  exports: [CertificadosService_ahbb],
})
export class CertificadosModule_ahbb {}
