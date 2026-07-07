import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductosService_ahbb {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  private resolverEstadoProducto_ahbb(
    stock_ahbb: number,
    estadoSolicitado_ahbb?: string | null,
  ) {
    if (stock_ahbb <= 0) {
      return 'inactivo';
    }

    return estadoSolicitado_ahbb === 'inactivo' ? 'inactivo' : 'activo';
  }

  private async obtenerProductoConDependencias_ahbb(id_producto_ahbb: number) {
    const producto_ahbb = await this.prisma_ahbb.td_producto_ahbb.findUnique({
      where: { id_producto_ahbb },
      include: {
        _count: {
          select: {
            itemsCarrito_ahbb: true,
            favoritos_ahbb: true,
            detallesFactura_ahbb: true,
          },
        },
      },
    });

    if (!producto_ahbb) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return producto_ahbb;
  }

  async obtenerTodos_ahbb(filtros_ahbb?: {
    categoria?: string;
    busqueda?: string;
    estado?: string;
  }) {
    const where_ahbb: any = {};

    if (filtros_ahbb?.categoria) {
      where_ahbb.categoria_ahbb = filtros_ahbb.categoria;
    }
    if (filtros_ahbb?.estado === 'todos') {
      // El listado completo solo se expone cuando el controlador valida contexto admin.
    } else if (filtros_ahbb?.estado) {
      where_ahbb.estado_producto_ahbb = filtros_ahbb.estado;

      if (filtros_ahbb.estado === 'activo') {
        where_ahbb.stock_ahbb = { gt: 0 };
      }
    } else {
      where_ahbb.estado_producto_ahbb = 'activo';
      where_ahbb.stock_ahbb = { gt: 0 };
    }
    if (filtros_ahbb?.busqueda) {
      where_ahbb.OR = [
        { nombre_ahbb: { contains: filtros_ahbb.busqueda, mode: 'insensitive' } },
        { descripcion_ahbb: { contains: filtros_ahbb.busqueda, mode: 'insensitive' } },
      ];
    }

    return this.prisma_ahbb.td_producto_ahbb.findMany({
      where: where_ahbb,
      orderBy: { creadoEn_ahbb: 'desc' },
    });
  }

  async obtenerPorId_ahbb(id_producto_ahbb: number) {
    const producto_ahbb = await this.prisma_ahbb.td_producto_ahbb.findUnique({
      where: { id_producto_ahbb },
    });

    if (!producto_ahbb) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return producto_ahbb;
  }

  async crear_ahbb(datos_ahbb: any) {
    const stock_ahbb = Number(datos_ahbb.stock ?? 0);

    return this.prisma_ahbb.td_producto_ahbb.create({
      data: {
        nombre_ahbb: datos_ahbb.nombre,
        descripcion_ahbb: datos_ahbb.descripcion ?? null,
        precio_ahbb: datos_ahbb.precio,
        stock_ahbb,
        categoria_ahbb: datos_ahbb.categoria,
        imagen_ahbb: datos_ahbb.imagen ?? null,
        estado_producto_ahbb: this.resolverEstadoProducto_ahbb(
          stock_ahbb,
          datos_ahbb.estado,
        ),
      },
    });
  }

  async actualizar_ahbb(id_producto_ahbb: number, datos_ahbb: any) {
    await this.obtenerPorId_ahbb(id_producto_ahbb);

    const stock_ahbb = Number(datos_ahbb.stock ?? 0);

    return this.prisma_ahbb.td_producto_ahbb.update({
      where: { id_producto_ahbb },
      data: {
        nombre_ahbb: datos_ahbb.nombre,
        descripcion_ahbb: datos_ahbb.descripcion,
        precio_ahbb: datos_ahbb.precio,
        stock_ahbb,
        categoria_ahbb: datos_ahbb.categoria,
        imagen_ahbb: datos_ahbb.imagen,
        estado_producto_ahbb: this.resolverEstadoProducto_ahbb(
          stock_ahbb,
          datos_ahbb.estado,
        ),
      },
    });
  }

  async eliminar_ahbb(id_producto_ahbb: number) {
    const producto_ahbb =
      await this.obtenerProductoConDependencias_ahbb(id_producto_ahbb);

    const tieneHistorialCompras_ahbb =
      producto_ahbb._count.detallesFactura_ahbb > 0;

    return this.prisma_ahbb.$transaction(async (tx_ahbb) => {
      await tx_ahbb.td_carrito_ahbb.deleteMany({
        where: { id_producto_carrito_ahbb: id_producto_ahbb },
      });

      await tx_ahbb.td_favorito_ahbb.deleteMany({
        where: { id_producto_favorito_ahbb: id_producto_ahbb },
      });

      if (tieneHistorialCompras_ahbb) {
        await tx_ahbb.td_producto_ahbb.update({
          where: { id_producto_ahbb },
          data: {
            estado_producto_ahbb: 'inactivo',
            stock_ahbb: 0,
          },
        });

        return {
          exito: true,
          softDeleted: true,
          mensaje:
            'Producto retirado del catalogo. Se conserva porque ya forma parte del historial de compras.',
        };
      }

      await tx_ahbb.td_producto_ahbb.delete({
        where: { id_producto_ahbb },
      });

      return {
        exito: true,
        softDeleted: false,
        mensaje: 'Producto eliminado permanentemente.',
      };
    });
  }
}
