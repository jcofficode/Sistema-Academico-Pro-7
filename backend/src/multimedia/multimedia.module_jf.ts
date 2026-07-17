import { Module } from '@nestjs/common';
import { MultimediaService_jf } from './multimedia.service_jf';
import { MultimediaController_jf } from './multimedia.controller_jf';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [MultimediaService_jf, PrismaService],
  controllers: [MultimediaController_jf],
  exports: [MultimediaService_jf],
})
export class MultimediaModule_jf {}
