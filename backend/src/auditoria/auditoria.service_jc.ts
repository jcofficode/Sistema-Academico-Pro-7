import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ETIQUETAS_ACCION_JC,
  MODULOS_AUDITORIA_JC,
} from './constantes/acciones-auditoria_jc';

/** Datos que puede aportar quien registra un evento en la bitácora. */
export interface EventoAuditoria_jc {
  modulo_jc: string;
  accion_jc: string;
  descripcion_jc: string;
  resultado_jc?: 'EXITO' | 'ERROR';
  id_usuario_auditoria_jc?: number | null;
  nombreUsuario_jc?: string | null;
  rolUsuario_jc?: string | null;
  id_afectado_jc?: number | null;
  id_materia_aud_jc?: number | null;
  id_periodo_aud_jc?: number | null;
  entidad_jc?: string | null;
  id_entidad_jc?: number | null;
  metodo_jc?: string | null;
  ruta_jc?: string | null;
  estadoHttp_jc?: number | null;
  duracionMs_jc?: number | null;
  ip_jc?: string | null;
  detalle_jc?: Record<string, unknown> | null;
}

/** Filtros admitidos por la consulta de la bitácora. */
export interface FiltrosAuditoria_jc {
  modulo_jc?: string;
  accion_jc?: string;
  id_usuario_jc?: number;
  id_materia_jc?: number;
  id_periodo_jc?: number;
  desde_jc?: string;
  hasta_jc?: string;
  busqueda_jc?: string;
  limite_jc?: number;
  pagina_jc?: number;
}

/**
 * AuditoriaService_jc — Bitácora del sistema.
 *
 * Responde a la pregunta "¿quién hizo qué, cuándo y sobre quién?".
 * Escribe en `td_auditoria_jc` y nunca interrumpe la operación auditada: si el
 * registro falla, se deja constancia en el log del servidor y la petición del
 * usuario continúa con normalidad.
 */
@Injectable()
export class AuditoriaService_jc {
  private readonly logger_jc = new Logger(AuditoriaService_jc.name);

  constructor(private readonly prisma_jc: PrismaService) {}

  /**
   * Registra un evento. Es deliberadamente tolerante a fallos: la auditoría
   * no debe poder tumbar una carga de notas.
   */
  async registrar_jc(evento_jc: EventoAuditoria_jc): Promise<void> {
    try {
      await this.prisma_jc.td_auditoria_jc.create({
        data: {
          modulo_jc: evento_jc.modulo_jc,
          accion_jc: evento_jc.accion_jc,
          descripcion_jc: evento_jc.descripcion_jc,
          resultado_jc: evento_jc.resultado_jc ?? 'EXITO',
          id_usuario_auditoria_jc: evento_jc.id_usuario_auditoria_jc ?? null,
          nombreUsuario_jc: evento_jc.nombreUsuario_jc ?? null,
          rolUsuario_jc: evento_jc.rolUsuario_jc ?? null,
          id_afectado_jc: evento_jc.id_afectado_jc ?? null,
          id_materia_aud_jc: evento_jc.id_materia_aud_jc ?? null,
          id_periodo_aud_jc: evento_jc.id_periodo_aud_jc ?? null,
          entidad_jc: evento_jc.entidad_jc ?? null,
          id_entidad_jc: evento_jc.id_entidad_jc ?? null,
          metodo_jc: evento_jc.metodo_jc ?? null,
          ruta_jc: evento_jc.ruta_jc?.slice(0, 250) ?? null,
          estadoHttp_jc: evento_jc.estadoHttp_jc ?? null,
          duracionMs_jc: evento_jc.duracionMs_jc ?? null,
          ip_jc: evento_jc.ip_jc?.slice(0, 60) ?? null,
          detalle_jc: (evento_jc.detalle_jc ?? undefined) as any,
        },
      });
    } catch (error_jc) {
      this.logger_jc.error(
        `No se pudo registrar la auditoría (${evento_jc.accion_jc}): ${String(error_jc)}`,
      );
    }
  }

  /**
   * Completa el nombre y el rol del autor a partir de su id, para que la
   * bitácora siga siendo legible aunque el usuario se elimine después.
   */
  async registrarConAutor_jc(
    id_usuario_jc: number | undefined,
    evento_jc: Omit<
      EventoAuditoria_jc,
      'id_usuario_auditoria_jc' | 'nombreUsuario_jc' | 'rolUsuario_jc'
    > & {
      /** Identidad declarada cuando aún no hay sesión (ej. inicio de sesión). */
      identidadDeclarada_jc?: string;
    },
  ): Promise<void> {
    const { identidadDeclarada_jc, ...datosEvento_jc } = evento_jc;
    let nombre_jc: string | null = identidadDeclarada_jc ?? null;
    let rol_jc: string | null = null;

    if (id_usuario_jc) {
      const usuario_jc = await this.prisma_jc.td_usuario_ahbb
        .findUnique({
          where: { id_usuario_ahbb: id_usuario_jc },
          select: { nombre_ahbb: true, apellido_ahbb: true, rol_ahbb: true },
        })
        .catch(() => null);

      if (usuario_jc) {
        nombre_jc = `${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb}`;
        rol_jc = usuario_jc.rol_ahbb ?? null;
      }
    }

    await this.registrar_jc({
      ...datosEvento_jc,
      id_usuario_auditoria_jc: id_usuario_jc ?? null,
      nombreUsuario_jc: nombre_jc,
      rolUsuario_jc: rol_jc,
    });
  }

  /** Consulta paginada de la bitácora con filtros combinables. */
  async consultar_jc(filtros_jc: FiltrosAuditoria_jc = {}) {
    const limite_jc = Math.min(Number(filtros_jc.limite_jc) || 50, 200);
    const pagina_jc = Math.max(Number(filtros_jc.pagina_jc) || 1, 1);

    const where_jc: any = {};
    if (filtros_jc.modulo_jc) where_jc.modulo_jc = filtros_jc.modulo_jc;
    if (filtros_jc.accion_jc) where_jc.accion_jc = filtros_jc.accion_jc;
    if (filtros_jc.id_usuario_jc) {
      where_jc.id_usuario_auditoria_jc = Number(filtros_jc.id_usuario_jc);
    }
    if (filtros_jc.id_materia_jc) {
      where_jc.id_materia_aud_jc = Number(filtros_jc.id_materia_jc);
    }
    if (filtros_jc.id_periodo_jc) {
      where_jc.id_periodo_aud_jc = Number(filtros_jc.id_periodo_jc);
    }
    if (filtros_jc.desde_jc || filtros_jc.hasta_jc) {
      where_jc.creadoEn_jc = {};
      if (filtros_jc.desde_jc) {
        where_jc.creadoEn_jc.gte = new Date(filtros_jc.desde_jc);
      }
      if (filtros_jc.hasta_jc) {
        // Se incluye el día completo indicado como "hasta"
        const hasta_jc = new Date(filtros_jc.hasta_jc);
        hasta_jc.setHours(23, 59, 59, 999);
        where_jc.creadoEn_jc.lte = hasta_jc;
      }
    }
    if (filtros_jc.busqueda_jc) {
      where_jc.OR = [
        { descripcion_jc: { contains: filtros_jc.busqueda_jc, mode: 'insensitive' } },
        { nombreUsuario_jc: { contains: filtros_jc.busqueda_jc, mode: 'insensitive' } },
      ];
    }

    const [total_jc, registros_jc] = await Promise.all([
      this.prisma_jc.td_auditoria_jc.count({ where: where_jc }),
      this.prisma_jc.td_auditoria_jc.findMany({
        where: where_jc,
        include: {
          usuario_jc: {
            select: { nombre_ahbb: true, apellido_ahbb: true, cedula_ahbb: true },
          },
          afectado_jc: {
            select: { nombre_ahbb: true, apellido_ahbb: true, cedula_ahbb: true },
          },
        },
        orderBy: { creadoEn_jc: 'desc' },
        skip: (pagina_jc - 1) * limite_jc,
        take: limite_jc,
      }),
    ]);

    return {
      total: total_jc,
      pagina: pagina_jc,
      limite: limite_jc,
      totalPaginas: Math.max(Math.ceil(total_jc / limite_jc), 1),
      registros: registros_jc.map((registro_jc) => ({
        ...registro_jc,
        etiquetaAccion_jc:
          ETIQUETAS_ACCION_JC[registro_jc.accion_jc] ?? registro_jc.accion_jc,
      })),
    };
  }

  /**
   * Indicadores para la cabecera del panel de auditoría: total de eventos,
   * actividad de hoy, usuarios distintos y ranking por acción y por usuario.
   */
  async resumen_jc(modulo_jc?: string) {
    const where_jc = modulo_jc ? { modulo_jc } : {};

    const inicioHoy_jc = new Date();
    inicioHoy_jc.setHours(0, 0, 0, 0);

    const [total_jc, hoy_jc, errores_jc, porAccion_jc, porUsuario_jc, porModulo_jc] =
      await Promise.all([
        this.prisma_jc.td_auditoria_jc.count({ where: where_jc }),
        this.prisma_jc.td_auditoria_jc.count({
          where: { ...where_jc, creadoEn_jc: { gte: inicioHoy_jc } },
        }),
        this.prisma_jc.td_auditoria_jc.count({
          where: { ...where_jc, resultado_jc: 'ERROR' },
        }),
        this.prisma_jc.td_auditoria_jc.groupBy({
          by: ['accion_jc'],
          where: where_jc,
          _count: { accion_jc: true },
          orderBy: { _count: { accion_jc: 'desc' } },
          take: 8,
        }),
        this.prisma_jc.td_auditoria_jc.groupBy({
          by: ['nombreUsuario_jc', 'rolUsuario_jc'],
          where: where_jc,
          _count: { nombreUsuario_jc: true },
          orderBy: { _count: { nombreUsuario_jc: 'desc' } },
          take: 8,
        }),
        this.prisma_jc.td_auditoria_jc.groupBy({
          by: ['modulo_jc'],
          where: where_jc,
          _count: { modulo_jc: true },
          orderBy: { _count: { modulo_jc: 'desc' } },
        }),
      ]);

    return {
      total: total_jc,
      hoy: hoy_jc,
      errores: errores_jc,
      porAccion: porAccion_jc.map((fila_jc) => ({
        accion: fila_jc.accion_jc,
        etiqueta: ETIQUETAS_ACCION_JC[fila_jc.accion_jc] ?? fila_jc.accion_jc,
        total: fila_jc._count.accion_jc,
      })),
      porUsuario: porUsuario_jc
        .filter((fila_jc) => fila_jc.nombreUsuario_jc)
        .map((fila_jc) => ({
          usuario: fila_jc.nombreUsuario_jc,
          rol: fila_jc.rolUsuario_jc,
          total: fila_jc._count.nombreUsuario_jc,
        })),
      porModulo: porModulo_jc.map((fila_jc) => ({
        modulo: fila_jc.modulo_jc,
        total: fila_jc._count.modulo_jc,
      })),
    };
  }

  /** Catálogos que el frontend usa para poblar los selectores de filtro. */
  catalogos_jc() {
    return {
      modulos: Object.values(MODULOS_AUDITORIA_JC),
      acciones: Object.entries(ETIQUETAS_ACCION_JC).map(([valor_jc, etiqueta_jc]) => ({
        valor: valor_jc,
        etiqueta: etiqueta_jc,
      })),
    };
  }
}
