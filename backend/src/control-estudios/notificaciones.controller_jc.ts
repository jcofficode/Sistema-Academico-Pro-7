import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificacionesService_jc } from './notificaciones.service_jc';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

/**
 * Bandeja de notificaciones del usuario autenticado.
 *
 * No lleva guard de roles a propósito: cualquier usuario con sesión tiene su
 * bandeja. La identidad sale siempre del token, nunca de la URL, así que nadie
 * puede leer ni marcar notificaciones ajenas.
 */
@UseGuards(JwtAuthGuard_ahbb)
@Controller('control-estudios/notificaciones')
export class NotificacionesController_jc {
  constructor(
    private readonly notificacionesService_jc: NotificacionesService_jc,
  ) {}

  @Get('mis-notificaciones')
  async obtenerMias_jc(
    @Req() request_jc: RequestConUsuario_ahbb,
    @Query('soloNoLeidas') soloNoLeidas_jc?: string,
  ) {
    return this.notificacionesService_jc.obtenerMias_jc(
      Number(request_jc.usuario_ahbb?.sub),
      soloNoLeidas_jc === 'true',
    );
  }

  @Patch(':id/leer')
  async marcarLeida_jc(
    @Param('id', ParseIntPipe) id_jc: number,
    @Req() request_jc: RequestConUsuario_ahbb,
  ) {
    return this.notificacionesService_jc.marcarLeida_jc(
      id_jc,
      Number(request_jc.usuario_ahbb?.sub),
    );
  }

  @Patch('leer-todas')
  async marcarTodasLeidas_jc(@Req() request_jc: RequestConUsuario_ahbb) {
    return this.notificacionesService_jc.marcarTodasLeidas_jc(
      Number(request_jc.usuario_ahbb?.sub),
    );
  }
}
