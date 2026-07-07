import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { CargaMasivaUsuariosDto_ahbb } from './dto/carga-masiva-usuarios.dto_ahbb';
import { AprobarAlumnoDto_ahbb } from './dto/aprobar-alumno.dto_ahbb';
import { GuardarFirmaDto_ahbb } from './dto/guardar-firma.dto_ahbb';
import * as bcrypt from 'bcrypt';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';
import { ActualizarUsuarioDto_ahbb } from './dto/actualizar-usuario.dto_ahbb';
import { ActualizarEstadoUsuarioDto_ahbb } from './dto/actualizar-estado-usuario.dto_ahbb';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService_ahbb: UsuariosService) {}

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get()
  async obtenerUsuarios_ahbb(@Query('rol') rol_ahbb?: string) {
    return this.usuariosService_ahbb.obtenerTodos_ahbb(rol_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('profesores')
  async obtenerProfesoresParaSelect_ahbb() {
    return this.usuariosService_ahbb.obtenerTodos_ahbb('PROFESOR');
  }

  // Endpoint para obtener todos los alumnos con estados de suscripción
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('alumnos-suscripciones')
  async obtenerAlumnosSuscripciones_ahbb() {
    return this.usuariosService_ahbb.obtenerAlumnosPendientes_ahbb();
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR')
  @Get('mis-alumnos')
  async obtenerMisAlumnos_ahbb(@Req() request_ahbb: RequestConUsuario_ahbb) {
    return this.usuariosService_ahbb.obtenerAlumnosPorProfesor_ahbb(
      Number(request_ahbb.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Get(':id_usuario_ahbb')
  async obtenerUsuarioPorId_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
  ) {
    return this.usuariosService_ahbb.obtenerPerfilPorId_ahbb(id_usuario_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('carga-masiva/validar')
  async validarCargaMasiva_ahbb(
    @Body() datos_ahbb: CargaMasivaUsuariosDto_ahbb,
  ) {
    return this.usuariosService_ahbb.validarCargaMasivaUsuarios_ahbb(
      datos_ahbb.usuarios_ahbb,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('carga-masiva/confirmar')
  async confirmarCargaMasiva_ahbb(
    @Body() datos_ahbb: CargaMasivaUsuariosDto_ahbb,
  ) {
    return this.usuariosService_ahbb.crearUsuariosMasivos_ahbb(
      datos_ahbb.usuarios_ahbb,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('carga-masiva/profesores-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importarProfesoresExcel_ahbb(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    return this.usuariosService_ahbb.importarProfesoresDesdeExcel_ahbb(file.buffer);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Get('carga-masiva/exportar-profesores')
  async exportarProfesoresExcel_ahbb(@Res() res: Response) {
    const buffer = await this.usuariosService_ahbb.exportarProfesoresExcel_ahbb();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=Listado_Profesores.xlsx',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('aprobar-alumno')
  async aprobarAlumno_ahbb(
    @Body() datos_ahbb: AprobarAlumnoDto_ahbb,
    @Req() request_ahbb: RequestConUsuario_ahbb,
  ) {
    const usuario_ahbb = await this.usuariosService_ahbb.aprobarAlumno_ahbb(
      datos_ahbb.id_usuario_ahbb,
      Number(request_ahbb.usuario_ahbb?.sub),
      datos_ahbb.referenciaPagoMovil_ahbb,
    );

    return {
      exito: true,
      usuario: usuario_ahbb,
      mensaje: 'Alumno aprobado. Se enviaron sus credenciales por correo.',
    };
  }

  // Aprobación masiva de alumnos pendientes
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Post('aprobar-alumnos-masivo')
  async aprobarAlumnosMasivo_ahbb(
    @Body() datos_ahbb: { ids: number[] },
    @Req() request_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.usuariosService_ahbb.aprobarAlumnosMasivo_ahbb(
      datos_ahbb.ids,
      Number(request_ahbb.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('PROFESOR', 'ADMIN')
  @Post(':id_usuario_ahbb/firma-digital')
  async guardarFirmaDigital_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
    @Body() datos_ahbb: GuardarFirmaDto_ahbb,
  ) {
    return this.usuariosService_ahbb.guardarFirmaDigital_ahbb(
      id_usuario_ahbb,
      datos_ahbb.imagenBase64_ahbb,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN', 'PROFESOR', 'ALUMNO')
  @Patch(':id_usuario_ahbb')
  async actualizarUsuario_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
    @Body() datos_ahbb: ActualizarUsuarioDto_ahbb,
  ) {
    return this.usuariosService_ahbb.actualizarPerfil_ahbb(
      id_usuario_ahbb,
      datos_ahbb,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Patch(':id_usuario_ahbb/estado')
  async actualizarEstadoUsuario_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
    @Body() datos_ahbb: ActualizarEstadoUsuarioDto_ahbb,
  ) {
    return this.usuariosService_ahbb.actualizarEstadoCuenta_ahbb(
      id_usuario_ahbb,
      datos_ahbb.estadoCuenta_ahbb ?? (datos_ahbb as any).estado,
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb('ADMIN')
  @Delete(':id_usuario_ahbb')
  async eliminarUsuario_ahbb(
    @Param('id_usuario_ahbb', ParseIntPipe) id_usuario_ahbb: number,
  ) {
    return this.usuariosService_ahbb.eliminarUsuario_ahbb(id_usuario_ahbb);
  }
}
