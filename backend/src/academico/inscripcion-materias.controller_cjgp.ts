import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InscripcionMateriasService_cjgp } from './inscripcion-materias.service_cjgp';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { InscribirMateriasDto_cjgp } from './dto/inscribir-materias.dto_cjgp';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Endpoints de la Épica 3: Inscripción sin Fricción para el Estudiante.
 * El alumno solo puede operar sobre su propia inscripción: el ID sale
 * siempre del token JWT, nunca del cuerpo de la petición.
 */
@Controller('academico/inscripcion-materias')
export class InscripcionMateriasController_cjgp {
  constructor(
    private readonly inscripcionService_cjgp: InscripcionMateriasService_cjgp,
  ) {}

  // ── Inscripción en nombre del alumno (ADMINISTRADOR) ──────────
  // El admin ve la misma vitrina que vería el alumno (mismo Motor de Reglas)
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('vitrina-admin/:idUsuario/:idCarrera')
  async obtenerVitrinaAdmin_cjgp(
    @Param('idUsuario', ParseIntPipe) idUsuario_cjgp: number,
    @Param('idCarrera', ParseIntPipe) idCarrera_cjgp: number,
  ) {
    return this.inscripcionService_cjgp.obtenerVitrina_cjgp(
      idUsuario_cjgp,
      idCarrera_cjgp,
    );
  }

  // El Guardián audita igual: el admin tampoco puede saltarse el reglamento
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('admin/:idUsuario/:idCarrera')
  async inscribirAdmin_cjgp(
    @Param('idUsuario', ParseIntPipe) idUsuario_cjgp: number,
    @Param('idCarrera', ParseIntPipe) idCarrera_cjgp: number,
    @Body() datos_cjgp: InscribirMateriasDto_cjgp,
  ) {
    return this.inscripcionService_cjgp.inscribir_cjgp(
      idUsuario_cjgp,
      idCarrera_cjgp,
      datos_cjgp.id_periodo_cjgp,
      datos_cjgp.idsMaterias_cjgp,
    );
  }

  // Vitrina: pensum etiquetado (elegible/bloqueada/inscrita/aprobada) + créditos
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Get('vitrina/:idCarrera')
  async obtenerVitrina_cjgp(
    @Param('idCarrera', ParseIntPipe) idCarrera_cjgp: number,
    @Req() request_cjgp: RequestConUsuario_ahbb,
  ) {
    return this.inscripcionService_cjgp.obtenerVitrina_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
      idCarrera_cjgp,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Post(':idCarrera')
  async inscribir_cjgp(
    @Param('idCarrera', ParseIntPipe) idCarrera_cjgp: number,
    @Body() datos_cjgp: InscribirMateriasDto_cjgp,
    @Req() request_cjgp: RequestConUsuario_ahbb,
  ) {
    return this.inscripcionService_cjgp.inscribir_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
      idCarrera_cjgp,
      datos_cjgp.id_periodo_cjgp,
      datos_cjgp.idsMaterias_cjgp,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Get('historial')
  async obtenerHistorial_cjgp(@Req() request_cjgp: RequestConUsuario_ahbb) {
    return this.inscripcionService_cjgp.obtenerHistorial_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ALUMNO')
  @Delete(':idInscripcion')
  async retirar_cjgp(
    @Param('idInscripcion', ParseIntPipe) idInscripcion_cjgp: number,
    @Req() request_cjgp: RequestConUsuario_ahbb,
  ) {
    return this.inscripcionService_cjgp.retirar_cjgp(
      Number(request_cjgp.usuario_ahbb?.sub),
      idInscripcion_cjgp,
    );
  }
}
