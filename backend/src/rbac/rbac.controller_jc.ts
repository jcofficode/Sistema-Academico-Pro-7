import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RbacService_jc } from './rbac.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ROLES_JC } from '../common/constantes/roles_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';
import {
  AsignarRolDto_jc,
  CambiarEstadoCuentaDto_jc,
  CrearUsuarioRbacDto_jc,
  RestablecerContrasenaDto_jc,
} from './dto/crear-usuario-rbac.dto_jc';

/**
 * Consola de Roles y Accesos (RBAC) — exclusiva del administrador.
 * Toda la clase queda protegida con los mismos guards: no hay ningún endpoint
 * de este controlador accesible a otros roles.
 */
@UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
@RolesDecorator_ahbb(ROLES_JC.ADMIN)
@Controller('rbac')
export class RbacController_jc {
  constructor(private readonly rbacService_jc: RbacService_jc) {}

  /** Catálogo de roles y matriz de permisos del sistema. */
  @Get('roles')
  catalogo_jc() {
    return this.rbacService_jc.catalogo_jc();
  }

  @Get('usuarios')
  async listarUsuarios_jc(@Query() filtros_jc: any) {
    return this.rbacService_jc.listarUsuarios_jc(filtros_jc);
  }

  @Post('usuarios')
  async crearUsuario_jc(
    @Body() datos_jc: CrearUsuarioRbacDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.rbacService_jc.crearUsuario_jc(
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @Patch('usuarios/:id/rol')
  async asignarRol_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Body() datos_jc: AsignarRolDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.rbacService_jc.asignarRol_jc(
      id_jc,
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @Patch('usuarios/:id/contrasena')
  async restablecerContrasena_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Body() datos_jc: RestablecerContrasenaDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.rbacService_jc.restablecerContrasena_jc(
      id_jc,
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @Patch('usuarios/:id/estado')
  async cambiarEstado_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Body() datos_jc: CambiarEstadoCuentaDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.rbacService_jc.cambiarEstado_jc(
      id_jc,
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }
}
