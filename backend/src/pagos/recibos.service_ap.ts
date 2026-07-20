import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
// @ts-ignore - pdfmake 0.3.x exporta el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import URLResolver from 'pdfmake/js/URLResolver';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const AZUL_OSCURO_AP = '#1a237e';
const AZUL_MEDIO_AP = '#283593';
const AZUL_CLARO_AP = '#e8eaf6';

/**
 * RecibosService_ap — Generación de recibos PDF para pagos de alumnos y nóminas.
 *
 * Sigue el mismo patrón que ActasService_jc:
 *  - pdfmake 0.3.x con createPdfKitDocument asíncrono.
 *  - Hash SHA-256 del contenido del recibo guardado en td_recibo_pago_ap.
 *  - Código único de recibo para trazabilidad.
 */
@Injectable()
export class RecibosService_ap {
  constructor(private readonly prisma_ap: PrismaService) {}

  /**
   * Genera el recibo PDF de un pago de alumno y lo registra en BD.
   * Retorna el buffer listo para descargar.
   */
  async generarReciboPago_ap(
    id_pago_ap: number,
  ): Promise<{ buffer: Buffer; codigo: string }> {
    const pago_ap = await this.prisma_ap.td_pago_ap.findUnique({
      where: { id_pago_ap },
      include: {
        alumno_ap: {
          select: {
            nombre_ahbb: true,
            apellido_ahbb: true,
            cedula_ahbb: true,
            correo_ahbb: true,
          },
        },
        tarifa_ap: true,
        periodo_ap: { select: { nombre_cjgp: true } },
        curso_ap: { select: { nombre_ahbb: true } },
        confirmadoPor_ap: { select: { nombre_ahbb: true, apellido_ahbb: true } },
      },
    });
    if (!pago_ap) throw new Error('Pago no encontrado para generar recibo.');

    const contenidoVerificable_ap = JSON.stringify({
      id: pago_ap.id_pago_ap,
      alumno: pago_ap.alumno_ap.cedula_ahbb,
      monto: pago_ap.monto_ap,
      referencia: pago_ap.referencia_ap,
      estado: pago_ap.estado_ap,
      fecha: pago_ap.confirmadoEn_ap,
    });
    const hash_ap = crypto
      .createHash('sha256')
      .update(contenidoVerificable_ap)
      .digest('hex');

    const codigo_ap = `REC-${Date.now().toString(36).toUpperCase()}-P${pago_ap.id_pago_ap}`;

    // Registrar recibo en BD (upsert para re-generaciones)
    await this.prisma_ap.td_recibo_pago_ap.upsert({
      where: { id_pago_ap: id_pago_ap },
      create: { id_pago_ap, codigo_ap, hashVerificacion_ap: hash_ap },
      update: { hashVerificacion_ap: hash_ap },
    });

    const definicion_ap = this.construirReciboPago_ap(pago_ap, codigo_ap, hash_ap);
    const buffer_ap = await this.renderizarPdf_ap(definicion_ap);
    return { buffer: buffer_ap, codigo: codigo_ap };
  }

  /**
   * Genera el recibo PDF de una nómina de profesor y lo registra en BD.
   */
  async generarReciboNomina_ap(
    id_nomina_ap: number,
  ): Promise<{ buffer: Buffer; codigo: string }> {
    const nomina_ap = await this.prisma_ap.td_nomina_ap.findUnique({
      where: { id_nomina_ap },
      include: {
        contrato_ap: {
          include: {
            profesor_ap: {
              select: {
                nombre_ahbb: true,
                apellido_ahbb: true,
                cedula_ahbb: true,
              },
            },
          },
        },
        periodo_ap: { select: { nombre_cjgp: true } },
      },
    });
    if (!nomina_ap) throw new Error('Nómina no encontrada para generar recibo.');

    const contenidoVerificable_ap = JSON.stringify({
      id: nomina_ap.id_nomina_ap,
      profesor: nomina_ap.contrato_ap.profesor_ap.cedula_ahbb,
      monto: nomina_ap.monto_calculado_ap,
      horas: nomina_ap.horas_ap,
      estado: nomina_ap.estado_ap,
      periodo: nomina_ap.periodo_ap.nombre_cjgp,
    });
    const hash_ap = crypto
      .createHash('sha256')
      .update(contenidoVerificable_ap)
      .digest('hex');

    const codigo_ap = `REC-NOM-${Date.now().toString(36).toUpperCase()}-N${nomina_ap.id_nomina_ap}`;

    await this.prisma_ap.td_recibo_pago_ap.upsert({
      where: { id_nomina_ap: id_nomina_ap },
      create: { id_nomina_ap, codigo_ap, hashVerificacion_ap: hash_ap },
      update: { hashVerificacion_ap: hash_ap },
    });

    const definicion_ap = this.construirReciboNomina_ap(nomina_ap, codigo_ap, hash_ap);
    const buffer_ap = await this.renderizarPdf_ap(definicion_ap);
    return { buffer: buffer_ap, codigo: codigo_ap };
  }

  // ─── Constructores de documentos pdfmake ─────────────────────

  private construirReciboPago_ap(
    pago_ap: any,
    codigo_ap: string,
    hash_ap: string,
  ): TDocumentDefinitions {
    const concepto_ap =
      pago_ap.concepto_ap === 'PERIODO'
        ? `Inscripción del Período: ${pago_ap.periodo_ap?.nombre_cjgp ?? 'N/A'}`
        : `Curso Extracurricular: ${pago_ap.curso_ap?.nombre_ahbb ?? 'N/A'}`;

    return {
      pageSize: 'LETTER',
      pageMargins: [50, 50, 50, 50],
      defaultStyle: { font: 'Helvetica' },
      watermark: {
        text: pago_ap.estado_ap === 'CONFIRMADO' ? 'PAGADO' : pago_ap.estado_ap,
        color: pago_ap.estado_ap === 'CONFIRMADO' ? '#1a237e' : '#b71c1c',
        opacity: 0.06,
        bold: true,
      },
      content: [
        {
          text: [
            { text: 'ACADEMIA ', bold: true, fontSize: 18 },
            { text: 'H&B', bold: true, fontSize: 18, color: '#f2a33c' },
          ],
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          text: 'SISTEMA DE PAGOS — RECIBO OFICIAL',
          alignment: 'center',
          fontSize: 10,
          color: '#555555',
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, color: AZUL_OSCURO_AP }],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'DATOS DEL ALUMNO', bold: true, fontSize: 9, color: AZUL_MEDIO_AP, margin: [0, 0, 0, 6] },
                { text: [{ text: 'Nombre: ', bold: true, fontSize: 9 }, { text: `${pago_ap.alumno_ap.apellido_ahbb}, ${pago_ap.alumno_ap.nombre_ahbb}`, fontSize: 9 }] },
                { text: [{ text: 'Cédula: ', bold: true, fontSize: 9 }, { text: pago_ap.alumno_ap.cedula_ahbb, fontSize: 9 }] },
                { text: [{ text: 'Correo: ', bold: true, fontSize: 9 }, { text: pago_ap.alumno_ap.correo_ahbb, fontSize: 9 }] },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: 'DETALLES DEL PAGO', bold: true, fontSize: 9, color: AZUL_MEDIO_AP, margin: [0, 0, 0, 6] },
                { text: [{ text: 'N° Recibo: ', bold: true, fontSize: 9 }, { text: codigo_ap, fontSize: 9 }] },
                { text: [{ text: 'Estado: ', bold: true, fontSize: 9 }, { text: pago_ap.estado_ap, fontSize: 9, color: pago_ap.estado_ap === 'CONFIRMADO' ? '#2e7d32' : '#b71c1c', bold: true }] },
                { text: [{ text: 'Fecha: ', bold: true, fontSize: 9 }, { text: new Date(pago_ap.confirmadoEn_ap ?? pago_ap.creadoEn_ap).toLocaleDateString('es-VE'), fontSize: 9 }] },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Concepto', bold: true, fontSize: 9, fillColor: AZUL_CLARO_AP },
                { text: 'Monto (Bs.)', bold: true, fontSize: 9, fillColor: AZUL_CLARO_AP, alignment: 'right' },
              ],
              [
                { text: concepto_ap, fontSize: 9 },
                { text: Number(pago_ap.monto_ap).toFixed(2), fontSize: 9, alignment: 'right' },
              ],
              [
                { text: `Referencia de pago: ${pago_ap.referencia_ap}`, fontSize: 8, color: '#666666', colSpan: 2 },
                {},
              ],
              [
                { text: 'TOTAL', bold: true, fontSize: 10, fillColor: AZUL_OSCURO_AP, color: 'white' },
                { text: `Bs. ${Number(pago_ap.monto_ap).toFixed(2)}`, bold: true, fontSize: 10, fillColor: AZUL_OSCURO_AP, color: 'white', alignment: 'right' },
              ],
            ],
          },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#b0bec5', vLineColor: () => '#b0bec5' },
          margin: [0, 0, 0, 20],
        },
        pago_ap.observacion_ap
          ? { text: `Observación: ${pago_ap.observacion_ap}`, fontSize: 8, color: '#b71c1c', italics: true, margin: [0, 0, 0, 20] }
          : { text: '' },
        {
          text: `Código: ${codigo_ap}   |   Hash SHA-256: ${hash_ap}`,
          fontSize: 6,
          color: '#9e9e9e',
          margin: [0, 10, 0, 0],
        },
        {
          text: pago_ap.confirmadoPor_ap
            ? `Confirmado por: ${pago_ap.confirmadoPor_ap.nombre_ahbb} ${pago_ap.confirmadoPor_ap.apellido_ahbb}`
            : '',
          fontSize: 7,
          color: '#757575',
        },
      ],
    };
  }

  private construirReciboNomina_ap(
    nomina_ap: any,
    codigo_ap: string,
    hash_ap: string,
  ): TDocumentDefinitions {
    const profesor_ap = nomina_ap.contrato_ap.profesor_ap;
    const esPorHora_ap = nomina_ap.contrato_ap.tipo_ap === 'POR_HORA';

    return {
      pageSize: 'LETTER',
      pageMargins: [50, 50, 50, 50],
      defaultStyle: { font: 'Helvetica' },
      watermark: {
        text: nomina_ap.estado_ap,
        color: nomina_ap.estado_ap === 'PAGADO' ? '#1a237e' : '#f57f17',
        opacity: 0.06,
        bold: true,
      },
      content: [
        {
          text: [
            { text: 'ACADEMIA ', bold: true, fontSize: 18 },
            { text: 'H&B', bold: true, fontSize: 18, color: '#f2a33c' },
          ],
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        {
          text: 'SISTEMA DE PAGOS — RECIBO DE NÓMINA DOCENTE',
          alignment: 'center',
          fontSize: 10,
          color: '#555555',
          margin: [0, 0, 0, 20],
        },
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, color: AZUL_OSCURO_AP }], margin: [0, 0, 0, 20] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'DATOS DEL DOCENTE', bold: true, fontSize: 9, color: AZUL_MEDIO_AP, margin: [0, 0, 0, 6] },
                { text: [{ text: 'Nombre: ', bold: true, fontSize: 9 }, { text: `${profesor_ap.apellido_ahbb}, ${profesor_ap.nombre_ahbb}`, fontSize: 9 }] },
                { text: [{ text: 'Cédula: ', bold: true, fontSize: 9 }, { text: profesor_ap.cedula_ahbb, fontSize: 9 }] },
                { text: [{ text: 'Tipo Contrato: ', bold: true, fontSize: 9 }, { text: nomina_ap.contrato_ap.tipo_ap, fontSize: 9 }] },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: 'DETALLES DE NÓMINA', bold: true, fontSize: 9, color: AZUL_MEDIO_AP, margin: [0, 0, 0, 6] },
                { text: [{ text: 'N° Recibo: ', bold: true, fontSize: 9 }, { text: codigo_ap, fontSize: 9 }] },
                { text: [{ text: 'Período: ', bold: true, fontSize: 9 }, { text: nomina_ap.periodo_ap.nombre_cjgp, fontSize: 9 }] },
                { text: [{ text: 'Estado: ', bold: true, fontSize: 9 }, { text: nomina_ap.estado_ap, fontSize: 9, color: nomina_ap.estado_ap === 'PAGADO' ? '#2e7d32' : '#e65100', bold: true }] },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Concepto', bold: true, fontSize: 9, fillColor: AZUL_CLARO_AP },
                { text: 'Monto (Bs.)', bold: true, fontSize: 9, fillColor: AZUL_CLARO_AP, alignment: 'right' },
              ],
              esPorHora_ap
                ? [
                    { text: `Horas dictadas: ${Number(nomina_ap.horas_ap).toFixed(2)} h × Bs. ${Number(nomina_ap.contrato_ap.monto_ap).toFixed(2)}/h`, fontSize: 9 },
                    { text: Number(nomina_ap.monto_calculado_ap).toFixed(2), fontSize: 9, alignment: 'right' },
                  ]
                : [
                    { text: 'Sueldo fijo del período', fontSize: 9 },
                    { text: Number(nomina_ap.monto_calculado_ap).toFixed(2), fontSize: 9, alignment: 'right' },
                  ],
              [
                { text: 'TOTAL A PAGAR', bold: true, fontSize: 10, fillColor: AZUL_OSCURO_AP, color: 'white' },
                { text: `Bs. ${Number(nomina_ap.monto_calculado_ap).toFixed(2)}`, bold: true, fontSize: 10, fillColor: AZUL_OSCURO_AP, color: 'white', alignment: 'right' },
              ],
            ],
          },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#b0bec5', vLineColor: () => '#b0bec5' },
          margin: [0, 0, 0, 20],
        },
        {
          text: `Código: ${codigo_ap}   |   Hash SHA-256: ${hash_ap}`,
          fontSize: 6,
          color: '#9e9e9e',
          margin: [0, 10, 0, 0],
        },
      ],
    };
  }

  /** Convierte la definición pdfmake en un buffer binario. */
  private renderizarPdf_ap(definicion_ap: TDocumentDefinitions): Promise<Buffer> {
    const fonts_ap = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const printer_ap = new PdfPrinter(fonts_ap, fs, new URLResolver(fs));

    return new Promise(async (resolver_ap, rechazar_ap) => {
      try {
        const documento_ap = await printer_ap.createPdfKitDocument(definicion_ap);
        const fragmentos_ap: Buffer[] = [];
        documento_ap.on('data', (fragmento_ap: Buffer) => fragmentos_ap.push(fragmento_ap));
        documento_ap.on('end', () => resolver_ap(Buffer.concat(fragmentos_ap)));
        documento_ap.on('error', rechazar_ap);
        documento_ap.end();
      } catch (error_ap) {
        rechazar_ap(error_ap);
      }
    });
  }
}
