import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuditoriaService_jc } from '../auditoria/auditoria.service_jc';
import {
  ACCIONES_JC,
  MODULOS_AUDITORIA_JC,
} from '../auditoria/constantes/acciones-auditoria_jc';
import {
  CATALOGO_ROLES_JC,
  MATRIZ_PERMISOS_JC,
  ROLES_JC,
  normalizarRol_jc,
} from '../common/constantes/roles_jc';
import {
  AsignarRolDto_jc,
  CambiarEstadoCuentaDto_jc,
  CrearUsuarioRbacDto_jc,
  RestablecerContrasenaDto_jc,
} from './dto/crear-usuario-rbac.dto_jc';

/**
 * RbacService_jc — Control de acceso basado en roles (Role-Based Access Control).
 *
 * Concentra la administración de identidades: crear usuarios con su contraseña
 * y su rol, reasignar roles, restablecer contraseñas y activar o desactivar
 * cuentas. Cada operación deja rastro en la bitácora de auditoría indicando
 * quién la ejecutó y sobre quién.
 */
@Injectable()
export class RbacService_jc {
  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly usuariosService_jc: UsuariosService,
    private readonly auditoriaService_jc: AuditoriaService_jc,
  ) {}

  /** Catálogo de roles y matriz de permisos que se pinta en la consola. */
  catalogo_jc() {
    return { roles: CATALOGO_ROLES_JC, permisos: MATRIZ_PERMISOS_JC };
  }

  /** Listado de usuarios con filtros de rol, estado y búsqueda libre. */
  async listarUsuarios_jc(filtros_jc: {
    rol_jc?: string;
    estado_jc?: string;
    busqueda_jc?: string;
  }) {
    const where_jc: any = {};

    if (filtros_jc.rol_jc) {
      where_jc.rol_ahbb = normalizarRol_jc(filtros_jc.rol_jc);
    }
    if (filtros_jc.estado_jc) {
      where_jc.estadoCuenta_ahbb = filtros_jc.estado_jc.toUpperCase();
    }
    if (filtros_jc.busqueda_jc) {
      where_jc.OR = ['nombre_ahbb', 'apellido_ahbb', 'correo_ahbb', 'cedula_ahbb'].map(
        (campo_jc) => ({
          [campo_jc]: { contains: filtros_jc.busqueda_jc, mode: 'insensitive' },
        }),
      );
    }

    const [usuarios_jc, conteos_jc] = await Promise.all([
      this.prisma_jc.td_usuario_ahbb.findMany({
        where: where_jc,
        orderBy: [{ rol_ahbb: 'asc' }, { apellido_ahbb: 'asc' }],
        select: {
          id_usuario_ahbb: true,
          cedula_ahbb: true,
          nombre_ahbb: true,
          apellido_ahbb: true,
          correo_ahbb: true,
          rol_ahbb: true,
          estadoCuenta_ahbb: true,
          requiereCambioContrasena_ahbb: true,
          creadoEn_ahbb: true,
        },
      }),
      this.prisma_jc.td_usuario_ahbb.groupBy({
        by: ['rol_ahbb'],
        _count: { rol_ahbb: true },
      }),
    ]);

    return {
      total: usuarios_jc.length,
      porRol: CATALOGO_ROLES_JC.map((rol_jc) => ({
        ...rol_jc,
        total:
          conteos_jc.find((conteo_jc) => conteo_jc.rol_ahbb === rol_jc.valor)?._count
            .rol_ahbb ?? 0,
      })),
      usuarios: usuarios_jc,
    };
  }

  /** Crea un usuario con contraseña y rol definidos por el administrador. */
  async crearUsuario_jc(datos_jc: CrearUsuarioRbacDto_jc, idAdministrador_jc: number) {
    const correo_jc = datos_jc.correo_jc.trim().toLowerCase();
    const cedula_jc = datos_jc.cedula_jc.trim();

    const duplicado_jc = await this.prisma_jc.td_usuario_ahbb.findFirst({
      where: { OR: [{ correo_ahbb: correo_jc }, { cedula_ahbb: cedula_jc }] },
      select: { correo_ahbb: true, cedula_ahbb: true },
    });
    if (duplicado_jc) {
      throw new BadRequestException(
        duplicado_jc.correo_ahbb === correo_jc
          ? 'Ya existe un usuario con ese correo.'
          : 'Ya existe un usuario con esa cédula.',
      );
    }

    const rol_jc = normalizarRol_jc(datos_jc.rol_jc);
    const hash_jc = await this.usuariosService_jc.hashearContrasena_ahbb(
      datos_jc.contrasena_jc,
    );

    const usuario_jc = await this.usuariosService_jc.crearUsuario_ahbb({
      cedula: cedula_jc,
      nombre: datos_jc.nombre_jc.trim(),
      apellido: datos_jc.apellido_jc.trim(),
      correo: correo_jc,
      contrasena: hash_jc,
      rol: rol_jc,
      // El administrador crea cuentas ya operativas: no pasan por aprobación
      estadoCuenta: 'ACTIVO',
      requiereCambioContrasena: datos_jc.requiereCambioContrasena_jc ?? false,
    });

    await this.auditoriaService_jc.registrarConAutor_jc(idAdministrador_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.USUARIOS,
      accion_jc: ACCIONES_JC.USUARIO_CREADO,
      descripcion_jc: `creó el usuario ${usuario_jc.nombre} ${usuario_jc.apellido} (${usuario_jc.correo}) con rol ${this.etiquetaRol_jc(rol_jc)}`,
      id_afectado_jc: usuario_jc.id,
      entidad_jc: 'td_usuario_ahbb',
      id_entidad_jc: usuario_jc.id,
      detalle_jc: { rol: rol_jc, cedula: cedula_jc },
    });

    return {
      exito: true,
      usuario: usuario_jc,
      mensaje: `Usuario ${usuario_jc.nombre} ${usuario_jc.apellido} creado con rol ${this.etiquetaRol_jc(rol_jc)}.`,
    };
  }

  /** Reasigna el rol de un usuario existente. */
  async asignarRol_jc(
    id_usuario_jc: number,
    datos_jc: AsignarRolDto_jc,
    idAdministrador_jc: number,
  ) {
    const usuario_jc = await this.obtenerUsuario_jc(id_usuario_jc);
    const rolNuevo_jc = normalizarRol_jc(datos_jc.rol_jc);

    if (usuario_jc.rol_ahbb === rolNuevo_jc) {
      throw new BadRequestException('El usuario ya tiene ese rol asignado.');
    }

    // Salvaguarda: el sistema no puede quedarse sin administradores
    if (usuario_jc.rol_ahbb === ROLES_JC.ADMIN && rolNuevo_jc !== ROLES_JC.ADMIN) {
      const administradores_jc = await this.prisma_jc.td_usuario_ahbb.count({
        where: { rol_ahbb: ROLES_JC.ADMIN },
      });
      if (administradores_jc <= 1) {
        throw new ForbiddenException(
          'No se puede quitar el rol al último administrador del sistema.',
        );
      }
    }

    await this.prisma_jc.td_usuario_ahbb.update({
      where: { id_usuario_ahbb: id_usuario_jc },
      data: { rol_ahbb: rolNuevo_jc, actualizadoEn_ahbb: new Date() },
    });

    await this.auditoriaService_jc.registrarConAutor_jc(idAdministrador_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.USUARIOS,
      accion_jc: ACCIONES_JC.ROL_ASIGNADO,
      descripcion_jc: `cambió el rol de ${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb} de ${this.etiquetaRol_jc(usuario_jc.rol_ahbb)} a ${this.etiquetaRol_jc(rolNuevo_jc)}`,
      id_afectado_jc: id_usuario_jc,
      entidad_jc: 'td_usuario_ahbb',
      id_entidad_jc: id_usuario_jc,
      detalle_jc: { rolAnterior: usuario_jc.rol_ahbb, rolNuevo: rolNuevo_jc },
    });

    return {
      exito: true,
      mensaje: `${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb} ahora tiene el rol ${this.etiquetaRol_jc(rolNuevo_jc)}.`,
    };
  }

  /** Restablece la contraseña de un usuario (nunca se registra en claro). */
  async restablecerContrasena_jc(
    id_usuario_jc: number,
    datos_jc: RestablecerContrasenaDto_jc,
    idAdministrador_jc: number,
  ) {
    const usuario_jc = await this.obtenerUsuario_jc(id_usuario_jc);
    const hash_jc = await this.usuariosService_jc.hashearContrasena_ahbb(
      datos_jc.contrasena_jc,
    );

    await this.prisma_jc.td_usuario_ahbb.update({
      where: { id_usuario_ahbb: id_usuario_jc },
      data: {
        contrasena_ahbb: hash_jc,
        requiereCambioContrasena_ahbb:
          datos_jc.requiereCambioContrasena_jc ?? true,
        actualizadoEn_ahbb: new Date(),
      },
    });

    await this.auditoriaService_jc.registrarConAutor_jc(idAdministrador_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.SEGURIDAD,
      accion_jc: ACCIONES_JC.CONTRASENA_RESTABLECIDA,
      descripcion_jc: `restableció la contraseña de ${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb}`,
      id_afectado_jc: id_usuario_jc,
      entidad_jc: 'td_usuario_ahbb',
      id_entidad_jc: id_usuario_jc,
    });

    return {
      exito: true,
      mensaje: `Contraseña de ${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb} restablecida.`,
    };
  }

  /** Activa o desactiva una cuenta. */
  async cambiarEstado_jc(
    id_usuario_jc: number,
    datos_jc: CambiarEstadoCuentaDto_jc,
    idAdministrador_jc: number,
  ) {
    const usuario_jc = await this.obtenerUsuario_jc(id_usuario_jc);
    const estado_jc = datos_jc.estadoCuenta_jc.toUpperCase();

    await this.prisma_jc.td_usuario_ahbb.update({
      where: { id_usuario_ahbb: id_usuario_jc },
      data: { estadoCuenta_ahbb: estado_jc, actualizadoEn_ahbb: new Date() },
    });

    await this.auditoriaService_jc.registrarConAutor_jc(idAdministrador_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.USUARIOS,
      accion_jc: ACCIONES_JC.USUARIO_ESTADO_CAMBIADO,
      descripcion_jc: `cambió el estado de la cuenta de ${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb} a ${estado_jc}`,
      id_afectado_jc: id_usuario_jc,
      entidad_jc: 'td_usuario_ahbb',
      id_entidad_jc: id_usuario_jc,
      detalle_jc: {
        estadoAnterior: usuario_jc.estadoCuenta_ahbb,
        estadoNuevo: estado_jc,
      },
    });

    return { exito: true, mensaje: `Cuenta marcada como ${estado_jc}.` };
  }

  // ── Auxiliares ────────────────────────────────────────────────

  private async obtenerUsuario_jc(id_usuario_jc: number) {
    const usuario_jc = await this.prisma_jc.td_usuario_ahbb.findUnique({
      where: { id_usuario_ahbb: id_usuario_jc },
    });
    if (!usuario_jc) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return usuario_jc;
  }

  private etiquetaRol_jc(rol_jc?: string | null) {
    return (
      CATALOGO_ROLES_JC.find((entrada_jc) => entrada_jc.valor === rol_jc)?.etiqueta ??
      String(rol_jc ?? 'sin rol')
    );
  }
}
