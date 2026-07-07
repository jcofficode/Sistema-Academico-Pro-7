import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TunnelService_ahbb } from '../common/tunnel/tunnel.service_ahbb';
import { validarReferenciaPago_ahbb } from '../common/utils/validacion-pago.util_ahbb';
import * as fs from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
// @ts-ignore - pdfmake 0.3.x exporta el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import URLResolver from 'pdfmake/js/URLResolver';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class FacturasService_ahbb {
  private readonly logger_ahbb = new Logger(FacturasService_ahbb.name);
  constructor(
    private readonly prisma_ahbb: PrismaService,
    private readonly tunnelService_ahbb: TunnelService_ahbb,
  ) {}

  // IVA venezolano vigente: 16%
  private readonly IVA_PORCENTAJE_AHBB = 16;

  /**
   * Calcula el desglose impositivo (Subtotal, IVA 16%, Total) para un conjunto de items.
   */
  private calcularDesglose_ahbb(detalles: any[]) {
    const subtotal = detalles.reduce((acc, d) =>
      acc + Number(d.precioUnitario_ahbb) * d.cantidad_ahbb, 0
    );
    const iva = subtotal * (this.IVA_PORCENTAJE_AHBB / 100);
    const total = subtotal + iva;
    return {
      subtotal: +subtotal.toFixed(2),
      ivaPorcentaje: this.IVA_PORCENTAJE_AHBB,
      ivaMontoUSD: +iva.toFixed(2),
      totalConIva: +total.toFixed(2),
    };
  }

  /**
   * Orquesta el proceso de checkout: transforma el carrito en una factura, gestiona inventarios y genera reportes.
   * Valida la integridad de la referencia de pago antes de proceder.
   */
  async crearFactura_ahbb(id_usuario_ahbb: number, nroReferenciaPago_ahbb: string) {
    // Trigger de validación: formato de referencia de pago venezolana
    validarReferenciaPago_ahbb(nroReferenciaPago_ahbb);

    const itemsCarrito_ahbb = await this.prisma_ahbb.td_carrito_ahbb.findMany({
      where: { id_usuario_carrito_ahbb: id_usuario_ahbb },
      include: { producto_ahbb: true },
    });

    if (itemsCarrito_ahbb.length === 0) {
      throw new BadRequestException('El carrito está vacío.');
    }

    // Validar stock para cada item
    for (const item_ahbb of itemsCarrito_ahbb) {
      if (item_ahbb.producto_ahbb.stock_ahbb < item_ahbb.cantidad_ahbb) {
        throw new BadRequestException(
          `Stock insuficiente para "${item_ahbb.producto_ahbb.nombre_ahbb}". Disponible: ${item_ahbb.producto_ahbb.stock_ahbb}`,
        );
      }
    }

    // Calcular total
    const total_ahbb = itemsCarrito_ahbb.reduce((acc_ahbb, item_ahbb) => {
      return acc_ahbb + Number(item_ahbb.producto_ahbb.precio_ahbb) * item_ahbb.cantidad_ahbb;
    }, 0);

    // Transacción: crear factura + detalles + descontar stock + vaciar carrito
    const factura_ahbb = await this.prisma_ahbb.$transaction(async (tx_ahbb) => {
      const nuevaFactura_ahbb = await tx_ahbb.td_factura_ahbb.create({
        data: {
          id_usuario_factura_ahbb: id_usuario_ahbb,
          nroReferenciaPago_ahbb,
          total_ahbb,
          estadoFactura_ahbb: 'pagada', // El sistema valida el pago automáticamente
        },
      });

      // Crear detalles y descontar stock
      for (const item_ahbb of itemsCarrito_ahbb) {
        await tx_ahbb.td_detalle_factura_ahbb.create({
          data: {
            id_factura_detalle_ahbb: nuevaFactura_ahbb.id_factura_ahbb,
            id_producto_detalle_ahbb: item_ahbb.id_producto_carrito_ahbb,
            cantidad_ahbb: item_ahbb.cantidad_ahbb,
            precioUnitario_ahbb: item_ahbb.producto_ahbb.precio_ahbb,
          },
        });

        const productoActualizado_ahbb = await tx_ahbb.td_producto_ahbb.update({
          where: { id_producto_ahbb: item_ahbb.id_producto_carrito_ahbb },
          data: { stock_ahbb: { decrement: item_ahbb.cantidad_ahbb } },
        });

        if (productoActualizado_ahbb.stock_ahbb <= 0) {
          await tx_ahbb.td_producto_ahbb.update({
            where: { id_producto_ahbb: item_ahbb.id_producto_carrito_ahbb },
            data: { estado_producto_ahbb: 'inactivo', stock_ahbb: 0 },
          });
        }
      }

      // Vaciar carrito
      await tx_ahbb.td_carrito_ahbb.deleteMany({
        where: { id_usuario_carrito_ahbb: id_usuario_ahbb },
      });

      return nuevaFactura_ahbb;
    });

    // Proactivamente registramos el reporte para auditoría y QR
    try {
      await this.registrarReporte_ahbb(factura_ahbb.id_factura_ahbb);
    } catch (e) {
      this.logger_ahbb.error(`Error al registrar reporte proactivo para factura ${factura_ahbb.id_factura_ahbb}: ${e.message}`);
      // No bloqueamos el flujo principal si falla el reporte
    }

    return this.obtenerPorId_ahbb(factura_ahbb.id_factura_ahbb, id_usuario_ahbb);
  }

  /**
   * Genera un snapshot de la factura y el QR de verificación en la tabla de reportes.
   */
  async registrarReporte_ahbb(id_factura_ahbb: number) {
    const factura = await this.obtenerPorId_ahbb(id_factura_ahbb);
    
    // URL pública para el QR — usa la URL del túnel activo para acceso desde cualquier red
    const urlPublica = this.tunnelService_ahbb.construirUrl_ahbb(`/api/facturas/publica/${factura.id_factura_ahbb}/pdf`);
    
    const qrBase64 = await QRCode.toDataURL(urlPublica, {
      margin: 1,
      width: 200,
      color: {
        dark: '#1b2a4a',
        light: '#ffffff'
      }
    });

    return this.prisma_ahbb.td_reportes_facturas_ahbb.upsert({
      where: { id_reporte_ahbb: (await this.prisma_ahbb.td_reportes_facturas_ahbb.findFirst({ where: { id_factura_reporte_ahbb: id_factura_ahbb } }))?.id_reporte_ahbb || -1 },
      update: {
        qr_base64_ahbb: qrBase64,
      },
      create: {
        id_factura_reporte_ahbb: id_factura_ahbb,
        qr_base64_ahbb: qrBase64,
      }
    });
  }

  async obtenerHistorial_ahbb(id_usuario_ahbb: number) {
    const facturas = await this.prisma_ahbb.td_factura_ahbb.findMany({
      where: { id_usuario_factura_ahbb: id_usuario_ahbb },
      include: {
        detalles_ahbb: { include: { producto_ahbb: true } },
      },
      orderBy: { fechaFactura_ahbb: 'desc' },
    });
    return facturas.map(f => ({
      ...f,
      desglose_ahbb: this.calcularDesglose_ahbb(f.detalles_ahbb),
    }));
  }

  /**
   * Obtiene una factura específica por su ID, con validación opcional de pertenencia al usuario.
   */
  async obtenerPorId_ahbb(id_factura_ahbb: number, id_usuario_ahbb?: number) {
    const where_ahbb: any = { id_factura_ahbb };
    if (id_usuario_ahbb) {
      where_ahbb.id_usuario_factura_ahbb = id_usuario_ahbb;
    }

    const factura_ahbb = await this.prisma_ahbb.td_factura_ahbb.findFirst({
      where: where_ahbb,
      include: {
        detalles_ahbb: { include: { producto_ahbb: true } },
        usuario_ahbb: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
          },
        },
      },
    });

    if (!factura_ahbb) {
      throw new NotFoundException('Factura no encontrada.');
    }
    return {
      ...factura_ahbb,
      desglose_ahbb: this.calcularDesglose_ahbb(factura_ahbb.detalles_ahbb),
    };
  }

  // ADMIN: Listar todas las facturas
  async obtenerTodas_ahbb() {
    return this.prisma_ahbb.td_factura_ahbb.findMany({
      include: {
        detalles_ahbb: { include: { producto_ahbb: true } },
        usuario_ahbb: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
          },
        },
      },
      orderBy: { fechaFactura_ahbb: 'desc' },
    });
  }

  // ADMIN: Cambiar estado de factura
  async cambiarEstado_ahbb(id_factura_ahbb: number, estadoFactura_ahbb: string) {
    const factura_ahbb = await this.prisma_ahbb.td_factura_ahbb.findUnique({
      where: { id_factura_ahbb },
    });
    if (!factura_ahbb) {
      throw new NotFoundException('Factura no encontrada.');
    }
    return this.prisma_ahbb.td_factura_ahbb.update({
      where: { id_factura_ahbb },
      data: { estadoFactura_ahbb },
    });
  }

  /**
   * Construye el documento PDF del comprobante de compra.
   * Incluye logo institucional, desglose de productos con imágenes y QR de verificación.
   * @returns Buffer binario del PDF.
   */
  async generarPdf_ahbb(id_factura_ahbb: number, id_usuario_ahbb?: number): Promise<Buffer> {
    this.logger_ahbb.log(`Iniciando generación de PDF para factura ${id_factura_ahbb}`);
    try {
      const factura = await this.obtenerPorId_ahbb(id_factura_ahbb, id_usuario_ahbb);
      
      // Intentamos resolver la ruta de las imágenes de los productos y los iconos
      const baseImagePath_ahbb = join(process.cwd(), '..', 'academia-h&b', 'public');
      const iconPath_ahbb = join(process.cwd(), 'uploads', 'graduation-cap.png');
      
      // Intentamos obtener el reporte existente o creamos uno nuevo
      let reporte = await this.prisma_ahbb.td_reportes_facturas_ahbb.findFirst({
        where: { id_factura_reporte_ahbb: factura.id_factura_ahbb }
      });

      if (!reporte) {
        this.logger_ahbb.log(`Reporte no encontrado para factura ${id_factura_ahbb}, generando uno nuevo...`);
        reporte = await this.registrarReporte_ahbb(factura.id_factura_ahbb);
      }

      const qrBase64 = reporte.qr_base64_ahbb;

      const fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique',
        },
      };

      const urlResolver = new URLResolver(fs);
      const printer = new PdfPrinter(fonts, fs, urlResolver);

      const docDefinition: TDocumentDefinitions = {
        defaultStyle: { font: 'Helvetica' },
        pageMargins: [40, 40, 40, 60],
        content: [
          // CABECERA: Logo y Metadatos
          {
            columns: [
              {
                width: '*',
                stack: [
                  {
                    columns: (fs.existsSync(iconPath_ahbb)) ? [
                      {
                        image: iconPath_ahbb,
                        width: 38,
                        margin: [0, 0, 10, 0]
                      },
                      {
                        width: '*',
                        text: [
                          { text: 'Academia ', style: 'header' },
                          { text: 'H&B', style: 'headerAccent' }
                        ],
                        margin: [0, 4, 0, 0]
                      }
                    ] : [
                      {
                        width: '*',
                        text: [
                          { text: 'Academia ', style: 'header' },
                          { text: 'H&B', style: 'headerAccent' }
                        ],
                        margin: [0, 4, 0, 0]
                      }
                    ]
                  },
                  { text: 'merch@academiahb.com', style: 'subheader', margin: [0, 5, 0, 0] },
                  { text: 'Caracas, Venezuela', style: 'subheader' },
                  { text: 'RIF: J-1234567-8', style: 'subheader' },
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: 'COMPROBANTE DE COMPRA', style: 'title' },
                  { text: `REF: ${factura.nroReferenciaPago_ahbb || '—'}`, style: 'metaTextBold', alignment: 'right' },
                  { 
                    text: `${factura.fechaFactura_ahbb ? factura.fechaFactura_ahbb.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}`, 
                    style: 'metaText', 
                    alignment: 'right' 
                  },
                  {
                    margin: [0, 8, 0, 0],
                    table: {
                      widths: ['auto'],
                      body: [
                        [
                          { 
                            text: factura.estadoFactura_ahbb.toUpperCase(), 
                            style: 'estadoBadge',
                            fillColor: factura.estadoFactura_ahbb.toLowerCase() === 'pagada' ? '#22c55e' : '#f59e0b',
                            color: 'white',
                            alignment: 'center',
                            margin: [10, 2, 10, 2]
                          }
                        ]
                      ]
                    },
                    layout: {
                      hLineWidth: () => 0,
                      vLineWidth: () => 0,
                      paddingLeft: () => 0,
                      paddingRight: () => 0,
                    },
                    alignment: 'right'
                  }
                ],
                alignment: 'right'
              }
            ],
            margin: [0, 0, 0, 30]
          },

          { text: 'DETALLE DE PRODUCTOS', style: 'sectionTitle', margin: [0, 0, 0, 10] },

          // TABLA DE PRODUCTOS
          {
            table: {
              headerRows: 1,
              widths: [40, '*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: '', style: 'tableHeader' },
                  { text: 'Producto', style: 'tableHeader' },
                  { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
                  { text: 'P. Unitario', style: 'tableHeader', alignment: 'right' },
                  { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }
                ],
                ...factura.detalles_ahbb.map(d => {
                  const imgPath = join(baseImagePath_ahbb, d.producto_ahbb?.imagen_ahbb || '');
                  const hasImage = d.producto_ahbb?.imagen_ahbb && fs.existsSync(imgPath);

                  return [
                    hasImage 
                      ? { image: imgPath, width: 30, height: 30, alignment: 'center', margin: [0, 5, 0, 5] }
                      : { text: '', margin: [0, 5, 0, 5] },
                    { 
                      stack: [
                        { text: d.producto_ahbb?.nombre_ahbb || '—', bold: true },
                        { text: d.producto_ahbb?.categoria_ahbb || '', fontSize: 9, color: '#64748b' }
                      ],
                      margin: [0, 5, 0, 5] 
                    },
                    { text: d.cantidad_ahbb.toString(), alignment: 'center', margin: [0, 10, 0, 5] },
                    { text: `$${Number(d.precioUnitario_ahbb).toFixed(2)}`, alignment: 'right', margin: [0, 10, 0, 5], color: '#64748b' },
                    { text: `$${(d.cantidad_ahbb * Number(d.precioUnitario_ahbb)).toFixed(2)}`, alignment: 'right', margin: [0, 10, 0, 5], bold: true }
                  ];
                })
              ] as any[][]
            },
            layout: {
              hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
              vLineWidth: () => 0,
              hLineColor: () => '#e2e8f0',
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
            margin: [0, 0, 0, 20]
          },

          // TOTALES Y QR
          {
            columns: [
              {
                width: 100,
                stack: [
                  { image: qrBase64, width: 90, alignment: 'center' },
                  { text: 'Escanea para verificar', fontSize: 7, bold: true, alignment: 'center', color: '#1b2a4a', margin: [0, 3, 0, 0] }
                ],
                margin: [0, 10, 0, 0]
              },
              { width: '*', text: '' },
              {
                width: 220,
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Subtotal (sin IVA)', color: '#64748b', margin: [0, 5, 0, 5] }, 
                      { text: `$${factura.desglose_ahbb.subtotal.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5] }
                    ],
                    [
                      { text: `IVA (${factura.desglose_ahbb.ivaPorcentaje}%)`, color: '#64748b', margin: [0, 5, 0, 5] }, 
                      { text: `$${factura.desglose_ahbb.ivaMontoUSD.toFixed(2)}`, alignment: 'right', margin: [0, 5, 0, 5] }
                    ],
                    [
                      { 
                        text: 'TOTAL', 
                        bold: true, 
                        fontSize: 14, 
                        color: 'white', 
                        fillColor: '#1b2a4a',
                        margin: [10, 8, 10, 8] 
                      },
                      { 
                        text: `$${factura.desglose_ahbb.totalConIva.toFixed(2)}`, 
                        bold: true, 
                        alignment: 'right', 
                        fontSize: 18, 
                        color: 'white',
                        fillColor: '#1b2a4a',
                        margin: [10, 6, 10, 6] 
                      }
                    ]
                  ] as any[][]
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  paddingLeft: () => 0,
                  paddingRight: () => 0,
                }
              }
            ] as any[]
          },
          { text: `* IVA calculado según SENIAT (${factura.desglose_ahbb.ivaPorcentaje}%)`, style: 'footerNota', margin: [0, 5, 0, 0] },
          {
            stack: [
              { text: '\n\nAcademia H&B — Tu academia de certificaciones de confianza.', style: 'footer', alignment: 'center' },
              { text: 'Este comprobante es válido como constancia de pago.', style: 'footer', alignment: 'center' }
            ],
            margin: [0, 20, 0, 0]
          }
        ],
        styles: {
          header: { fontSize: 24, bold: true, color: '#1b2a4a' },
          headerAccent: { fontSize: 24, bold: true, color: '#f59e0b' },
          subheader: { fontSize: 10, color: '#64748b', lineHeight: 1.3 },
          sectionTitle: { fontSize: 11, bold: true, color: '#64748b' },
          title: { fontSize: 9, bold: true, color: '#94a3b8', margin: [0, 0, 0, 5] },
          metaText: { fontSize: 10, color: '#1e293b' },
          metaTextBold: { fontSize: 18, bold: true, color: '#1b2a4a' },
          estadoBadge: { fontSize: 9, bold: true },
          tableHeader: { bold: true, fontSize: 10, color: 'white', fillColor: '#1b2a4a', margin: [5, 8, 5, 8] },
          footerNota: { fontSize: 9, color: '#94a3b8', alignment: 'right' },
          footer: { fontSize: 9, color: '#94a3b8' }
        }

      };

      return new Promise<Buffer>(async (resolve, reject) => {
        try {
          console.log(`[DEBUG:FacturasService] Llamando a printer.createPdfKitDocument...`);
          // En pdfmake 0.3.x, createPdfKitDocument es asíncrono
          const pdfDoc = await printer.createPdfKitDocument(docDefinition);
          console.log(`[DEBUG:FacturasService] Documento PDF creado. Empezando a leer stream...`);
          const chunks: Buffer[] = [];
          pdfDoc.on('data', (chunk) => {
            chunks.push(chunk);
          });
          pdfDoc.on('end', () => {
            console.log(`[DEBUG:FacturasService] Stream finalizado. Chunks acumulados: ${chunks.length}`);
            resolve(Buffer.concat(chunks));
          });
          pdfDoc.on('error', (err) => {
            console.error('[DEBUG:FacturasService] Error suscribiendo al stream del PDF:', err);
            reject(err);
          });
          pdfDoc.end();
        } catch (error) {
          console.error('[DEBUG:FacturasService] Error generando documento PDF:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error en generarPdf_ahbb:', error);
      throw error; // Re-lanzar error para que sea capturado por el controlador u otro filtro
    }
  }
}
