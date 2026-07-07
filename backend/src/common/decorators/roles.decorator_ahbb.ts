import { SetMetadata } from '@nestjs/common';

export const ROLES_META_AHBB = 'roles_ahbb';

export const RolesDecorator_ahbb = (...rolesPermitidos_ahbb: string[]) =>
  SetMetadata(ROLES_META_AHBB, rolesPermitidos_ahbb);
