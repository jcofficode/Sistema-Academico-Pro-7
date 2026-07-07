import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CrearCursoDto_ahbb } from './dto/crear-curso.dto_ahbb';
import { ActualizarCursoDto_ahbb } from './dto/actualizar-curso.dto_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { JwtOptionalAuthGuard_ahbb } from '../common/guards/jwt-optional-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService_ahbb: CursosService) {}

  @UseGuards(JwtAuthGuard_ahbb)
  @Get('sesiones')
  async obtenerSesiones_ahbb(
    @Req() request_ahbb: RequestConUsuario_ahbb,
    @Query('id_usuario_ahbb') id_usuario_ahbb?: string,
    @Query('rol') rol_ahbb?: string,
    @Query('id_curso_ahbb') id_curso_ahbb?: string,
  ) {
    return this.cursosService_ahbb.obtenerSesiones_ahbb(
      request_ahbb.usuario_ahbb?.rol || 'ALUMNO',
      Number(request_ahbb.usuario_ahbb?.sub),
      rol_ahbb,
      id_usuario_ahbb ? Number(id_usuario_ahbb) : undefined,
      id_curso_ahbb ? Number(id_curso_ahbb) : undefined,
    );
  }

  @UseGuards(JwtOptionalAuthGuard_ahbb)
  @Get()
  async obtenerCursos_ahbb(
    @Req() request_ahbb: RequestConUsuario_ahbb,
    @Query('solo_propios') solo_propios?: string,
    @Query('solo_inscritos') solo_inscritos?: string,
  ) {
    const requiereSesion_ahbb =
      solo_propios === 'true' || solo_inscritos === 'true';

    if (requiereSesion_ahbb && !request_ahbb.usuario_ahbb) {
      throw new UnauthorizedException(
        'Debes iniciar sesion para consultar ese filtro de cursos.',
      );
    }

    return this.cursosService_ahbb.obtenerTodos_ahbb(
      request_ahbb.usuario_ahbb?.rol || 'ALUMNO',
      Number(request_ahbb.usuario_ahbb?.sub),
      solo_propios === 'true',
      solo_inscritos === 'true',
    );
  }

  @Get(':id_curso_ahbb')
  async obtenerCursoPorId_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.cursosService_ahbb.obtenerPorId_ahbb(id_curso_ahbb);
  }

  @Get(':id_curso_ahbb/disponibilidad')
  async obtenerDisponibilidad_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.cursosService_ahbb.obtenerDisponibilidad_ahbb(id_curso_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Post()
  async crearCurso_ahbb(
    @Body() datos_ahbb: CrearCursoDto_ahbb,
    @Req() request_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.cursosService_ahbb.crearCurso_ahbb(
      Number(request_ahbb.usuario_ahbb?.sub),
      datos_ahbb,
      request_ahbb.usuario_ahbb?.rol
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Put(':id_curso_ahbb')
  async actualizarCurso_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
    @Body() datos_ahbb: ActualizarCursoDto_ahbb,
    @Req() request_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.cursosService_ahbb.actualizarCurso_ahbb(
      id_curso_ahbb,
      Number(request_ahbb.usuario_ahbb?.sub),
      datos_ahbb,
      request_ahbb.usuario_ahbb?.rol
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Delete(':id_curso_ahbb')
  async eliminarCurso_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
  ) {
    return this.cursosService_ahbb.eliminarCurso_ahbb(id_curso_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id_curso_ahbb/evaluar-curso')
  async evaluarCurso_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
    @Body() datos: { estado: string, motivo?: string }
  ) {
    return this.cursosService_ahbb.evaluarCurso_ahbb(id_curso_ahbb, datos);
  }

  // ── Imagen de fondo del certificado por curso ──────────────
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR')
  @Patch(':id_curso_ahbb/imagen-certificado')
  async actualizarImagenCertificadoCurso_ahbb(
    @Param('id_curso_ahbb', ParseIntPipe) id_curso_ahbb: number,
    @Body() datos: { imagenBase64: string | null },
    @Req() request_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.cursosService_ahbb.actualizarImagenCertificadoCurso_ahbb(
      id_curso_ahbb,
      datos.imagenBase64,
      Number(request_ahbb.usuario_ahbb?.sub),
      request_ahbb.usuario_ahbb?.rol ?? 'PROFESOR',
    );
  }
}
