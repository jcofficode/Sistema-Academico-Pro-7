import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearContratoDto_ap } from './dto/crear-contrato.dto_ap';

/**
 * ContratosService_ap — Gestión de contratos de profesores.
 *
 * Un contrato define si el profesor cobra un sueldo FIJO mensual
 * o una tarifa POR_HORA basada en las horas que dicta.
 * Solo puede existir un contrato activo por profesor.
 */
@Injectable()
export class ContratosService_ap {
  constructor(private readonly prisma_ap: PrismaService) {}

  /** Lista todos los contratos con datos del profesor. */
  async obtenerTodos_ap() {
    return this.prisma_ap.td_contrato_profesor_ap.findMany({
      include: {
        profesor_ap: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            cedula_ahbb: true,
            correo_ahbb: true,
          },
        },
        nominas_ap: { orderBy: { creadoEn_ap: 'desc' }, take: 1 },
      },
      orderBy: { creadoEn_ap: 'desc' },
    });
  }

  /** Obtiene el contrato del profesor autenticado. */
  async obtenerMiContrato_ap(id_profesor_ap: number) {
    const contrato_ap = await this.prisma_ap.td_contrato_profesor_ap.findUnique({
      where: { id_profesor_ap },
      include: {
        nominas_ap: {
          include: {
            periodo_ap: { select: { nombre_cjgp: true } },
            recibo_ap: { select: { codigo_ap: true } },
          },
          orderBy: { creadoEn_ap: 'desc' },
        },
      },
    });
    if (!contrato_ap) {
      throw new NotFoundException(
        'No tienes un contrato registrado. Contacta al administrador.',
      );
    }
    return contrato_ap;
  }

  /** Crea o actualiza el contrato de un profesor (un contrato por profesor). */
  async crear_ap(datos_ap: CrearContratoDto_ap) {
    // Verificar que el usuario existe y es PROFESOR
    const profesor_ap = await this.prisma_ap.td_usuario_ahbb.findUnique({
      where: { id_usuario_ahbb: datos_ap.id_profesor_ap },
    });
    if (!profesor_ap || profesor_ap.rol_ahbb !== 'PROFESOR') {
      throw new BadRequestException(
        'El usuario indicado no existe o no tiene rol de PROFESOR.',
      );
    }

    return this.prisma_ap.td_contrato_profesor_ap.upsert({
      where: { id_profesor_ap: datos_ap.id_profesor_ap },
      create: {
        id_profesor_ap: datos_ap.id_profesor_ap,
        tipo_ap: datos_ap.tipo_ap,
        monto_ap: datos_ap.monto_ap,
        activo_ap: true,
      },
      update: {
        tipo_ap: datos_ap.tipo_ap,
        monto_ap: datos_ap.monto_ap,
        activo_ap: true,
        actualizadoEn_ap: new Date(),
      },
      include: {
        profesor_ap: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
      },
    });
  }

  /** Desactiva un contrato. */
  async desactivar_ap(id_contrato_ap: number) {
    const contrato_ap = await this.prisma_ap.td_contrato_profesor_ap.findUnique({
      where: { id_contrato_ap },
    });
    if (!contrato_ap) throw new NotFoundException('Contrato no encontrado.');

    await this.prisma_ap.td_contrato_profesor_ap.update({
      where: { id_contrato_ap },
      data: { activo_ap: false, actualizadoEn_ap: new Date() },
    });
    return { exito: true, mensaje: 'Contrato desactivado correctamente.' };
  }
}
