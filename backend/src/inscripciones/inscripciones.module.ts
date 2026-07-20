import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CursosModule } from '../cursos/cursos.module';
import { InscripcionesService_ahbb } from './inscripciones.service';
import { InscripcionesController_ahbb } from './inscripciones.controller';
import { PagosModule_ap } from '../pagos/pagos.module_ap';

@Module({
  imports: [CursosModule, PagosModule_ap],
  controllers: [InscripcionesController_ahbb],
  providers: [InscripcionesService_ahbb, PrismaService],
})
export class InscripcionesModule_ahbb {}

