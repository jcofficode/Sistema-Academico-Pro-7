import { Module } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [CursosService, PrismaService],
  controllers: [CursosController],
  exports: [CursosService],
})
export class CursosModule {}
