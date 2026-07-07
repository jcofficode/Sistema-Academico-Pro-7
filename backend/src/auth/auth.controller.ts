import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IniciarSesionDto_ahbb } from './dto/iniciar-sesion.dto_ahbb';
import { RegistrarUsuarioDto_ahbb } from './dto/registrar-usuario.dto_ahbb';
import { CambiarContrasenaDto_ahbb } from './dto/cambiar-contrasena.dto_ahbb';
import { JwtAuthGuard_ahbb } from '../common/guards/jwt-auth.guard_ahbb';
import { UsuariosService } from '../usuarios/usuarios.service';
import type { RequestConUsuario_ahbb } from '../common/interfaces/request-usuario.interface_ahbb';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService_ahbb: AuthService,
    private readonly usuariosService_ahbb: UsuariosService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('iniciar-sesion')
  async iniciarSesion_ahbb(@Body() datos_ahbb: IniciarSesionDto_ahbb) {
    return this.authService_ahbb.iniciarSesion_ahbb(
      datos_ahbb.correo_ahbb ?? (datos_ahbb as any).correo,
      datos_ahbb.contrasena_ahbb ?? (datos_ahbb as any).contrasena,
    );
  }

  @Post('registrar')
  async registrar_ahbb(@Body() datos_ahbb: RegistrarUsuarioDto_ahbb) {
    return this.authService_ahbb.registrarUsuario_ahbb(datos_ahbb);
  }

  @UseGuards(JwtAuthGuard_ahbb)
  @Get('perfil')
  async obtenerPerfil_ahbb(@Req() request_ahbb: RequestConUsuario_ahbb) {
    return this.usuariosService_ahbb.obtenerPerfilPorId_ahbb(
      Number(request_ahbb.usuario_ahbb?.sub),
    );
  }

  @UseGuards(JwtAuthGuard_ahbb)
  @Post('cambiar-contrasena')
  async cambiarContrasena_ahbb(
    @Req() request_ahbb: RequestConUsuario_ahbb,
    @Body() datos_ahbb: CambiarContrasenaDto_ahbb,
  ) {
    return this.authService_ahbb.cambiarContrasena_ahbb(
      Number(request_ahbb.usuario_ahbb?.sub),
      datos_ahbb.contrasenaActual_ahbb,
      datos_ahbb.contrasenaNueva_ahbb,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('cerrar-sesion')
  async cerrarSesion_ahbb() {
    return { exito: true, mensaje: 'Sesión cerrada exitosamente.' };
  }
}
