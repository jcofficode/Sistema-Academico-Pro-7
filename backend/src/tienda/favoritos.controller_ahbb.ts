import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritosService_ahbb } from './favoritos.service_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('favoritos')
@UseGuards(JwtAuthGuard_ahbb)
export class FavoritosController_ahbb {
  constructor(private readonly favoritosService_ahbb: FavoritosService_ahbb) {}

  @Get()
  async obtenerFavoritos_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    return this.favoritosService_ahbb.obtenerFavoritos_ahbb(Number(req_ahbb.usuario_ahbb?.sub));
  }

  // Solo IDs (útil para marcar corazones en el catálogo)
  @Get('ids')
  async obtenerIds_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    return this.favoritosService_ahbb.obtenerIdsFavoritos_ahbb(Number(req_ahbb.usuario_ahbb?.sub));
  }

  // Toggle: agregar o quitar
  @Post(':idProducto')
  async toggleFavorito_ahbb(
    @Param('idProducto', ParseIntPipe) idProducto_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.favoritosService_ahbb.toggleFavorito_ahbb(Number(req_ahbb.usuario_ahbb?.sub), idProducto_ahbb);
  }

  @Delete(':idProducto')
  async eliminar_ahbb(
    @Param('idProducto', ParseIntPipe) idProducto_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.favoritosService_ahbb.eliminarFavorito_ahbb(Number(req_ahbb.usuario_ahbb?.sub), idProducto_ahbb);
  }
}
