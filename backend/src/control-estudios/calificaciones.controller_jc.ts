import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CalificacionesService_jc } from './calificaciones.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CargarNotasDto_jc } from './dto/cargar-notas.dto_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Docente UI: la matriz de notas se genera dinámicamente según el plan
 * de evaluación del período. El profesor solo carga los resultados de
 * cada hito configurado por la coordinación.
 */
@Controller('control-estudios/calificaciones')
export class CalificacionesController_jc {
  constructor(
    private readonly calificacionesService_jc: CalificacionesService_jc,
  ) {}

  // Materias con alumnos inscritos en el período (selector del docente).
  // Un PROFESOR solo ve las materias que tiene asignadas; el ADMIN ve todas.
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('materias/:idPeriodo')
  async obtenerMaterias_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    const esProfesor_jc = request_jc.usuario_ahbb?.rol === 'PROFESOR';
    return this.calificacionesService_jc.obtenerMateriasConInscritos_jc(
      idPeriodo_jc,
      esProfesor_jc ? Number(request_jc.usuario_ahbb?.sub) : undefined,
    );
  }

  // Vista del ALUMNO: sus propias notas del período (identidad desde el JWT)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Get('mis-notas/:idPeriodo')
  async obtenerMisNotas_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.calificacionesService_jc.obtenerMisNotas_jc(
      Number(request_jc.usuario_ahbb?.sub),
      idPeriodo_jc,
    );
  }

  // Matriz dinámica: columnas = ítems del plan, filas = alumnos inscritos
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('matriz/:idMateria/:idPeriodo')
  async obtenerMatriz_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
  ) {
    return this.calificacionesService_jc.obtenerMatriz_jc(
      idMateria_jc,
      idPeriodo_jc,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post()
  async cargarNotas_jc(
    @Body() datos_jc: CargarNotasDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.calificacionesService_jc.cargarNotas_jc(
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  // Cierre del acta: fija definitivas y actualiza el historial académico
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post('cerrar-acta/:idMateria/:idPeriodo')
  async cerrarActa_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
  ) {
    return this.calificacionesService_jc.cerrarActa_jc(idMateria_jc, idPeriodo_jc);
  }
}
