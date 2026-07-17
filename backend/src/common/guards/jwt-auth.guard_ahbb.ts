import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard_ahbb implements CanActivate {
  constructor(private readonly jwtService_ahbb: JwtService) {}

  async canActivate(context_ahbb: ExecutionContext): Promise<boolean> {
    const request_ahbb = context_ahbb.switchToHttp().getRequest();
    const authorization_ahbb = request_ahbb.headers.authorization;

    let token_ahbb = '';
    if (authorization_ahbb?.startsWith('Bearer ')) {
      token_ahbb = authorization_ahbb.replace('Bearer ', '').trim();
    } else if (request_ahbb.query?.token) {
      token_ahbb = String(request_ahbb.query.token);
    } else {
      throw new UnauthorizedException('Token JWT requerido.');
    }

    try {
      const payload_ahbb = await this.jwtService_ahbb.verifyAsync(token_ahbb);
      request_ahbb.usuario_ahbb = payload_ahbb;
      return true;
    } catch {
      throw new UnauthorizedException('Token JWT inválido o expirado.');
    }
  }
}
