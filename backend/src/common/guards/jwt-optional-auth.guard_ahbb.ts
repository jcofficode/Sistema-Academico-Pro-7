import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtOptionalAuthGuard_ahbb implements CanActivate {
  constructor(private readonly jwtService_ahbb: JwtService) {}

  async canActivate(context_ahbb: ExecutionContext): Promise<boolean> {
    const request_ahbb = context_ahbb.switchToHttp().getRequest();
    const authorization_ahbb = request_ahbb.headers.authorization;

    if (!authorization_ahbb?.startsWith('Bearer ')) {
      return true;
    }

    const token_ahbb = authorization_ahbb.replace('Bearer ', '').trim();
    if (!token_ahbb) {
      return true;
    }

    try {
      const payload_ahbb = await this.jwtService_ahbb.verifyAsync(token_ahbb);
      request_ahbb.usuario_ahbb = payload_ahbb;
    } catch {
      request_ahbb.usuario_ahbb = undefined;
    }

    return true;
  }
}
