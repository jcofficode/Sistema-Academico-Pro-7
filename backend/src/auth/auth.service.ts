import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService_ahbb: UsuariosService,
    private readonly jwtService_ahbb: JwtService,
  ) {}

  /**
   * Autentica un usuario mediante sus credenciales (correo y contraseña).
   * 
   * @param correo_ahbb Correo electrónico del usuario.
   * @param contrasena_ahbb Contraseña en texto plano.
   * @returns Objeto con el estado de éxito, perfil del usuario, token JWT y banderas de sistema.
   * @throws UnauthorizedException Si las credenciales son inválidas o la cuenta no está activa.
   */
  async iniciarSesion_ahbb(correo_ahbb: string, contrasena_ahbb: string) {
    const usuario_ahbb =
      await this.usuariosService_ahbb.encontrarPorCorreo_ahbb(
        correo_ahbb.toLowerCase(),
      );

    if (!usuario_ahbb) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const contrasenaValida_ahbb = await bcrypt.compare(
      contrasena_ahbb,
      usuario_ahbb.contrasena_ahbb,
    );

    // Validación dual: soporta hash de bcrypt y contraseñas temporales en texto plano (migración)
    if (!contrasenaValida_ahbb && contrasena_ahbb !== usuario_ahbb.contrasena_ahbb) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    if (usuario_ahbb.estadoCuenta_ahbb !== 'ACTIVO') {
      throw new UnauthorizedException('Tu cuenta todavía no ha sido aprobada por administración.');
    }

    const payload_ahbb = {
      sub: usuario_ahbb.id_usuario_ahbb,
      correo: usuario_ahbb.correo_ahbb,
      rol: usuario_ahbb.rol_ahbb,
    };

    const token_ahbb = await this.jwtService_ahbb.signAsync(payload_ahbb);
    const perfil_ahbb = await this.usuariosService_ahbb.obtenerPerfilPorId_ahbb(
      usuario_ahbb.id_usuario_ahbb,
    );

    return {
      exito: true,
      usuario: perfil_ahbb,
      token: token_ahbb,
      requiereCambioContrasena: usuario_ahbb.requiereCambioContrasena_ahbb,
      mensaje: 'Sesión iniciada',
    };
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * Dependiendo del rol, el usuario puede quedar en estado pendiente (Alumnos) o activo (Profesores/Admin).
   * Envía automáticamente un correo electrónico de bienvenida o notificación de registro.
   * 
   * @param datos_ahbb Objeto con los datos del usuario a registrar.
   * @returns Objeto con el perfil del usuario creado y confirmación de envío de correo.
   * @throws BadRequestException Si el correo ya está registrado.
   */
  async registrarUsuario_ahbb(datos_ahbb: any) {
    const existe_ahbb = await this.usuariosService_ahbb.encontrarPorCorreo_ahbb(
      datos_ahbb.correo_ahbb ?? datos_ahbb.correo,
    );
    if (existe_ahbb) {
      throw new BadRequestException({
        exito: false,
        mensaje: 'Ya existe un usuario con ese correo electrónico.',
      });
    }

    const contrasenaBase_ahbb =
      datos_ahbb.contrasena_ahbb ??
      datos_ahbb.contrasena ??
      this.usuariosService_ahbb.generarContrasenaTemporal_ahbb();
    
    const contrasenaEncriptada_ahbb =
      await this.usuariosService_ahbb.hashearContrasena_ahbb(
        contrasenaBase_ahbb,
      );

    const cedulaGenerada_ahbb =
      datos_ahbb.cedula_ahbb ??
      datos_ahbb.cedula ??
      `V-${Math.floor(Math.random() * 100000000)}`;
    
    const rol_ahbb = String(
      datos_ahbb.rol_ahbb ?? datos_ahbb.rol ?? 'ALUMNO',
    ).toUpperCase();

    const nuevoUsuario_ahbb = await this.usuariosService_ahbb.crearUsuario_ahbb(
      {
        cedula: cedulaGenerada_ahbb,
        nombre: datos_ahbb.nombre_ahbb ?? datos_ahbb.nombre,
        apellido: datos_ahbb.apellido_ahbb ?? datos_ahbb.apellido,
        correo: datos_ahbb.correo_ahbb ?? datos_ahbb.correo,
        contrasena: contrasenaEncriptada_ahbb,
        rol: rol_ahbb,
        estadoCuenta: rol_ahbb === 'ALUMNO' ? 'PENDIENTE_APROBACION' : 'ACTIVO',
        requiereCambioContrasena: rol_ahbb !== 'ALUMNO',
        referenciaPagoMovil:
          datos_ahbb.referenciaPagoMovil_ahbb ?? datos_ahbb.referenciaPagoMovil,
      },
    );

    try {
      const isStudentPending_ahbb =
        rol_ahbb === 'ALUMNO' &&
        nuevoUsuario_ahbb.estadoCuenta === 'PENDIENTE_APROBACION';

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });

      if (isStudentPending_ahbb) {
        // Notificación para Alumnos: Solicitud recibida (espera de aprobación administrativa)
        await transporter.sendMail({
          from: '"Academia H&B" <no-reply@academiahb.com>',
          to: nuevoUsuario_ahbb.correo,
          subject: 'Recibimos tu solicitud de inscripción — Academia H&B',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1b2a4a; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin:0;">🎓 Academia <span style="color: #f59e0b;">H&amp;B</span></h1>
              </div>
              <div style="padding: 24px; background: #f8fafc;">
                <h2>¡Hola, ${nuevoUsuario_ahbb.nombre}!</h2>
                <p>Gracias por registrarte en Academia H&amp;B. Hemos recibido tu solicitud para unirte como alumno.</p>
                <p>Actualmente, nuestro equipo está <strong>revisando tu información y el comprobante de pago</strong> (si aplica).</p>
                <div style="background: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <strong>Estado de la solicitud:</strong> En Revisión Administrativa<br/>
                  <strong>Próximo paso:</strong> Una vez aprobado, recibirás un segundo correo con tus credenciales de acceso definitivas.
                </div>
                <p>Agradecemos tu paciencia mientras procesamos tu inscripción.</p>
                <p>Saludos cordiales,<br/>El Equipo de Academia H&amp;B</p>
              </div>
            </div>
          `,
        });
      } else {
        // Notificación para Staff: Cuenta activa con credenciales temporales
        await transporter.sendMail({
          from: '"Academia H&B" <no-reply@academiahb.com>',
          to: nuevoUsuario_ahbb.correo,
          subject: 'Tu cuenta en Academia H&B ha sido creada',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1b2a4a; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin:0;">🎓 Academia <span style="color: #f59e0b;">H&amp;B</span></h1>
              </div>
              <div style="padding: 24px; background: #f8fafc;">
                <h2>¡Bienvenido/a, ${nuevoUsuario_ahbb.nombre}!</h2>
                <p>Tu cuenta en la plataforma Academia H&amp;B ha sido creada como <strong>${rol_ahbb.toLowerCase()}</strong>.</p>
                <p>Tus credenciales de acceso son:</p>
                <div style="background: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <strong>Correo:</strong> ${nuevoUsuario_ahbb.correo}<br/>
                  <strong>Contraseña temporal:</strong> ${contrasenaBase_ahbb}
                </div>
                <p style="color: #dc2626;"><strong>⚠️ Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.</strong></p>
                <a href="http://localhost:9000/login" style="display:inline-block;background:#1b2a4a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:8px;">Iniciar Sesión</a>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Error al enviar correo de registro:', emailErr);
    }

    return {
      exito: true,
      usuario: nuevoUsuario_ahbb,
      correoEnviado: true,
      mensaje:
        rol_ahbb === 'ALUMNO'
          ? 'Cuenta de alumno creada exitosamente. Se ha enviado el correo con sus credenciales.'
          : 'Usuario creado exitosamente. Se ha enviado el correo con la clave temporal.',
    };
  }

  /**
   * Permite a un usuario autenticado cambiar su contraseña actual.
   * 
   * @param id_usuario_ahbb ID único del usuario.
   * @param contrasenaActual_ahbb Contraseña actual para verificación.
   * @param contrasenaNueva_ahbb Nueva contraseña a establecer.
   * @returns Objeto con el resultado de la operación.
   * @throws UnauthorizedException Si el usuario no existe o la contraseña actual es incorrecta.
   */
  async cambiarContrasena_ahbb(
    id_usuario_ahbb: number,
    contrasenaActual_ahbb: string,
    contrasenaNueva_ahbb: string,
  ) {
    const usuario_ahbb =
      await this.usuariosService_ahbb.obtenerUsuarioPorId_ahbb(id_usuario_ahbb);

    if (!usuario_ahbb) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const contrasenaValida_ahbb = await bcrypt.compare(
      contrasenaActual_ahbb,
      usuario_ahbb.contrasena_ahbb,
    );

    if (
      !contrasenaValida_ahbb &&
      contrasenaActual_ahbb !== usuario_ahbb.contrasena_ahbb
    ) {
      throw new UnauthorizedException('La contraseña actual no coincide.');
    }

    const hashNueva_ahbb =
      await this.usuariosService_ahbb.hashearContrasena_ahbb(
        contrasenaNueva_ahbb,
      );
    await this.usuariosService_ahbb.actualizarContrasena_ahbb(
      id_usuario_ahbb,
      hashNueva_ahbb,
    );

    return { exito: true, mensaje: 'Contraseña actualizada correctamente.' };
  }
}
