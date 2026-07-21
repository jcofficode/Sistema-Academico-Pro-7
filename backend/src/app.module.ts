import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { CursosModule } from './cursos/cursos.module';
import { InscripcionesModule_ahbb } from './inscripciones/inscripciones.module';
import { TiendaModule_ahbb } from './tienda/tienda.module_ahbb';
import { DashboardModule } from './dashboard/dashboard.module';
import { BootstrapService_ahbb } from './bootstrap/bootstrap.service_ahbb';
import { TunnelModule_ahbb } from './common/tunnel/tunnel.module_ahbb';
import { CertificadosModule_ahbb } from './certificados/certificados.module_ahbb';
import { ConfiguracionModule_ahbb } from './configuracion/configuracion.module_ahbb';
import { AcademicoModule_cjgp } from './academico/academico.module_cjgp';
import { ControlEstudiosModule_jc } from './control-estudios/control-estudios.module_jc';
import { MultimediaModule_jf } from './multimedia/multimedia.module_jf';
import { PagosModule_ap } from './pagos/pagos.module_ap';
import { PlanEstudioModule_ga } from './plan-estudio/plan-estudio.module_ga';

@Module({
  imports: [
    UsuariosModule,
    AuthModule,
    CursosModule,
    InscripcionesModule_ahbb,
    TiendaModule_ahbb,
    DashboardModule,
    TunnelModule_ahbb,
    CertificadosModule_ahbb,
    ConfiguracionModule_ahbb,
    AcademicoModule_cjgp,
    ControlEstudiosModule_jc,
    MultimediaModule_jf,
    PagosModule_ap,
    PlanEstudioModule_ga,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, BootstrapService_ahbb],
})
export class AppModule {}
