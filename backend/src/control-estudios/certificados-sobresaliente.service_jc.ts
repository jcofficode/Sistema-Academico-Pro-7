import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificacionesService_jc, TIPOS_NOTIFICACION_JC } from './notificaciones.service_jc';
import { AuditoriaService_jc } from '../auditoria/auditoria.service_jc';
import {
  ACCIONES_JC,
  MODULOS_AUDITORIA_JC,
} from '../auditoria/constantes/acciones-auditoria_jc';
import { TunnelService_ahbb } from '../common/tunnel/tunnel.service_ahbb';
import { ROLES_JC } from '../common/constantes/roles_jc';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
// @ts-ignore - pdfmake 0.3.x expone el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import URLResolver from 'pdfmake/js/URLResolver';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const DORADO_JC = '#b8860b';
const DORADO_CLARO_JC = '#f6e6b4';
const AZUL_JC = '#1b2a4a';

/**
 * CertificadosSobresalienteService_jc — Reconocimiento a la excelencia académica.
 *
 * Es el equivalente en CARRERAS del certificado de cursos libres del sistema
 * heredado (`certificados.service_ahbb.ts`), del que se toma el patrón —pdfmake
 * + QR verificable + registro en base de datos— pero con documento propio: aquí
 * se acredita una MATERIA de un pensum, con su carrera, su período, sus créditos
 * y la nota definitiva obtenida.
 *
 * Se emite automáticamente al cerrar el acta cuando la definitiva del alumno
 * queda en el rango de excelencia, y va acompañado de una notificación de
 * felicitación en la bandeja del estudiante.
 */
@Injectable()
export class CertificadosSobresalienteService_jc {
  private readonly logger_jc = new Logger(CertificadosSobresalienteService_jc.name);

  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly notificacionesService_jc: NotificacionesService_jc,
    private readonly auditoriaService_jc: AuditoriaService_jc,
    private readonly tunnelService_jc: TunnelService_ahbb,
  ) {}

  /**
   * Emite los certificados de las filas que alcanzaron la nota mínima de
   * excelencia al cerrar un acta. Es idempotente: si el acta se vuelve a
   * cerrar, no duplica certificados (constraint único por inscripción).
   */
  async emitirPorCierre_jc(
    matriz_jc: any,
    idUsuarioEmite_jc: number,
    notaMinima_jc: number,
  ) {
    const candidatos_jc = matriz_jc.filas.filter(
      (fila_jc: any) => fila_jc.definitiva_jc >= notaMinima_jc,
    );
    if (candidatos_jc.length === 0) return [];

    const emitidos_jc: any[] = [];

    for (const fila_jc of candidatos_jc) {
      const yaExiste_jc =
        await this.prisma_jc.td_certificado_sobresaliente_jc.findUnique({
          where: {
            id_inscripcion_materia_cer_jc: fila_jc.id_inscripcion_materia_jc,
          },
        });
      if (yaExiste_jc) continue;

      const codigo_jc = this.construirCodigo_jc(
        matriz_jc.periodo.nombre_cjgp,
        matriz_jc.materia.codigo_cjgp,
        fila_jc.alumno_jc.cedula_ahbb,
      );

      const hash_jc = this.calcularHash_jc({
        codigo: codigo_jc,
        cedula: fila_jc.alumno_jc.cedula_ahbb,
        materia: matriz_jc.materia.codigo_cjgp,
        periodo: matriz_jc.periodo.nombre_cjgp,
        definitiva: fila_jc.definitiva_jc,
      });

      const certificado_jc =
        await this.prisma_jc.td_certificado_sobresaliente_jc.create({
          data: {
            codigo_jc,
            notaFinal_jc: fila_jc.definitiva_jc,
            hashVerificacion_jc: hash_jc,
            id_inscripcion_materia_cer_jc: fila_jc.id_inscripcion_materia_jc,
            id_alumno_cer_jc: fila_jc.alumno_jc.id_usuario_ahbb,
            emitidoPorUsuarioId_jc: idUsuarioEmite_jc,
          },
        });

      // Felicitación en la bandeja del alumno
      await this.notificacionesService_jc.crear_jc({
        id_usuario_jc: fila_jc.alumno_jc.id_usuario_ahbb,
        titulo_jc: '¡Felicitaciones! Obtuviste un Certificado de Sobresaliente',
        mensaje_jc: `Aprobaste ${matriz_jc.materia.codigo_cjgp} — ${matriz_jc.materia.nombre_cjgp} con ${fila_jc.definitiva_jc} puntos en el período ${matriz_jc.periodo.nombre_cjgp}. Tu rendimiento está en el rango de excelencia, así que la academia te otorga el Certificado de Sobresaliente. Ya puedes descargarlo.`,
        tipo_jc: TIPOS_NOTIFICACION_JC.FELICITACION,
        icono_jc: 'military_tech',
        enlace_jc: '/alumno/certificados-sobresaliente',
      });

      await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioEmite_jc, {
        modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
        accion_jc: ACCIONES_JC.CERTIFICADO_SOBRESALIENTE,
        descripcion_jc: `emitió el Certificado de Sobresaliente ${codigo_jc} a ${fila_jc.alumno_jc.apellido_ahbb}, ${fila_jc.alumno_jc.nombre_ahbb} por ${matriz_jc.materia.codigo_cjgp} con ${fila_jc.definitiva_jc} puntos`,
        id_afectado_jc: fila_jc.alumno_jc.id_usuario_ahbb,
        id_materia_aud_jc: matriz_jc.materia.id_materia_cjgp,
        id_periodo_aud_jc: matriz_jc.periodo.id_periodo_cjgp,
        entidad_jc: 'td_certificado_sobresaliente_jc',
        id_entidad_jc: certificado_jc.id_certificado_sob_jc,
        detalle_jc: { codigo: codigo_jc, nota: fila_jc.definitiva_jc },
      });

      emitidos_jc.push({
        codigo_jc,
        alumno_jc: `${fila_jc.alumno_jc.apellido_ahbb}, ${fila_jc.alumno_jc.nombre_ahbb}`,
        nota_jc: fila_jc.definitiva_jc,
      });
    }

    return emitidos_jc;
  }

  /** Certificados del alumno autenticado. */
  async obtenerMios_jc(id_usuario_jc: number) {
    return this.prisma_jc.td_certificado_sobresaliente_jc.findMany({
      where: { id_alumno_cer_jc: id_usuario_jc, anulado_jc: false },
      include: {
        inscripcionMateria_jc: {
          include: {
            materia_cjgp: { include: { carrera_cjgp: true } },
            periodo_cjgp: true,
          },
        },
      },
      orderBy: { creadoEn_jc: 'desc' },
    });
  }

  /** Listado completo para Control de Estudios y administración. */
  async obtenerTodos_jc() {
    return this.prisma_jc.td_certificado_sobresaliente_jc.findMany({
      include: {
        alumno_jc: {
          select: { nombre_ahbb: true, apellido_ahbb: true, cedula_ahbb: true },
        },
        emitidoPor_jc: { select: { nombre_ahbb: true, apellido_ahbb: true } },
        inscripcionMateria_jc: {
          include: {
            materia_cjgp: { include: { carrera_cjgp: true } },
            periodo_cjgp: true,
          },
        },
      },
      orderBy: { creadoEn_jc: 'desc' },
    });
  }

  /** Verificación pública por código (la que resuelve el QR). */
  async verificar_jc(codigo_jc: string) {
    const certificado_jc =
      await this.prisma_jc.td_certificado_sobresaliente_jc.findUnique({
        where: { codigo_jc },
        include: {
          alumno_jc: {
            select: { nombre_ahbb: true, apellido_ahbb: true, cedula_ahbb: true },
          },
          inscripcionMateria_jc: {
            include: {
              materia_cjgp: { include: { carrera_cjgp: true } },
              periodo_cjgp: true,
            },
          },
        },
      });

    if (!certificado_jc || certificado_jc.anulado_jc) {
      return { valido: false, mensaje: 'Certificado no encontrado o anulado.' };
    }

    return {
      valido: true,
      codigo: certificado_jc.codigo_jc,
      alumno: `${certificado_jc.alumno_jc.nombre_ahbb} ${certificado_jc.alumno_jc.apellido_ahbb}`,
      cedula: certificado_jc.alumno_jc.cedula_ahbb,
      materia: `${certificado_jc.inscripcionMateria_jc.materia_cjgp.codigo_cjgp} — ${certificado_jc.inscripcionMateria_jc.materia_cjgp.nombre_cjgp}`,
      carrera: certificado_jc.inscripcionMateria_jc.materia_cjgp.carrera_cjgp.nombre_cjgp,
      periodo: certificado_jc.inscripcionMateria_jc.periodo_cjgp.nombre_cjgp,
      notaFinal: Number(certificado_jc.notaFinal_jc),
      hash: certificado_jc.hashVerificacion_jc,
      emitidoEn: certificado_jc.creadoEn_jc,
    };
  }

  /**
   * Genera el PDF. El alumno solo puede descargar el suyo; Control de Estudios
   * y el administrador pueden descargar cualquiera.
   */
  async generarPdf_jc(
    id_certificado_jc: number,
    id_usuario_jc: number,
    rol_jc: string,
  ): Promise<{ buffer: Buffer; codigo: string }> {
    const certificado_jc =
      await this.prisma_jc.td_certificado_sobresaliente_jc.findUnique({
        where: { id_certificado_sob_jc: id_certificado_jc },
        include: {
          alumno_jc: true,
          inscripcionMateria_jc: {
            include: {
              materia_cjgp: {
                include: { carrera_cjgp: true, profesor_cjgp: true },
              },
              periodo_cjgp: true,
            },
          },
        },
      });

    if (!certificado_jc || certificado_jc.anulado_jc) {
      throw new NotFoundException('Certificado no encontrado.');
    }

    const esDueno_jc = certificado_jc.id_alumno_cer_jc === id_usuario_jc;
    const esPersonal_jc =
      rol_jc === ROLES_JC.ADMIN || rol_jc === ROLES_JC.CONTROL_ESTUDIOS;
    if (!esDueno_jc && !esPersonal_jc) {
      throw new ForbiddenException('No puedes descargar un certificado ajeno.');
    }

    const qr_jc = await QRCode.toDataURL(
      this.tunnelService_jc.construirUrl_ahbb(
        `/api/control-estudios/certificados-sobresaliente/verificar/${certificado_jc.codigo_jc}`,
      ),
      { margin: 1, width: 200, color: { dark: AZUL_JC, light: '#ffffff' } },
    ).catch(() => null);

    const definicion_jc = this.construirDocumento_jc(certificado_jc, qr_jc);
    const buffer_jc = await this.renderizarPdf_jc(definicion_jc);

    return { buffer: buffer_jc, codigo: certificado_jc.codigo_jc };
  }

  // ── Auxiliares ────────────────────────────────────────────────

  private construirCodigo_jc(
    periodo_jc: string,
    materia_jc: string,
    cedula_jc: string,
  ) {
    const sufijo_jc = Date.now().toString(36).toUpperCase().slice(-4);
    const cedulaLimpia_jc = cedula_jc.replace(/[^0-9A-Za-z]/g, '');
    return `SOB-${periodo_jc}-${materia_jc}-${cedulaLimpia_jc}-${sufijo_jc}`;
  }

  private calcularHash_jc(contenido_jc: Record<string, unknown>) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(contenido_jc))
      .digest('hex');
  }

  private renderizarPdf_jc(definicion_jc: TDocumentDefinitions): Promise<Buffer> {
    const fuentes_jc = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const impresora_jc = new PdfPrinter(fuentes_jc, fs, new URLResolver(fs));

    return new Promise(async (resolver_jc, rechazar_jc) => {
      try {
        const documento_jc = await impresora_jc.createPdfKitDocument(definicion_jc);
        const fragmentos_jc: Buffer[] = [];
        documento_jc.on('data', (fragmento_jc: Buffer) =>
          fragmentos_jc.push(fragmento_jc),
        );
        documento_jc.on('end', () => resolver_jc(Buffer.concat(fragmentos_jc)));
        documento_jc.on('error', rechazar_jc);
        documento_jc.end();
      } catch (error_jc) {
        this.logger_jc.error(`Error generando el PDF: ${String(error_jc)}`);
        rechazar_jc(error_jc);
      }
    });
  }

  /** Diseño del certificado: horizontal, con marco dorado y sello de excelencia. */
  private construirDocumento_jc(
    certificado_jc: any,
    qr_jc: string | null,
  ): TDocumentDefinitions {
    const materia_jc = certificado_jc.inscripcionMateria_jc.materia_cjgp;
    const carrera_jc = materia_jc.carrera_cjgp;
    const periodo_jc = certificado_jc.inscripcionMateria_jc.periodo_cjgp;
    const profesor_jc = materia_jc.profesor_cjgp;
    const alumno_jc = certificado_jc.alumno_jc;

    const fecha_jc = new Date(
      certificado_jc.creadoEn_jc ?? Date.now(),
    ).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return {
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [55, 50, 55, 45],
      defaultStyle: { font: 'Helvetica' },
      background: () => ({
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 792, h: 612, color: '#fffdf5' },
          {
            type: 'rect',
            x: 18,
            y: 18,
            w: 756,
            h: 576,
            lineWidth: 3,
            lineColor: DORADO_JC,
          },
          {
            type: 'rect',
            x: 26,
            y: 26,
            w: 740,
            h: 560,
            lineWidth: 0.8,
            lineColor: DORADO_JC,
          },
          // Cintillo superior dorado
          { type: 'rect', x: 26, y: 26, w: 740, h: 10, color: DORADO_CLARO_JC },
        ],
      }),
      content: [
        {
          text: [
            { text: 'ACADEMIA ', bold: true, fontSize: 15, color: AZUL_JC },
            { text: 'H&B', bold: true, fontSize: 15, color: '#f2a33c' },
          ],
          alignment: 'center',
          margin: [0, 0, 0, 2],
        },
        {
          text: 'CONTROL DE ESTUDIOS · EDUCACIÓN SUPERIOR',
          alignment: 'center',
          fontSize: 8,
          color: '#7a7a7a',
          characterSpacing: 1.5,
        },
        {
          text: 'CERTIFICADO DE SOBRESALIENTE',
          alignment: 'center',
          bold: true,
          fontSize: 28,
          color: DORADO_JC,
          margin: [0, 18, 0, 2],
        },
        {
          text: 'Reconocimiento a la Excelencia Académica',
          alignment: 'center',
          italics: true,
          fontSize: 11,
          color: '#8a6d1f',
          margin: [0, 0, 0, 18],
        },
        {
          text: 'La Academia H&B otorga el presente reconocimiento a',
          alignment: 'center',
          fontSize: 10.5,
          color: '#444444',
        },
        {
          text: `${alumno_jc.nombre_ahbb} ${alumno_jc.apellido_ahbb}`.toUpperCase(),
          alignment: 'center',
          bold: true,
          fontSize: 22,
          color: AZUL_JC,
          margin: [0, 8, 0, 2],
        },
        {
          text: `C.I. ${alumno_jc.cedula_ahbb}`,
          alignment: 'center',
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 12],
        },
        {
          text: [
            { text: 'por haber aprobado la unidad curricular ', fontSize: 10.5 },
            {
              text: `${materia_jc.codigo_cjgp} — ${materia_jc.nombre_cjgp}`,
              bold: true,
              fontSize: 11.5,
              color: AZUL_JC,
            },
            { text: ' de la carrera ', fontSize: 10.5 },
            { text: carrera_jc.nombre_cjgp, bold: true, fontSize: 11.5, color: AZUL_JC },
            { text: `, durante el período académico ${periodo_jc.nombre_cjgp}, con una `, fontSize: 10.5 },
            { text: 'calificación definitiva de ', fontSize: 10.5 },
            {
              text: `${Number(certificado_jc.notaFinal_jc)} puntos`,
              bold: true,
              fontSize: 13,
              color: DORADO_JC,
            },
            { text: ', ubicándose en el rango de excelencia académica.', fontSize: 10.5 },
          ],
          alignment: 'center',
          lineHeight: 1.35,
          margin: [40, 0, 40, 16],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  canvas: [
                    { type: 'line', x1: 15, y1: 0, x2: 185, y2: 0, lineWidth: 0.8 },
                  ],
                },
                {
                  text: profesor_jc
                    ? `${profesor_jc.nombre_ahbb} ${profesor_jc.apellido_ahbb}`
                    : 'Profesor de la materia',
                  fontSize: 8,
                  margin: [15, 4, 0, 0],
                  bold: true,
                },
                {
                  text: 'Profesor de la materia',
                  fontSize: 7,
                  color: '#777777',
                  margin: [15, 0, 0, 0],
                },
              ],
            },
            {
              width: 'auto',
              stack: qr_jc
                ? [
                    { image: qr_jc, width: 72, alignment: 'center' },
                    {
                      text: 'Verificar autenticidad',
                      fontSize: 6.5,
                      alignment: 'center',
                      color: '#777777',
                      margin: [0, 2, 0, 0],
                    },
                  ]
                : [],
            },
            {
              width: '*',
              stack: [
                {
                  canvas: [
                    { type: 'line', x1: 35, y1: 0, x2: 205, y2: 0, lineWidth: 0.8 },
                  ],
                },
                {
                  text: 'Control de Estudios',
                  fontSize: 8,
                  margin: [35, 4, 0, 0],
                  bold: true,
                },
                {
                  text: `Emitido el ${fecha_jc}`,
                  fontSize: 7,
                  color: '#777777',
                  margin: [35, 0, 0, 0],
                },
              ],
            },
          ],
          columnGap: 10,
          margin: [0, 10, 0, 0],
        },
        {
          text: `Código: ${certificado_jc.codigo_jc}   |   Hash SHA-256: ${certificado_jc.hashVerificacion_jc}`,
          fontSize: 5.5,
          color: '#999999',
          alignment: 'center',
          margin: [0, 14, 0, 0],
        },
      ],
    };
  }
}
