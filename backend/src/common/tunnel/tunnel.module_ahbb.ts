import { Global, Module } from '@nestjs/common';
import { TunnelService_ahbb } from './tunnel.service_ahbb';

/**
 * TunnelModule_ahbb — Módulo global que provee el servicio de túnel
 * a toda la aplicación sin necesidad de importarlo individualmente.
 */
@Global()
@Module({
  providers: [TunnelService_ahbb],
  exports: [TunnelService_ahbb],
})
export class TunnelModule_ahbb {}
