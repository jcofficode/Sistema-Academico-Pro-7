import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** Tipos de notificación admitidos por la bandeja interna. */
export const TIPOS_NOTIFICACION_JC = {
  FELICITACION: 'FELICITACION',
  INFORMATIVA: 'INFORMATIVA',
  ADVERTENCIA: 'ADVERTENCIA',
} as const;

/**
 * NotificacionesService_jc — Bandeja de avisos del usuario.
 *
 * Nació para la felicitación del Certificado de Sobresaliente, pero está
 * escrita de forma genérica para que cualquier módulo pueda avisar al alumno
 * sin depender del correo electrónico.
 */
@Injectable()
export class NotificacionesService_jc {
  constructor(private readonly prisma_jc: PrismaService) {}

  /** Crea una notificación para un usuario. */
  async crear_jc(datos_jc: {
    id_usuario_jc: number;
    titulo_jc: string;
    mensaje_jc: string;
    tipo_jc?: string;
    icono_jc?: string;
    enlace_jc?: string;
  }) {
    return this.prisma_jc.td_notificacion_jc.create({
      data: {
        id_usuario_not_jc: datos_jc.id_usuario_jc,
        titulo_jc: datos_jc.titulo_jc,
        mensaje_jc: datos_jc.mensaje_jc,
        tipo_jc: datos_jc.tipo_jc ?? TIPOS_NOTIFICACION_JC.INFORMATIVA,
        icono_jc: datos_jc.icono_jc ?? null,
        enlace_jc: datos_jc.enlace_jc ?? null,
      },
    });
  }

  /** Notificaciones del usuario autenticado, más recientes primero. */
  async obtenerMias_jc(id_usuario_jc: number, soloNoLeidas_jc = false) {
    const [notificaciones_jc, noLeidas_jc] = await Promise.all([
      this.prisma_jc.td_notificacion_jc.findMany({
        where: {
          id_usuario_not_jc: id_usuario_jc,
          ...(soloNoLeidas_jc ? { leida_jc: false } : {}),
        },
        orderBy: { creadoEn_jc: 'desc' },
        take: 50,
      }),
      this.prisma_jc.td_notificacion_jc.count({
        where: { id_usuario_not_jc: id_usuario_jc, leida_jc: false },
      }),
    ]);

    return { noLeidas: noLeidas_jc, notificaciones: notificaciones_jc };
  }

  /**
   * Marca una notificación como leída. Se comprueba la propiedad para que
   * nadie pueda marcar (ni deducir) notificaciones ajenas.
   */
  async marcarLeida_jc(id_notificacion_jc: number, id_usuario_jc: number) {
    const notificacion_jc = await this.prisma_jc.td_notificacion_jc.findFirst({
      where: {
        id_notificacion_jc,
        id_usuario_not_jc: id_usuario_jc,
      },
    });
    if (!notificacion_jc) {
      throw new NotFoundException('Notificación no encontrada.');
    }

    await this.prisma_jc.td_notificacion_jc.update({
      where: { id_notificacion_jc },
      data: { leida_jc: true },
    });

    return { exito: true };
  }

  /** Marca todas las notificaciones del usuario como leídas. */
  async marcarTodasLeidas_jc(id_usuario_jc: number) {
    const resultado_jc = await this.prisma_jc.td_notificacion_jc.updateMany({
      where: { id_usuario_not_jc: id_usuario_jc, leida_jc: false },
      data: { leida_jc: true },
    });
    return { exito: true, actualizadas: resultado_jc.count };
  }
}
