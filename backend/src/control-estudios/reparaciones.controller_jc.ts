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
import { ReparacionesService_jc } from './reparaciones.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { RolesGuard_ahbb } from '../common/guards/roles.guard_ahbb';
import { RolesDecorator_ahbb } from '../common/decorators/roles.decorator_ahbb';
import { ROLES_JC, ROLES_OPERADORES_NOTAS_JC } from '../common/constantes/roles_jc';
import { RegistrarReparacionDto_jc } from './dto/registrar-reparacion.dto_jc';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Reparaciones por corte.
 *
 * Solo quien carga notas puede registrarlas: PROFESOR y CONTROL_ESTUDIOS.
 * El administrador puede consultarlas (aparecen en la matriz de solo lectura)
 * pero no registrarlas ni eliminarlas.
 */
@Controller('control-estudios/reparaciones')
export class ReparacionesController_jc {
  constructor(private readonly reparacionesService_jc: ReparacionesService_jc) {}

  /** Cortes de un alumno con su nota, su reparación y la nota efectiva. */
  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC, ROLES_JC.ADMIN)
  @Get('inscripcion/:idInscripcion')
  async obtenerPorInscripcion_jc(
    @Param('idInscripcion', ParseIntPipe) idInscripcion_jc: number,
  ) {
    return this.reparacionesService_jc.obtenerPorInscripcion_jc(idInscripcion_jc);
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC)
  @Post()
  async registrar_jc(
    @Body() datos_jc: RegistrarReparacionDto_jc,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.reparacionesService_jc.registrar_jc(
      datos_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb, RolesGuard_ahbb)
  @RolesDecorator_ahbb(...ROLES_OPERADORES_NOTAS_JC)
  @Delete(':id')
  async eliminar_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.reparacionesService_jc.eliminar_jc(
      id_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }
}
