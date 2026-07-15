import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';
import { FileInterceptor } from '@nestjs/platform-express';
import { CarrerasService_cjgp } from './carreras.service_cjgp';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CrearCarreraDto_cjgp } from './dto/crear-carrera.dto_cjgp';

/**
 * Endpoints de la Épica 1: Creación Ágil de Carreras y Pensums.
 * Toda la gestión de la oferta académica es exclusiva del administrador,
 * salvo la consulta del detalle (la vitrina del alumno también la usa).
 */
@Controller('academico/carreras')
export class CarrerasController_cjgp {
  constructor(private readonly carrerasService_cjgp: CarrerasService_cjgp) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get()
  async obtenerTodas_cjgp() {
    return this.carrerasService_cjgp.obtenerTodas_cjgp();
  }

  // Plantilla Excel institucional (debe declararse antes de ":id").
  // ?regimen=SEMESTRAL|TRIMESTRAL adapta el ejemplo a los bloques del régimen.
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('plantilla-pensum')
  async descargarPlantillaPensum_cjgp(
    @Res() res_cjgp: Response,
    @Query('regimen') regimen_cjgp?: string,
  ) {
    const regimenNormalizado_cjgp =
      regimen_cjgp?.toUpperCase() === 'TRIMESTRAL' ? 'TRIMESTRAL' : 'SEMESTRAL';
    const buffer_cjgp =
      this.carrerasService_cjgp.generarPlantillaPensum_cjgp(
        regimenNormalizado_cjgp,
      );
    res_cjgp.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Plantilla_Pensum_${regimenNormalizado_cjgp}.xlsx`,
      'Content-Length': buffer_cjgp.length,
    });
    res_cjgp.send(buffer_cjgp);
  }

  // Vista "Mis Materias" del docente: lo que tiene asignado + inscritos
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mis-materias')
  async obtenerMisMaterias_cjgp(@Req() request_cjgp: RequestConUsuario_ahbb) {
    return this.carrerasService_cjgp.obtenerMisMaterias_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
    );
  }

  // Historial docente: materias dictadas por período con sus resultados
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mis-materias/historial')
  async obtenerHistorialMisMaterias_cjgp(
    @Req() request_cjgp: RequestConUsuario_ahbb,
  ) {
    return this.carrerasService_cjgp.obtenerHistorialMisMaterias_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get(':id')
  async obtenerDetalle_cjgp(@Param('id', ParseIntPipe) id_cjgp: number) {
    return this.carrerasService_cjgp.obtenerDetalle_cjgp(id_cjgp);
  }

  // Asistente paso a paso: crea carrera + pensum + prelaciones en una transacción
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post()
  async crearCarreraCompleta_cjgp(@Body() datos_cjgp: CrearCarreraDto_cjgp) {
    return this.carrerasService_cjgp.crearCarreraCompleta_cjgp(datos_cjgp);
  }

  // "El botón mágico": interpreta el Excel y devuelve el pensum SIN persistir,
  // para que el administrador lo revise dentro del asistente antes de guardar.
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('pensum-excel/analizar')
  @UseInterceptors(FileInterceptor('file'))
  async analizarPensumExcel_cjgp(@UploadedFile() archivo_cjgp: Express.Multer.File) {
    if (!archivo_cjgp) {
      throw new BadRequestException('No se ha proporcionado ningún archivo.');
    }
    return this.carrerasService_cjgp.analizarPensumExcel_cjgp(
      archivo_cjgp.buffer,
    );
  }

  // Asignación del profesor que dicta una materia (null = retirar asignación)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch('materias/:idMateria/profesor')
  async asignarProfesor_cjgp(
    @Param('idMateria', ParseIntPipe) idMateria_cjgp: number,
    @Body() datos_cjgp: { id_profesor_cjgp: number | null },
  ) {
    return this.carrerasService_cjgp.asignarProfesor_cjgp(
      idMateria_cjgp,
      datos_cjgp.id_profesor_cjgp ?? null,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id')
  async eliminar_cjgp(@Param('id', ParseIntPipe) id_cjgp: number) {
    return this.carrerasService_cjgp.eliminar_cjgp(id_cjgp);
  }
}
