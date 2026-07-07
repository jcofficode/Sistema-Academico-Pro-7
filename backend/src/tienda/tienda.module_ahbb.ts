import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

import { ProductosController_ahbb } from './productos.controller_ahbb';
import { ProductosService_ahbb } from './productos.service_ahbb';
import { CarritoController_ahbb } from './carrito.controller_ahbb';
import { CarritoService_ahbb } from './carrito.service_ahbb';
import { FacturasController_ahbb, FacturasPublicController_ahbb } from './facturas.controller_ahbb';
import { FacturasService_ahbb } from './facturas.service_ahbb';
import { FavoritosController_ahbb } from './favoritos.controller_ahbb';
import { FavoritosService_ahbb } from './favoritos.service_ahbb';

@Module({
  imports: [
    JwtModule.register({
      secret: 'super-secreto-ahbb',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [
    ProductosController_ahbb,
    CarritoController_ahbb,
    FacturasController_ahbb,
    FacturasPublicController_ahbb,
    FavoritosController_ahbb,
  ],
  providers: [
    PrismaService,
    ProductosService_ahbb,
    CarritoService_ahbb,
    FacturasService_ahbb,
    FavoritosService_ahbb,
  ],
})
export class TiendaModule_ahbb {}
