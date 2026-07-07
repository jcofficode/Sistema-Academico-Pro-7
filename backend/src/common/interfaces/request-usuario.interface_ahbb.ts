import type { Request } from 'express';

export interface RequestConUsuario_ahbb extends Request {
  usuario_ahbb?: {
    sub: number;
    correo: string;
    rol: string;
  };
}
