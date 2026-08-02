import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CalificacionesService_jc } from './calificaciones.service_jc';
import { AuditoriaService_jc } from '../auditoria/auditoria.service_jc';
import {
  ACCIONES_JC,
  MODULOS_AUDITORIA_JC,
} from '../auditoria/constantes/acciones-auditoria_jc';
import * as crypto from 'crypto';
import * as fs from 'fs';
// @ts-ignore - pdfmake 0.3.x exporta el constructor en una subruta para Node
import PdfPrinter from 'pdfmake/js/Printer';
import URLResolver from 'pdfmake/js/URLResolver';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const VERDE_MEDIO_JC = '#2e7d32';

/**
 * ActasService_jc — Subsistema de Generación de Actas.
 *
 * Emite el ACTA BLANCA: formato tabular oficial con las notas de cada corte,
 * las reparaciones aplicadas, la definitiva y la condición de cada alumno.
 * (La antigua "Acta Verde" de llenado manual fue descontinuada del sistema.)
 *
 * Cada emisión queda registrada con un hash SHA-256 del contenido, de modo que
 * siempre pueda verificarse que el acta física firmada coincide con el respaldo
 * digital. Las columnas del acta son dinámicas: nacen del plan de evaluación
 * configurado por la coordinación (metadatos).
 */
@Injectable()
export class ActasService_jc {
  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly calificacionesService_jc: CalificacionesService_jc,
    private readonly auditoriaService_jc: AuditoriaService_jc,
  ) {}

  /** Historial de actas emitidas (auditoría del administrador). */
  async obtenerRegistro_jc() {
    return this.prisma_jc.td_acta_jc.findMany({
      include: {
        materia_jc: { include: { carrera_cjgp: true } },
        periodo_jc: true,
        generadaPor_jc: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
      },
      orderBy: { creadoEn_jc: 'desc' },
    });
  }

  /**
   * Genera el PDF del acta, registra la emisión con su hash de verificación,
   * la deja en la bitácora de auditoría y devuelve el buffer para descargar.
   */
  async generarActaPdf_jc(
    id_materia_jc: number,
    id_periodo_jc: number,
    idUsuarioGenera_jc: number,
  ): Promise<{ buffer: Buffer; codigo: string }> {
    const tipo_jc = 'BLANCA';
    const matriz_jc = await this.calificacionesService_jc.obtenerMatriz_jc(
      id_materia_jc,
      id_periodo_jc,
    );

    if (matriz_jc.filas.length === 0) {
      throw new NotFoundException(
        'No hay alumnos inscritos: no se puede emitir el acta.',
      );
    }

    // ── Hash de verificación: huella del contenido académico del acta ──
    const contenidoVerificable_jc = JSON.stringify({
      materia: matriz_jc.materia.codigo_cjgp,
      periodo: matriz_jc.periodo.nombre_cjgp,
      plan: matriz_jc.plan.nombre_jc,
      filas: matriz_jc.filas.map((fila_jc) => ({
        cedula: fila_jc.alumno_jc.cedula_ahbb,
        notas: fila_jc.notas_jc,
        definitiva: fila_jc.definitiva_jc,
      })),
    });
    const hash_jc = crypto
      .createHash('sha256')
      .update(contenidoVerificable_jc)
      .digest('hex');

    const codigo_jc = `ACTA-${matriz_jc.periodo.nombre_cjgp}-${matriz_jc.materia.codigo_cjgp}-${Date.now().toString(36).toUpperCase()}`;

    // Registrar la emisión (respaldo auditable e inalterable)
    const acta_jc = await this.prisma_jc.td_acta_jc.create({
      data: {
        codigo_jc,
        tipo_jc,
        hashVerificacion_jc: hash_jc,
        id_materia_acta_jc: id_materia_jc,
        id_periodo_acta_jc: id_periodo_jc,
        generadaPorUsuarioId_jc: idUsuarioGenera_jc,
      },
    });

    // Rastro para la auditoría de Control de Estudios
    await this.auditoriaService_jc.registrarConAutor_jc(idUsuarioGenera_jc, {
      modulo_jc: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
      accion_jc: ACCIONES_JC.ACTA_EMITIDA,
      descripcion_jc: `emitió el acta ${codigo_jc} de ${matriz_jc.materia.codigo_cjgp} — ${matriz_jc.materia.nombre_cjgp} (${matriz_jc.periodo.nombre_cjgp}) con ${matriz_jc.filas.length} alumno(s)`,
      id_materia_aud_jc: id_materia_jc,
      id_periodo_aud_jc: id_periodo_jc,
      entidad_jc: 'td_acta_jc',
      id_entidad_jc: acta_jc.id_acta_jc,
      metodo_jc: 'GET',
      ruta_jc: `/control-estudios/actas/${id_materia_jc}/${id_periodo_jc}/pdf`,
      detalle_jc: { codigo: codigo_jc, hash: hash_jc },
    });

    const definicion_jc = this.construirActaBlanca_jc(matriz_jc, codigo_jc, hash_jc);
    const buffer_jc = await this.renderizarPdf_jc(definicion_jc);
    return { buffer: buffer_jc, codigo: codigo_jc };
  }

  /** Convierte la definición pdfmake en un buffer binario. */
  private renderizarPdf_jc(definicion_jc: TDocumentDefinitions): Promise<Buffer> {
    const fonts_jc = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const printer_jc = new PdfPrinter(fonts_jc, fs, new URLResolver(fs));

    // En pdfmake 0.3.x createPdfKitDocument es asíncrono
    return new Promise(async (resolver_jc, rechazar_jc) => {
      try {
        const documento_jc = await printer_jc.createPdfKitDocument(definicion_jc);
        const fragmentos_jc: Buffer[] = [];
        documento_jc.on('data', (fragmento_jc: Buffer) =>
          fragmentos_jc.push(fragmento_jc),
        );
        documento_jc.on('end', () => resolver_jc(Buffer.concat(fragmentos_jc)));
        documento_jc.on('error', rechazar_jc);
        documento_jc.end();
      } catch (error_jc) {
        rechazar_jc(error_jc);
      }
    });
  }

  /** Encabezado institucional común a ambas plantillas. */
  private construirEncabezado_jc(
    matriz_jc: any,
    titulo_jc: string,
    color_jc: string,
  ): any[] {
    const alcance_jc = matriz_jc.plan.id_carrera_plan_jc
      ? matriz_jc.materia.carrera_cjgp.nombre_cjgp
      : 'Institucional';

    return [
      {
        text: [
          { text: 'ACADEMIA ', bold: true, fontSize: 16 },
          { text: 'H&B', bold: true, fontSize: 16, color: '#f2a33c' },
        ],
        alignment: 'center' as const,
        margin: [0, 0, 0, 2] as [number, number, number, number],
      },
      {
        text: 'CONTROL DE ESTUDIOS — GESTIÓN DE NOTAS Y ACTAS',
        alignment: 'center' as const,
        fontSize: 9,
        color: '#555555',
      },
      {
        text: titulo_jc,
        alignment: 'center' as const,
        bold: true,
        fontSize: 13,
        color: color_jc,
        margin: [0, 8, 0, 10] as [number, number, number, number],
      },
      {
        columns: [
          {
            width: '*',
            fontSize: 8,
            stack: [
              { text: [{ text: 'Carrera: ', bold: true }, matriz_jc.materia.carrera_cjgp.nombre_cjgp] },
              { text: [{ text: 'Materia: ', bold: true }, `${matriz_jc.materia.codigo_cjgp} — ${matriz_jc.materia.nombre_cjgp}`] },
              { text: [{ text: 'Créditos: ', bold: true }, String(matriz_jc.materia.creditos_cjgp)] },
            ],
          },
          {
            width: '*',
            fontSize: 8,
            stack: [
              { text: [{ text: 'Período: ', bold: true }, matriz_jc.periodo.nombre_cjgp] },
              { text: [{ text: 'Plan de evaluación: ', bold: true }, `${matriz_jc.plan.nombre_jc} (${alcance_jc})`] },
              { text: [{ text: 'Escala: ', bold: true }, `0 a ${Number(matriz_jc.plan.notaMaxima_jc)} — Aprobatoria: ${Number(matriz_jc.plan.notaAprobatoria_jc)}`] },
            ],
          },
          {
            width: 'auto',
            fontSize: 8,
            stack: [
              { text: [{ text: 'Fecha de emisión: ', bold: true }, new Date().toLocaleDateString('es-VE')] },
              { text: [{ text: 'Alumnos: ', bold: true }, String(matriz_jc.filas.length)] },
            ],
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
    ];
  }

  /** Pie común: hash de verificación y línea de firmas. */
  private construirPie_jc(codigo_jc: string, hash_jc: string): any[] {
    return [
      {
        text: `Código: ${codigo_jc}   |   Hash SHA-256 de verificación: ${hash_jc}`,
        fontSize: 6,
        color: '#777777',
        margin: [0, 12, 0, 20] as [number, number, number, number],
      },
      {
        columns: [
          { width: '*', stack: [{ canvas: [{ type: 'line', x1: 20, y1: 0, x2: 160, y2: 0, lineWidth: 0.7 }] }, { text: 'Profesor de la materia', fontSize: 7, margin: [20, 3, 0, 0] }] },
          { width: '*', stack: [{ canvas: [{ type: 'line', x1: 20, y1: 0, x2: 160, y2: 0, lineWidth: 0.7 }] }, { text: 'Control de Estudios', fontSize: 7, margin: [20, 3, 0, 0] }] },
          { width: '*', stack: [{ canvas: [{ type: 'line', x1: 20, y1: 0, x2: 160, y2: 0, lineWidth: 0.7 }] }, { text: 'Coordinación Académica', fontSize: 7, margin: [20, 3, 0, 0] }] },
        ],
      },
    ];
  }

  /**
   * ACTA BLANCA: tabla estándar con las notas cargadas, la definitiva y la
   * condición final. Las columnas de evaluaciones son dinámicas (plan).
   */
  private construirActaBlanca_jc(
    matriz_jc: any,
    codigo_jc: string,
    hash_jc: string,
  ): TDocumentDefinitions {
    const items_jc = matriz_jc.plan.items_jc;

    const encabezadosTabla_jc = [
      { text: '#', bold: true, fontSize: 7, alignment: 'center' },
      { text: 'Cédula', bold: true, fontSize: 7 },
      { text: 'Apellidos y Nombres', bold: true, fontSize: 7 },
      ...items_jc.map((item_jc: any) => ({
        text: `${item_jc.nombre_jc}\n(${Number(item_jc.peso_jc)}%)`,
        bold: true,
        fontSize: 7,
        alignment: 'center',
      })),
      { text: 'Definitiva', bold: true, fontSize: 7, alignment: 'center' },
      { text: 'Condición', bold: true, fontSize: 7, alignment: 'center' },
    ];

    /**
     * Celda de nota: si el corte tuvo reparación se imprime la nota efectiva
     * seguida de (R) y en color, para que el acta refleje qué se reparó.
     */
    const celdaNota_jc = (fila_jc: any, item_jc: any) => {
      const nota_jc = fila_jc.notas_jc[item_jc.id_item_jc];
      const reparacion_jc = (fila_jc.reparaciones_jc ?? []).find(
        (candidata_jc: any) => candidata_jc.id_item_jc === item_jc.id_item_jc,
      );

      if (!reparacion_jc) {
        return {
          text: nota_jc !== undefined ? String(nota_jc) : '—',
          fontSize: 7,
          alignment: 'center' as const,
        };
      }

      const efectiva_jc = Math.max(nota_jc ?? 0, Number(reparacion_jc.valor_jc));
      return {
        text: `${efectiva_jc} (R)`,
        fontSize: 7,
        alignment: 'center' as const,
        color: '#0d47a1',
        bold: true,
      };
    };

    const hayReparaciones_jc = matriz_jc.filas.some(
      (fila_jc: any) => (fila_jc.reparaciones_jc ?? []).length > 0,
    );

    const filasTabla_jc = matriz_jc.filas.map((fila_jc: any, indice_jc: number) => [
      { text: String(indice_jc + 1), fontSize: 7, alignment: 'center' },
      { text: fila_jc.alumno_jc.cedula_ahbb, fontSize: 7 },
      { text: `${fila_jc.alumno_jc.apellido_ahbb}, ${fila_jc.alumno_jc.nombre_ahbb}`, fontSize: 7 },
      ...items_jc.map((item_jc: any) => celdaNota_jc(fila_jc, item_jc)),
      { text: String(fila_jc.definitiva_jc), fontSize: 7, alignment: 'center', bold: true },
      // Mientras el acta no se cierre (estatus INSCRITO), la condición es EN CURSO
      {
        text:
          fila_jc.estatus_jc === 'INSCRITO'
            ? 'EN CURSO'
            : fila_jc.estatus_jc,
        fontSize: 6.5,
        alignment: 'center',
        color:
          fila_jc.estatus_jc === 'APROBADO'
            ? VERDE_MEDIO_JC
            : fila_jc.estatus_jc === 'REPROBADO'
              ? '#b71c1c'
              : '#616161',
        bold: true,
      },
    ]);

    return {
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [30, 30, 30, 30],
      defaultStyle: { font: 'Helvetica' },
      content: [
        ...this.construirEncabezado_jc(matriz_jc, 'ACTA DE CALIFICACIONES', '#1b2a4a'),
        {
          table: {
            headerRows: 1,
            widths: [
              18, 60, '*',
              ...items_jc.map(() => 'auto'),
              'auto', 'auto',
            ],
            body: [encabezadosTabla_jc, ...filasTabla_jc],
          },
          layout: {
            fillColor: (indiceFila_jc: number) =>
              indiceFila_jc === 0 ? '#e9edf5' : indiceFila_jc % 2 === 0 ? '#f7f9fc' : null,
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#b9c2d0',
            vLineColor: () => '#b9c2d0',
          },
        },
        ...(hayReparaciones_jc
          ? [
              {
                text: '(R) La nota mostrada corresponde a una REPARACIÓN del corte: se registra la mejor entre la nota original y la de reparación.',
                fontSize: 6.5,
                italics: true,
                color: '#0d47a1',
                margin: [0, 6, 0, 0] as [number, number, number, number],
              },
            ]
          : []),
        ...this.construirPie_jc(codigo_jc, hash_jc),
      ],
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Reporte con TABLA TEMPORAL de PostgreSQL
  // ──────────────────────────────────────────────────────────────

  /**
   * Reporte de rendimiento del período. Se construye con una TABLA TEMPORAL
   * en PostgreSQL (requisito del profesor para reportes complejos): dentro
   * de una transacción se materializa el cálculo agregado y luego se consulta.
   * ON COMMIT DROP garantiza que la tabla desaparezca al finalizar.
   */
  async reporteRendimiento_jc(id_periodo_jc: number) {
    const periodo_jc =
      await this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp: id_periodo_jc },
      });
    if (!periodo_jc) {
      throw new NotFoundException('Período no encontrado.');
    }

    const filas_jc = await this.prisma_jc.$transaction(async (tx_jc) => {
      await tx_jc.$executeRaw`
        CREATE TEMP TABLE tmp_rendimiento_jc ON COMMIT DROP AS
        SELECT
          m."id_materia_cjgp"                                        AS id_materia,
          m."codigo_cjgp"                                            AS codigo,
          m."nombre_cjgp"                                            AS materia,
          c."nombre_cjgp"                                            AS carrera,
          COUNT(im.*)::int                                           AS inscritos,
          COUNT(*) FILTER (WHERE im."estatus_cjgp" = 'APROBADO')::int  AS aprobados,
          COUNT(*) FILTER (WHERE im."estatus_cjgp" = 'REPROBADO')::int AS reprobados,
          COUNT(*) FILTER (WHERE im."estatus_cjgp" = 'INSCRITO')::int  AS en_curso,
          ROUND(AVG(im."notaFinal_cjgp"), 2)::float                  AS promedio
        FROM "td_inscripcion_materia_cjgp" im
        JOIN "td_materia_cjgp" m ON m."id_materia_cjgp" = im."id_materia_im_cjgp"
        JOIN "td_carrera_cjgp" c ON c."id_carrera_cjgp" = m."id_carrera_materia_cjgp"
        WHERE im."id_periodo_im_cjgp" = ${id_periodo_jc}
          AND im."estatus_cjgp" <> 'RETIRADO'
        GROUP BY m."id_materia_cjgp", m."codigo_cjgp", m."nombre_cjgp", c."nombre_cjgp"
      `;

      return tx_jc.$queryRaw<any[]>`
        SELECT *,
               CASE WHEN (aprobados + reprobados) > 0
                    THEN ROUND(aprobados::numeric * 100 / (aprobados + reprobados), 1)::float
                    ELSE NULL
               END AS porcentaje_aprobacion
        FROM tmp_rendimiento_jc
        ORDER BY carrera, codigo
      `;
    });

    return { periodo: periodo_jc, totalMaterias: filas_jc.length, filas: filas_jc };
  }
}
