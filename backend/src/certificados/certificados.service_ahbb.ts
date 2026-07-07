import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TunnelService_ahbb } from '../common/tunnel/tunnel.service_ahbb';
import * as fs from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
// @ts-ignore - pdfmake 0.3.x exporta el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import URLResolver from 'pdfmake/js/URLResolver';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class CertificadosService_ahbb {
  private readonly logger_ahbb = new Logger(CertificadosService_ahbb.name);

  constructor(
    private readonly prisma_ahbb: PrismaService,
    private readonly tunnelService_ahbb: TunnelService_ahbb,
  ) {}

  /**
   * Formaliza la emisión de un certificado para una inscripción aprobada.
   * Genera dinámicamente un código QR de verificación vinculado al portal público de la academia.
   */
  async emitirCertificado_ahbb(id_inscripcion_ahbb: number) {
    // Verificar inscripción
    const inscripcion_ahbb =
      await this.prisma_ahbb.td_inscripcion_ahbb.findUnique({
        where: { id_inscripcion_ahbb },
        include: {
          alumno: true,
          curso: { include: { profesor: true } },
          certificado: true,
        },
      });

    if (!inscripcion_ahbb) {
      throw new NotFoundException('Inscripción no encontrada.');
    }

    if (inscripcion_ahbb.estatus_ahbb !== 'APROBADO') {
      throw new BadRequestException(
        'Solo se pueden emitir certificados para inscripciones con estado APROBADO.',
      );
    }

    // Verificar si el profesor tiene firma digital cargada
    if (!inscripcion_ahbb.curso.profesor.firmaDigital_ahbb) {
      throw new BadRequestException(
        'El profesor debe cargar su firma digital antes de emitir certificados.',
      );
    }

    if (inscripcion_ahbb.certificado) {
      throw new BadRequestException(
        'Ya existe un certificado emitido para esta inscripción.',
      );
    }

    // 1. Crear el registro del certificado primero para obtener su ID real
    const certificado_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.create({
        data: {
          id_inscripcion_certificado_ahbb: id_inscripcion_ahbb,
          codigoQrUrl_ahbb: 'PENDIENTE', 
        },
      });

    // 2. Generar QR apuntando al PDF público (accesible desde cualquier red vía túnel Cloudflare)
    const urlVerificacion_ahbb = this.tunnelService_ahbb.construirUrl_ahbb(
      `/api/certificados/publico/${certificado_ahbb.id_certificado_ahbb}/pdf`,
    );

    const qrBase64_ahbb = await QRCode.toDataURL(urlVerificacion_ahbb, {
      margin: 1,
      width: 200,
      color: { dark: '#1b2a4a', light: '#ffffff' },
    });

    // 3. Actualizar el certificado con el QR real
    await this.prisma_ahbb.td_certificado_ahbb.update({
      where: { id_certificado_ahbb: certificado_ahbb.id_certificado_ahbb },
      data: { codigoQrUrl_ahbb: qrBase64_ahbb },
    });

    return {
      exito: true,
      certificado: { ...certificado_ahbb, codigoQrUrl_ahbb: qrBase64_ahbb },
      mensaje: `Certificado emitido exitosamente para ${inscripcion_ahbb.alumno.nombre_ahbb} ${inscripcion_ahbb.alumno.apellido_ahbb}.`,
    };
  }

  /**
   * Emitir certificados masivamente para todos los APROBADOS de un curso
   * que aún no tengan certificado.
   */
  async emitirCertificadosMasivo_ahbb(id_curso_ahbb: number) {
    const inscripciones_ahbb =
      await this.prisma_ahbb.td_inscripcion_ahbb.findMany({
        where: {
          id_curso_inscripcion_ahbb: id_curso_ahbb,
          estatus_ahbb: 'APROBADO',
          certificado: null,
        },
        include: { alumno: true },
      });

    if (inscripciones_ahbb.length === 0) {
      return {
        exito: true,
        emitidos: 0,
        mensaje:
          'No hay alumnos aprobados pendientes de certificado en este curso.',
      };
    }

    const resultados_ahbb: any[] = [];
    for (const inscripcion_ahbb of inscripciones_ahbb) {
      try {
        const resultado_ahbb = await this.emitirCertificado_ahbb(
          inscripcion_ahbb.id_inscripcion_ahbb,
        );
        resultados_ahbb.push(resultado_ahbb);
      } catch (error_ahbb) {
        this.logger_ahbb.error(
          `Error al emitir certificado para inscripción ${inscripcion_ahbb.id_inscripcion_ahbb}: ${error_ahbb.message}`,
        );
      }
    }

    return {
      exito: true,
      emitidos: resultados_ahbb.length,
      total: inscripciones_ahbb.length,
      mensaje: `Se emitieron ${resultados_ahbb.length} de ${inscripciones_ahbb.length} certificados.`,
    };
  }

  /**
   * Recupera el historial de certificaciones obtenidas por un alumno específico.
   */
  async obtenerCertificadosAlumno_ahbb(id_usuario_ahbb: number) {
    const certificados_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findMany({
        where: {
          inscripcion: {
            id_usuario_inscripcion_ahbb: id_usuario_ahbb,
          },
        },
        include: {
          inscripcion: {
            include: {
              alumno: {
                select: {
                  id_usuario_ahbb: true,
                  nombre_ahbb: true,
                  apellido_ahbb: true,
                  cedula_ahbb: true,
                },
              },
              curso: {
                include: {
                  profesor: {
                    select: {
                      nombre_ahbb: true,
                      apellido_ahbb: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { creadoEn_ahbb: 'desc' },
      });

    return certificados_ahbb.map((cert_ahbb) =>
      this.mapearCertificado_ahbb(cert_ahbb),
    );
  }

  /**
   * Obtener certificados de un curso.
   */
  async obtenerCertificadosCurso_ahbb(id_curso_ahbb: number) {
    const certificados_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findMany({
        where: {
          inscripcion: {
            id_curso_inscripcion_ahbb: id_curso_ahbb,
          },
        },
        include: {
          inscripcion: {
            include: {
              alumno: {
                select: {
                  id_usuario_ahbb: true,
                  nombre_ahbb: true,
                  apellido_ahbb: true,
                  cedula_ahbb: true,
                },
              },
              curso: {
                include: {
                  profesor: {
                    select: {
                      nombre_ahbb: true,
                      apellido_ahbb: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { creadoEn_ahbb: 'desc' },
      });

    return certificados_ahbb.map((cert_ahbb) =>
      this.mapearCertificado_ahbb(cert_ahbb),
    );
  }

  /**
   * Obtener todos los certificados (admin).
   */
  async obtenerTodos_ahbb() {
    const certificados_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findMany({
        include: {
          inscripcion: {
            include: {
              alumno: {
                select: {
                  id_usuario_ahbb: true,
                  nombre_ahbb: true,
                  apellido_ahbb: true,
                  cedula_ahbb: true,
                },
              },
              curso: {
                include: {
                  profesor: {
                    select: {
                      nombre_ahbb: true,
                      apellido_ahbb: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { creadoEn_ahbb: 'desc' },
      });

    return certificados_ahbb.map((cert_ahbb) =>
      this.mapearCertificado_ahbb(cert_ahbb),
    );
  }

  /**
   * Obtener certificados de los cursos de un profesor.
   */
  async obtenerCertificadosProfesor_ahbb(id_profesor_ahbb: number) {
    const certificados_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findMany({
        where: {
          inscripcion: {
            curso: {
              id_usuario_curso_ahbb: id_profesor_ahbb,
            },
          },
        },
        include: {
          inscripcion: {
            include: {
              alumno: {
                select: {
                  id_usuario_ahbb: true,
                  nombre_ahbb: true,
                  apellido_ahbb: true,
                  cedula_ahbb: true,
                },
              },
              curso: {
                include: {
                  profesor: {
                    select: {
                      nombre_ahbb: true,
                      apellido_ahbb: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { creadoEn_ahbb: 'desc' },
      });

    return certificados_ahbb.map((cert_ahbb) =>
      this.mapearCertificado_ahbb(cert_ahbb),
    );
  }

  /**
   * Proporciona un punto de verificación público para validar la autenticidad de un certificado.
   */
  async verificarCertificado_ahbb(id_certificado_ahbb: number) {
    const certificado_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findUnique({
        where: { id_certificado_ahbb },
        include: {
          inscripcion: {
            include: {
              alumno: {
                select: {
                  nombre_ahbb: true,
                  apellido_ahbb: true,
                  cedula_ahbb: true,
                },
              },
              curso: {
                include: {
                  profesor: {
                    select: {
                      nombre_ahbb: true,
                      apellido_ahbb: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!certificado_ahbb) {
      return { valido: false, mensaje: 'Certificado no encontrado.' };
    }

    const ins_ahbb = certificado_ahbb.inscripcion;

    return {
      valido: true,
      alumno: `${ins_ahbb.alumno.nombre_ahbb} ${ins_ahbb.alumno.apellido_ahbb}`,
      cedula: ins_ahbb.alumno.cedula_ahbb,
      curso: ins_ahbb.curso.nombre_ahbb,
      profesor: `${ins_ahbb.curso.profesor.nombre_ahbb} ${ins_ahbb.curso.profesor.apellido_ahbb}`,
      duracionHoras: ins_ahbb.curso.horasDefinidas_ahbb,
      fechaEmision: certificado_ahbb.creadoEn_ahbb,
      fechaInicioCurso: ins_ahbb.curso.fechaInicio_ahbb,
      fechaFinCurso: ins_ahbb.curso.fechaFin_ahbb,
    };
  }

  /**
   * Anular certificado (admin).
   */
  async anularCertificado_ahbb(id_certificado_ahbb: number) {
    const certificado_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findUnique({
        where: { id_certificado_ahbb },
      });

    if (!certificado_ahbb) {
      throw new NotFoundException('Certificado no encontrado.');
    }

    await this.prisma_ahbb.td_certificado_ahbb.delete({
      where: { id_certificado_ahbb },
    });

    return { exito: true, mensaje: 'Certificado anulado exitosamente.' };
  }

  /**
   * Orquestación de la generación de documentos PDF.
   * Resuelve activos (firmas, fondos), formatea metadatos y construye la definición del documento.
   * @returns Buffer binario del PDF generado.
   */
  async generarPdfCertificado_ahbb(
    id_certificado_ahbb: number,
  ): Promise<Buffer> {
    this.logger_ahbb.log(
      `Generando PDF para certificado ${id_certificado_ahbb}`,
    );

    const certificado_ahbb =
      await this.prisma_ahbb.td_certificado_ahbb.findUnique({
        where: { id_certificado_ahbb },
        include: {
          inscripcion: {
            include: {
              alumno: true,
              curso: {
                include: {
                  profesor: true,
                },
              },
            },
          },
        },
      });

    if (!certificado_ahbb) {
      throw new NotFoundException('Certificado no encontrado.');
    }

    const ins_ahbb = certificado_ahbb.inscripcion;
    const alumno_ahbb = ins_ahbb.alumno;
    const curso_ahbb = ins_ahbb.curso;
    const profesor_ahbb = curso_ahbb.profesor;

    // ── Resolver la imagen de fondo ─────────────────────────────
    let imagenFondo_ahbb: string | null = null;

    // Prioridad 1: imagen del curso (subida por el profesor)
    if (curso_ahbb.imagenBasePdf_ahbb) {
      // Si es Base64 data URI, usarla directamente
      if (curso_ahbb.imagenBasePdf_ahbb.startsWith('data:')) {
        imagenFondo_ahbb = curso_ahbb.imagenBasePdf_ahbb;
      } else {
        // Si es ruta relativa, resolver
        const rutaAbsoluta_ahbb = join(
          process.cwd(),
          curso_ahbb.imagenBasePdf_ahbb,
        );
        if (fs.existsSync(rutaAbsoluta_ahbb)) {
          imagenFondo_ahbb = rutaAbsoluta_ahbb;
        }
      }
    }

    // Prioridad 2: imagen global del administrador
    if (!imagenFondo_ahbb) {
      const config_ahbb =
        await this.prisma_ahbb.td_configuracionglobal_ahbb.findFirst();
      if (config_ahbb?.imagenCertificadoGeneral_ahbb) {
        if (config_ahbb.imagenCertificadoGeneral_ahbb.startsWith('data:')) {
          imagenFondo_ahbb = config_ahbb.imagenCertificadoGeneral_ahbb;
        } else {
          const rutaGlobal_ahbb = join(
            process.cwd(),
            config_ahbb.imagenCertificadoGeneral_ahbb,
          );
          if (fs.existsSync(rutaGlobal_ahbb)) {
            imagenFondo_ahbb = rutaGlobal_ahbb;
          }
        }
      }
    }

    // ── Resolver firma del profesor ─────────────────────────────
    let firmaProfesor_ahbb: string | null = null;
    if (profesor_ahbb.firmaDigital_ahbb) {
      if (profesor_ahbb.firmaDigital_ahbb.startsWith('data:')) {
        firmaProfesor_ahbb = profesor_ahbb.firmaDigital_ahbb;
      } else {
        const rutaFirma_ahbb = join(
          process.cwd(),
          profesor_ahbb.firmaDigital_ahbb,
        );
        if (fs.existsSync(rutaFirma_ahbb)) {
          firmaProfesor_ahbb = rutaFirma_ahbb;
        }
      }
    }

    // ── Formatear fechas ────────────────────────────────────────
    const opcionesFecha_ahbb: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    const fechaInicio_ahbb = curso_ahbb.fechaInicio_ahbb
      ? new Date(curso_ahbb.fechaInicio_ahbb).toLocaleDateString(
          'es-VE',
          opcionesFecha_ahbb,
        )
      : '—';
    const fechaFin_ahbb = curso_ahbb.fechaFin_ahbb
      ? new Date(curso_ahbb.fechaFin_ahbb).toLocaleDateString(
          'es-VE',
          opcionesFecha_ahbb,
        )
      : '—';
    const fechaEmision_ahbb = certificado_ahbb.creadoEn_ahbb
      ? new Date(certificado_ahbb.creadoEn_ahbb).toLocaleDateString(
          'es-VE',
          opcionesFecha_ahbb,
        )
      : new Date().toLocaleDateString('es-VE', opcionesFecha_ahbb);

    // ── QR del certificado ──────────────────────────────────────
    let qrBase64_ahbb = certificado_ahbb.codigoQrUrl_ahbb;

    // Si el QR almacenado NO es data URI (ej: URL vieja), regenerar como base64
    if (!qrBase64_ahbb || !qrBase64_ahbb.startsWith('data:')) {
      const urlVerificacion_ahbb = this.tunnelService_ahbb.construirUrl_ahbb(
        `/api/certificados/verificar/${id_certificado_ahbb}`,
      );
      qrBase64_ahbb = await QRCode.toDataURL(urlVerificacion_ahbb, {
        margin: 1,
        width: 200,
        color: { dark: '#1b2a4a', light: '#ffffff' },
      });

      // Actualizar la BD para futuras descargas
      await this.prisma_ahbb.td_certificado_ahbb.update({
        where: { id_certificado_ahbb },
        data: { codigoQrUrl_ahbb: qrBase64_ahbb },
      });
    }

    // ── Construir definición del PDF ────────────────────────────
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

    const contenido_ahbb: any[] = [];
    const iconPath_ahbb = join(process.cwd(), 'uploads', 'graduation-cap.png');

    // Encabezado
    if (fs.existsSync(iconPath_ahbb)) {
      contenido_ahbb.push({
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            columns: [
              {
                image: iconPath_ahbb,
                width: 38,
                margin: [0, 0, 10, 0],
              },
              {
                width: 'auto',
                text: [
                  { text: 'Academia ', style: 'headerText' },
                  { text: 'H&B', style: 'headerAccent' },
                ],
                margin: [0, 4, 0, 0],
              },
            ],
          },
          { width: '*', text: '' },
        ],
        margin: [0, 15, 0, 5],
      });
    } else {
      contenido_ahbb.push({
        text: [
          { text: 'Academia ', style: 'headerText' },
          { text: 'H&B', style: 'headerAccent' },
        ],
        alignment: 'center',
        margin: [0, 15, 0, 5],
      });
    }

    contenido_ahbb.push({
      text: 'CERTIFICADO DE APROBACIÓN',
      style: 'tituloDocumento',
      alignment: 'center',
      margin: [0, 5, 0, 15],
    });

    // Línea decorativa
    contenido_ahbb.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 550,
              y2: 0,
              lineWidth: 2,
              lineColor: '#f59e0b',
            },
          ],
        },
        { width: '*', text: '' },
      ],
      margin: [0, 0, 0, 15],
    });

    // Texto principal
    contenido_ahbb.push({
      text: 'La Academia H&B certifica que:',
      style: 'preambulo',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });

    contenido_ahbb.push({
      text: `${alumno_ahbb.nombre_ahbb} ${alumno_ahbb.apellido_ahbb}`,
      style: 'nombreAlumno',
      alignment: 'center',
      margin: [0, 0, 0, 5],
    });

    contenido_ahbb.push({
      text: `C.I.: ${alumno_ahbb.cedula_ahbb}`,
      style: 'cedulaAlumno',
      alignment: 'center',
      margin: [0, 0, 0, 15],
    });

    contenido_ahbb.push({
      text: `Ha completado satisfactoriamente el curso:`,
      style: 'textoContenido',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });

    contenido_ahbb.push({
      text: `"${curso_ahbb.nombre_ahbb}"`,
      style: 'nombreCurso',
      alignment: 'center',
      margin: [0, 0, 0, 15],
    });

    contenido_ahbb.push({
      text: `Con una duración de ${curso_ahbb.horasDefinidas_ahbb} horas académicas, impartido desde el ${fechaInicio_ahbb} hasta el ${fechaFin_ahbb}.`,
      style: 'textoContenido',
      alignment: 'center',
      margin: [40, 0, 40, 10],
    });

    // Espaciado correspondiente (el usuario solicitó no imprimir la calificación obtenida)
    contenido_ahbb.push({ text: '', margin: [0, 0, 0, 20] });

    // ── Sección inferior: Firma + QR ────────────────────────────
    const columnaFirma_ahbb: any[] = [];

    if (firmaProfesor_ahbb) {
      columnaFirma_ahbb.push({
        image: firmaProfesor_ahbb,
        width: 190,
        alignment: 'center',
        margin: [0, 0, 0, 5],
      });
    }

    // Línea de firma
    columnaFirma_ahbb.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 200,
          y2: 0,
          lineWidth: 1,
          lineColor: '#1b2a4a',
        },
      ],
      alignment: 'center',
      margin: [0, 0, 0, 5],
    });

    columnaFirma_ahbb.push({
      text: `Prof. ${profesor_ahbb.nombre_ahbb} ${profesor_ahbb.apellido_ahbb}`,
      style: 'firmaTexto',
      alignment: 'center',
    });

    columnaFirma_ahbb.push({
      text: 'Instructor del Curso',
      style: 'firmaSubtexto',
      alignment: 'center',
    });

    contenido_ahbb.push({
      columns: [
        {
          width: '*',
          stack: columnaFirma_ahbb,
        },
        {
          width: 120,
          stack: [
            {
              image: qrBase64_ahbb,
              width: 100,
              alignment: 'center',
            },
            {
              text: 'Verificar certificado',
              fontSize: 7,
              bold: true,
              alignment: 'center',
              color: '#1b2a4a',
              margin: [0, 3, 0, 0],
            },
          ],
        },
      ],
      margin: [40, 10, 40, 0],
    });

    // Fecha de emisión
    contenido_ahbb.push({
      text: `Emitido el ${fechaEmision_ahbb}`,
      style: 'fechaEmision',
      alignment: 'center',
      margin: [0, 5, 0, 0],
    });

    contenido_ahbb.push({
      text: `Certificado Nro. ${String(certificado_ahbb.id_certificado_ahbb).padStart(6, '0')}`,
      style: 'nroCertificado',
      alignment: 'center',
      margin: [0, 5, 0, 0],
      pageBreak: 'after',
    });

    // ── SEGUNDA PÁGINA: TEMARIO ────────────────────────────────
    const temario_ahbb =
      curso_ahbb.temarioTexto_ahbb ||
      'Contenido programático pendiente de cargar.';

    this.logger_ahbb.log(
      `Verificando temario para curso: ${curso_ahbb.nombre_ahbb}`,
    );

    // Encabezado de la segunda página
    contenido_ahbb.push({
      columns: [
        {
          width: '*',
          text: [
            { text: 'Temario del Curso: ', style: 'temarioSubtitle' },
            { text: `"${curso_ahbb.nombre_ahbb}"`, style: 'temarioTitlePage' },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          width: 'auto',
          stack: [
            { text: 'Academia H&B', style: 'headerMini' },
            {
              text: `Certificado Nro. ${String(certificado_ahbb.id_certificado_ahbb).padStart(6, '0')}`,
              fontSize: 8,
              color: '#94a3b8',
              alignment: 'right',
            },
          ],
        },
      ],
    });

    contenido_ahbb.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 720,
          y2: 0,
          lineWidth: 1,
          lineColor: '#f59e0b',
        },
      ],
      margin: [0, 0, 0, 20],
    });

    // Contenido del temario
    const lineasTemario_ahbb = temario_ahbb
      .split('\n')
      .filter((l) => l.trim() !== '');

    contenido_ahbb.push({
      text: 'CONTENIDO PROGRAMÁTICO',
      style: 'temarioSeccionHeader',
      margin: [0, 0, 0, 15],
    });

    const itemsTemario_ahbb = lineasTemario_ahbb.map((linea) => {
      return {
        columns: [
          {
            width: 15,
            text: '•',
            color: '#f59e0b',
            bold: true,
            fontSize: 14,
          },
          {
            width: '*',
            text: linea.trim(),
            style: 'temarioItemText',
          },
        ],
        margin: [0, 0, 0, 8],
      };
    });

    contenido_ahbb.push({
      stack: itemsTemario_ahbb,
      margin: [20, 0, 20, 0],
    });

    // Footer de la segunda página
    contenido_ahbb.push({
      text: 'Este temario forma parte integral del certificado de aprobación emitido por Academia H&B.',
      style: 'temarioFooterText',
      margin: [0, 30, 0, 0],
      alignment: 'center',
    });

    // ── Imagen de fondo (background) ────────────────────────────
    const background_ahbb: any = imagenFondo_ahbb
      ? [
          {
            image: imagenFondo_ahbb,
            width: 595.28, // A4 width in points
            height: 841.89, // A4 height in points
            absolutePosition: { x: 0, y: 0 },
            opacity: 0.15,
          },
        ]
      : undefined;

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Helvetica' },
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [60, 40, 60, 40],
      background: background_ahbb
        ? () => {
            return [
              {
                image: imagenFondo_ahbb!,
                width: 841.89, // landscape A4
                height: 595.28,
                absolutePosition: { x: 0, y: 0 },
                opacity: 0.15,
              },
            ];
          }
        : undefined,
      content: contenido_ahbb,
      styles: {
        headerText: { fontSize: 28, bold: true, color: '#1b2a4a' },
        headerAccent: { fontSize: 28, bold: true, color: '#f59e0b' },
        tituloDocumento: {
          fontSize: 22,
          bold: true,
          color: '#1b2a4a',
          characterSpacing: 3,
        },
        preambulo: { fontSize: 13, color: '#475569' },
        nombreAlumno: { fontSize: 26, bold: true, color: '#1b2a4a' },
        cedulaAlumno: { fontSize: 12, color: '#64748b' },
        textoContenido: { fontSize: 12, color: '#334155', lineHeight: 1.5 },
        nombreCurso: {
          fontSize: 18,
          bold: true,
          color: '#1b2a4a',
          italics: true,
        },
        notaFinal: { fontSize: 13, bold: true, color: '#059669' },
        firmaTexto: { fontSize: 11, bold: true, color: '#1b2a4a' },
        firmaSubtexto: { fontSize: 9, color: '#64748b' },
        fechaEmision: { fontSize: 10, color: '#94a3b8' },
        nroCertificado: { fontSize: 9, color: '#94a3b8' },
        temarioSubtitle: { fontSize: 13, color: '#64748b' },
        temarioTitlePage: { fontSize: 14, bold: true, color: '#1b2a4a' },
        headerMini: { fontSize: 11, bold: true, color: '#1b2a4a', alignment: 'right' },
        temarioSeccionHeader: { fontSize: 12, bold: true, color: '#1b2a4a', characterSpacing: 1 },
        temarioItemText: { fontSize: 11, color: '#334155', lineHeight: 1.4 },
        temarioFooterText: { fontSize: 9, italics: true, color: '#94a3b8' },
      },
    };

    return new Promise<Buffer>(async (resolve, reject) => {
      try {
        const pdfDoc = await printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
      } catch (error) {
        this.logger_ahbb.error('Error generando PDF del certificado:', error);
        reject(error);
      }
    });
  }

  /**
   * Mapear certificado a formato de respuesta.
   */
  private mapearCertificado_ahbb(cert_ahbb: any) {
    const ins_ahbb = cert_ahbb.inscripcion;
    return {
      id: cert_ahbb.id_certificado_ahbb,
      alumno: `${ins_ahbb.alumno.nombre_ahbb} ${ins_ahbb.alumno.apellido_ahbb}`,
      alumnoId: ins_ahbb.alumno.id_usuario_ahbb,
      cedulaAlumno: ins_ahbb.alumno.cedula_ahbb,
      curso: ins_ahbb.curso.nombre_ahbb,
      cursoId: ins_ahbb.id_curso_inscripcion_ahbb,
      profesor: `${ins_ahbb.curso.profesor.nombre_ahbb} ${ins_ahbb.curso.profesor.apellido_ahbb}`,
      duracionHoras: ins_ahbb.curso.horasDefinidas_ahbb,
      fechaEmision: cert_ahbb.creadoEn_ahbb,
      inscripcionId: ins_ahbb.id_inscripcion_ahbb,
    };
  }
}
