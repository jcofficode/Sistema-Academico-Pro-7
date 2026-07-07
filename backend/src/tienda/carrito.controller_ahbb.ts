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
  UseGuards,
} from '@nestjs/common';
import { CarritoService_ahbb } from './carrito.service_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('carrito')
@UseGuards(JwtAuthGuard_ahbb)
export class CarritoController_ahbb {
  constructor(private readonly carritoService_ahbb: CarritoService_ahbb) {}

  @Get()
  async obtenerCarrito_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    return this.carritoService_ahbb.obtenerCarrito_ahbb(Number(req_ahbb.usuario_ahbb?.sub));
  }

  @Post()
  async agregar_ahbb(
    @Req() req_ahbb: RequestConUsuario_ahbb,
    @Body() datos_ahbb: { idProducto: number; cantidad?: number },
  ) {
    return this.carritoService_ahbb.agregarAlCarrito_ahbb(
      Number(req_ahbb.usuario_ahbb?.sub),
      datos_ahbb.idProducto,
      datos_ahbb.cantidad ?? 1,
    );
  }

  @Patch(':id')
  async actualizarCantidad_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
    @Body() datos_ahbb: { cantidad: number },
  ) {
    return this.carritoService_ahbb.actualizarCantidad_ahbb(
      id_ahbb,
      Number(req_ahbb.usuario_ahbb?.sub),
      datos_ahbb.cantidad,
    );
  }

  @Delete(':id')
  async eliminarItem_ahbb(
    @Param('id', ParseIntPipe) id_ahbb: number,
    @Req() req_ahbb: RequestConUsuario_ahbb,
  ) {
    return this.carritoService_ahbb.eliminarItem_ahbb(id_ahbb, Number(req_ahbb.usuario_ahbb?.sub));
  }

  @Delete()
  async vaciarCarrito_ahbb(@Req() req_ahbb: RequestConUsuario_ahbb) {
    return this.carritoService_ahbb.vaciarCarrito_ahbb(Number(req_ahbb.usuario_ahbb?.sub));
  }
}
