import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EtlCsvService_jc } from './etl-csv.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Motor de Carga Masiva (ETL/CSV) de Control de Estudios.
 * Dos fases: /validar reporta errores sin escribir; /confirmar persiste.
 * Entidades soportadas: carreras, materias, planes-evaluacion, calificaciones.
 */
@Controller('control-estudios/csv')
export class CargaMasivaController_jc {
  constructor(private readonly etlService_jc: EtlCsvService_jc) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post(':entidad/validar')
  @UseInterceptors(FileInterceptor('file'))
  async validar_jc(
    @Param('entidad') entidad_jc: string,
    @UploadedFile() archivo_jc: Express.Multer.File,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    if (!archivo_jc) {
      throw new BadRequestException('No se ha proporcionado ningún archivo CSV.');
    }
    return this.etlService_jc.procesar_jc(
      entidad_jc,
      archivo_jc.buffer,
      true,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post(':entidad/confirmar')
  @UseInterceptors(FileInterceptor('file'))
  async confirmar_jc(
    @Param('entidad') entidad_jc: string,
    @UploadedFile() archivo_jc: Express.Multer.File,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    if (!archivo_jc) {
      throw new BadRequestException('No se ha proporcionado ningún archivo CSV.');
    }
    return this.etlService_jc.procesar_jc(
      entidad_jc,
      archivo_jc.buffer,
      false,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }
}
