import {
  BadRequestException,
  Controller,
  ForbiddenException,
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
import { ROLES_JC } from '../common/constantes/roles_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Motor de Carga Masiva (ETL/CSV) de Control de Estudios.
 * Dos fases: /validar reporta errores sin escribir; /confirmar persiste.
 * Entidades soportadas: carreras, materias, planes-evaluacion, calificaciones.
 *
 * La entidad `calificaciones` escribe notas, así que queda reservada al
 * personal de Control de Estudios: el administrador puede cargar la
 * configuración académica, pero no calificaciones.
 */
@Controller('control-estudios/csv')
export class CargaMasivaController_jc {
  constructor(private readonly etlService_jc: EtlCsvService_jc) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Post(':entidad/validar')
  @UseInterceptors(FileInterceptor('file'))
  async validar_jc(
    @Param('entidad') entidad_jc: string,
    @UploadedFile() archivo_jc: Express.Multer.File,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    this.verificarPermisoEntidad_jc(entidad_jc, request_jc);
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
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Post(':entidad/confirmar')
  @UseInterceptors(FileInterceptor('file'))
  async confirmar_jc(
    @Param('entidad') entidad_jc: string,
    @UploadedFile() archivo_jc: Express.Multer.File,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    this.verificarPermisoEntidad_jc(entidad_jc, request_jc);
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

  /**
   * El administrador no asigna notas por ninguna vía, tampoco por CSV.
   * Se comprueba aquí porque el permiso depende del parámetro de la ruta y
   * no puede expresarse con el decorador de roles.
   */
  private verificarPermisoEntidad_jc(
    entidad_jc: string,
    request_jc: RequestConUsuario_ahbb,
  ) {
    const esCalificaciones_jc = entidad_jc === 'calificaciones';
    const esAdministrador_jc = request_jc.usuario_ahbb?.rol === ROLES_JC.ADMIN;

    if (esCalificaciones_jc && esAdministrador_jc) {
      throw new ForbiddenException(
        'El administrador no puede cargar calificaciones. Esta operación corresponde a Control de Estudios o al profesor de la materia.',
      );
    }
  }
}
