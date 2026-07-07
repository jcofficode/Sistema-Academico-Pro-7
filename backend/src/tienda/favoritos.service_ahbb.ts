import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FavoritosService_ahbb {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  async obtenerFavoritos_ahbb(id_usuario_ahbb: number) {
    return this.prisma_ahbb.td_favorito_ahbb.findMany({
      where: { id_usuario_favorito_ahbb: id_usuario_ahbb },
      include: { producto_ahbb: true },
      orderBy: { fechaAgregado_ahbb: 'desc' },
    });
  }

  // Toggle: si ya existe lo quita, si no existe lo agrega
  async toggleFavorito_ahbb(id_usuario_ahbb: number, id_producto_ahbb: number) {
    const existente_ahbb = await this.prisma_ahbb.td_favorito_ahbb.findUnique({
      where: {
        id_usuario_favorito_ahbb_id_producto_favorito_ahbb: {
          id_usuario_favorito_ahbb: id_usuario_ahbb,
          id_producto_favorito_ahbb: id_producto_ahbb,
        },
      },
    });

    if (existente_ahbb) {
      await this.prisma_ahbb.td_favorito_ahbb.delete({
        where: { id_favorito_ahbb: existente_ahbb.id_favorito_ahbb },
      });
      return { esFavorito: false };
    }

    await this.prisma_ahbb.td_favorito_ahbb.create({
      data: {
        id_usuario_favorito_ahbb: id_usuario_ahbb,
        id_producto_favorito_ahbb: id_producto_ahbb,
      },
    });
    return { esFavorito: true };
  }

  async eliminarFavorito_ahbb(id_usuario_ahbb: number, id_producto_ahbb: number) {
    await this.prisma_ahbb.td_favorito_ahbb.deleteMany({
      where: {
        id_usuario_favorito_ahbb: id_usuario_ahbb,
        id_producto_favorito_ahbb: id_producto_ahbb,
      },
    });
    return { exito: true };
  }

  async obtenerIdsFavoritos_ahbb(id_usuario_ahbb: number) {
    const favoritos_ahbb = await this.prisma_ahbb.td_favorito_ahbb.findMany({
      where: { id_usuario_favorito_ahbb: id_usuario_ahbb },
      select: { id_producto_favorito_ahbb: true },
    });
    return favoritos_ahbb.map((f) => f.id_producto_favorito_ahbb);
  }
}
