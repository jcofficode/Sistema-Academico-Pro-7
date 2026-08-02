import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RbacController_jc } from './rbac.controller_jc';
import { RbacService_jc } from './rbac.service_jc';

/**
 * RbacModule_jc — Consola de Roles y Accesos del administrador.
 * Reutiliza `UsuariosService` para el hasheo de contraseñas en lugar de
 * duplicar esa lógica de seguridad.
 */
@Module({
  imports: [UsuariosModule],
  controllers: [RbacController_jc],
  providers: [PrismaService, RbacService_jc],
  exports: [RbacService_jc],
})
export class RbacModule_jc {}
