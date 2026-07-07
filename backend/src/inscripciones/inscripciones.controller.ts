import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InscripcionesService_ahbb } from './inscripciones.service';
import { CrearInscripcionDto_ahbb } from './dto/crear-inscripcion.dto_ahbb';
import { ActualizarEstadoInscripcionDto_ahbb } from './dto/actualizar-estado-inscripcion.dto_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';

@Controller('inscripciones')
export class InscripcionesController_ahbb {
  constructor(
    private readonly inscripcionesService_ahbb: InscripcionesService_ahbb,
  ) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get()
  async obtenerInscripciones_ahbb() {
    return this.inscripcionesService_ahbb.obtenerTodas_ahbb();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO', 'ADMIN')
  @Post()
  async crearInscripcion_ahbb(@Body() datos_ahbb: CrearInscripcionDto_ahbb) {
    return this.inscripcionesService_ahbb.crearInscripcion_ahbb(datos_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO', 'ADMIN', 'PROFESOR')
  @Get('historial/:id_usuario_ahbb')
  async obtenerHistorialAlumno_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
  ) {
    return this.inscripcionesService_ahbb.obtenerHistorialAlumno_ahbb(
      id_usuario_ahbb,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('curso/:id_curso_ahbb')
  async obtenerPorCurso_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.inscripcionesService_ahbb.obtenerPorCurso_ahbb(id_curso_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Get('profesor/:id_profesor')
  async obtenerAlumnosPorProfesor_ahbb(
    @Param('id_profesor', ParseIntPipe) id_profesor: number,
  ) {
    return this.inscripcionesService_ahbb.obtenerAlumnosPorProfesor_ahbb(
      id_profesor,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Patch(':id_inscripcion_ahbb/estado')
  async actualizarEstado_ahbb(
    @Param('id_inscripcion_ahbb', ParseIntPipe) id_inscripcion_ahbb: number,
    @Body() datos_ahbb: ActualizarEstadoInscripcionDto_ahbb,
  ) {
    return this.inscripcionesService_ahbb.actualizarEstado_ahbb(
      id_inscripcion_ahbb,
      datos_ahbb,
    );
  }
}
