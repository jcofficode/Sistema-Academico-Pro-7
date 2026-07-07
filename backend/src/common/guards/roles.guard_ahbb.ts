import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_META_AHBB } from '../decorators/roles.decorator_ahbb';

@Injectable()
export class RolesGuard_ahbb implements CanActivate {
  constructor(private readonly reflector_ahbb: Reflector) {}

  canActivate(context_ahbb: ExecutionContext): boolean {
    const rolesPermitidos_ahbb = this.reflector_ahbb.getAllAndOverride<
      string[]
    >(ROLES_META_AHBB, [context_ahbb.getHandler(), context_ahbb.getClass()]);

    if (!rolesPermitidos_ahbb?.length) {
      return true;
    }

    const request_ahbb = context_ahbb.switchToHttp().getRequest();
    const rolUsuario_ahbb = request_ahbb.usuario_ahbb?.rol;

    if (!rolUsuario_ahbb || !rolesPermitidos_ahbb.includes(rolUsuario_ahbb)) {
      throw new ForbiddenException('No tienes permisos para esta acción.');
    }

    return true;
  }
}
