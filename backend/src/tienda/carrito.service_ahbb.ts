import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CarritoService_ahbb {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  async obtenerCarrito_ahbb(id_usuario_ahbb: number) {
    return this.prisma_ahbb.td_carrito_ahbb.findMany({
      where: { id_usuario_carrito_ahbb: id_usuario_ahbb },
      include: { producto_ahbb: true },
      orderBy: { fechaAgregado_ahbb: 'desc' },
    });
  }

  async agregarAlCarrito_ahbb(id_usuario_ahbb: number, id_producto_ahbb: number, cantidad_ahbb: number = 1) {
    // Verificar que el producto existe y está activo
    const producto_ahbb = await this.prisma_ahbb.td_producto_ahbb.findUnique({
      where: { id_producto_ahbb },
    });
    if (!producto_ahbb || producto_ahbb.estado_producto_ahbb !== 'activo') {
      throw new NotFoundException('Producto no encontrado o no disponible.');
    }
    if (producto_ahbb.stock_ahbb < cantidad_ahbb) {
      throw new BadRequestException('Stock insuficiente.');
    }

    // Si ya existe en el carrito, sumar cantidad
    const itemExistente_ahbb = await this.prisma_ahbb.td_carrito_ahbb.findUnique({
      where: {
        id_usuario_carrito_ahbb_id_producto_carrito_ahbb: {
          id_usuario_carrito_ahbb: id_usuario_ahbb,
          id_producto_carrito_ahbb: id_producto_ahbb,
        },
      },
    });

    if (itemExistente_ahbb) {
      return this.prisma_ahbb.td_carrito_ahbb.update({
        where: { id_carrito_ahbb: itemExistente_ahbb.id_carrito_ahbb },
        data: { cantidad_ahbb: itemExistente_ahbb.cantidad_ahbb + cantidad_ahbb },
        include: { producto_ahbb: true },
      });
    }

    return this.prisma_ahbb.td_carrito_ahbb.create({
      data: {
        id_usuario_carrito_ahbb: id_usuario_ahbb,
        id_producto_carrito_ahbb: id_producto_ahbb,
        cantidad_ahbb,
      },
      include: { producto_ahbb: true },
    });
  }

  async actualizarCantidad_ahbb(id_carrito_ahbb: number, id_usuario_ahbb: number, cantidad_ahbb: number) {
    const item_ahbb = await this.prisma_ahbb.td_carrito_ahbb.findFirst({
      where: { id_carrito_ahbb, id_usuario_carrito_ahbb: id_usuario_ahbb },
      include: { producto_ahbb: true },
    });
    if (!item_ahbb) {
      throw new NotFoundException('Item del carrito no encontrado.');
    }
    if (cantidad_ahbb < 1) {
      throw new BadRequestException('La cantidad debe ser al menos 1.');
    }
    if (item_ahbb.producto_ahbb.stock_ahbb < cantidad_ahbb) {
      throw new BadRequestException('Stock insuficiente.');
    }

    return this.prisma_ahbb.td_carrito_ahbb.update({
      where: { id_carrito_ahbb },
      data: { cantidad_ahbb },
      include: { producto_ahbb: true },
    });
  }

  async eliminarItem_ahbb(id_carrito_ahbb: number, id_usuario_ahbb: number) {
    const item_ahbb = await this.prisma_ahbb.td_carrito_ahbb.findFirst({
      where: { id_carrito_ahbb, id_usuario_carrito_ahbb: id_usuario_ahbb },
    });
    if (!item_ahbb) {
      throw new NotFoundException('Item del carrito no encontrado.');
    }
    await this.prisma_ahbb.td_carrito_ahbb.delete({
      where: { id_carrito_ahbb },
    });
    return { exito: true };
  }

  async vaciarCarrito_ahbb(id_usuario_ahbb: number) {
    await this.prisma_ahbb.td_carrito_ahbb.deleteMany({
      where: { id_usuario_carrito_ahbb: id_usuario_ahbb },
    });
    return { exito: true };
  }
}
