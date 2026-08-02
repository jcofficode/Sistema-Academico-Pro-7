import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CalificacionesService_jc } from './calificaciones.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CargarNotasDto_jc } from './dto/cargar-notas.dto_jc';
import {
  ROLES_JC,
  ROLES_CONSULTA_NOTAS_JC,
  ROLES_OPERADORES_NOTAS_JC,
} from '../common/constantes/roles_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Carga de notas: la matriz se genera dinámicamente según el plan de
 * evaluación del período. El profesor y el personal de Control de Estudios
 * cargan los resultados de cada corte configurado por la coordinación.
 *
 * Separación de responsabilidades por rol:
 *  - PROFESOR y CONTROL_ESTUDIOS → cargan notas y cierran actas.
 *  - ADMIN → **solo consulta**: puede ver cómo van las notas por carrera y
 *    materia, pero no puede asignarlas ni cerrar actas.
 *  - ALUMNO → solo sus propias notas.
 */
@Controller('control-estudios/calificaciones')
export class CalificacionesController_jc {
  constructor(
    private readonly calificacionesService_jc: CalificacionesService_jc,
  ) {}

  // Materias con alumnos inscritos en el período (selector de la carga).
  // Un PROFESOR solo ve las materias que tiene asignadas; el personal de
  // Control de Estudios y el administrador las ven todas.
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_CONSULTA_NOTAS_JC)
  @Get('materias/:idPeriodo')
  async obtenerMaterias_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    const esProfesor_jc = request_jc.usuario_ahbb?.rol === ROLES_JC.PROFESOR;
    return this.calificacionesService_jc.obtenerMateriasConInscritos_jc(
      idPeriodo_jc,
      esProfesor_jc ? Number(request_jc.usuario_ahbb?.sub) : undefined,
    );
  }

  // Vista del ALUMNO: sus propias notas del período (identidad desde el JWT)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ALUMNO)
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

  /**
   * Consulta de solo lectura por carrera y materia.
   * Es la vista que usa el ADMINISTRADOR para supervisar cómo van las notas
   * sin poder modificarlas.
   */
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS)
  @Get('consulta/:idPeriodo')
  async consultarNotas_jc(
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Query('idCarrera') idCarrera_jc?: string,
    @Query('idMateria') idMateria_jc?: string,
  ) {
    return this.calificacionesService_jc.consultarNotas_jc(idPeriodo_jc, {
      id_carrera_jc: idCarrera_jc ? Number(idCarrera_jc) : undefined,
      id_materia_jc: idMateria_jc ? Number(idMateria_jc) : undefined,
    });
  }

  // Matriz dinámica: columnas = cortes del plan, filas = alumnos inscritos
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_CONSULTA_NOTAS_JC)
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

  // Guardar notas — vedado al administrador (solo consulta)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC)
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

  // Cierre del acta: fija definitivas, actualiza el historial académico y
  // emite los certificados de sobresaliente. También vedado al administrador.
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC)
  @Post('cerrar-acta/:idMateria/:idPeriodo')
  async cerrarActa_jc(
    @Param('idMateria', ParseIntPipe) idMateria_jc: number,
    @Param('idPeriodo', ParseIntPipe) idPeriodo_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.calificacionesService_jc.cerrarActa_jc(
      idMateria_jc,
      idPeriodo_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }
}
