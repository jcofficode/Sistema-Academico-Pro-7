import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConfiguracionService_ahbb {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  /**
   * Obtener la configuración global (crea una si no existe).
   */
  async obtenerConfiguracion_ahbb() {
    let config_ahbb =
      await this.prisma_ahbb.td_configuracionglobal_ahbb.findFirst();

    if (!config_ahbb) {
      config_ahbb =
        await this.prisma_ahbb.td_configuracionglobal_ahbb.create({
          data: {},
        });
    }

    return {
      id: config_ahbb.id_configuracionglobal_ahbb,
      imagenCertificadoGeneral: config_ahbb.imagenCertificadoGeneral_ahbb,
    };
  }

  /**
   * Actualizar la imagen base del certificado global.
   */
  async actualizarImagenCertificado_ahbb(imagenBase64_ahbb: string) {
    let config_ahbb =
      await this.prisma_ahbb.td_configuracionglobal_ahbb.findFirst();

    if (!config_ahbb) {
      config_ahbb =
        await this.prisma_ahbb.td_configuracionglobal_ahbb.create({
          data: { imagenCertificadoGeneral_ahbb: imagenBase64_ahbb },
        });
    } else {
      config_ahbb =
        await this.prisma_ahbb.td_configuracionglobal_ahbb.update({
          where: {
            id_configuracionglobal_ahbb:
              config_ahbb.id_configuracionglobal_ahbb,
          },
          data: { imagenCertificadoGeneral_ahbb: imagenBase64_ahbb },
        });
    }

    return {
      exito: true,
      mensaje: 'Imagen de certificado actualizada correctamente.',
    };
  }
}
