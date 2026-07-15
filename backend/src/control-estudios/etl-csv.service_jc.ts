import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanesEvaluacionService_jc } from './planes-evaluacion.service_jc';
import { Readable } from 'stream';
import * as readline from 'readline';

/** Resultado estándar de todo proceso ETL (validación o confirmación). */
export interface ResultadoEtl_jc {
  exito: boolean;
  entidad: string;
  totalFilas: number;
  procesadas: number;
  errores: string[];
  advertencias: string[];
}

/**
 * EtlCsvService_jc — Motor de Carga Masiva (ETL/CSV).
 *
 * Lee los archivos CSV mediante Streams de Node.js (Readable + readline),
 * de modo que el archivo se procesa línea a línea sin cargarlo entero en
 * estructuras intermedias. Cada entidad se valida contra la configuración
 * dinámica previa (carreras, planes de evaluación) antes de insertarse.
 *
 * Flujo en dos fases (igual que la carga masiva de usuarios ya existente):
 *   1. /validar  → recorre todo el archivo y reporta errores SIN escribir.
 *   2. /confirmar → vuelve a validar y persiste dentro de transacciones.
 */
@Injectable()
export class EtlCsvService_jc {
  constructor(
    private readonly prisma_jc: PrismaService,
    private readonly planesService_jc: PlanesEvaluacionService_jc,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Utilidades de parseo (Streams)
  // ──────────────────────────────────────────────────────────────

  /** Divide una línea CSV respetando comillas dobles. */
  private dividirLineaCsv_jc(linea_jc: string): string[] {
    const celdas_jc: string[] = [];
    let actual_jc = '';
    let entreComillas_jc = false;

    for (let i_jc = 0; i_jc < linea_jc.length; i_jc++) {
      const caracter_jc = linea_jc[i_jc];
      if (caracter_jc === '"') {
        entreComillas_jc = !entreComillas_jc;
      } else if (caracter_jc === ',' && !entreComillas_jc) {
        celdas_jc.push(actual_jc.trim());
        actual_jc = '';
      } else {
        actual_jc += caracter_jc;
      }
    }
    celdas_jc.push(actual_jc.trim());
    return celdas_jc;
  }

  /**
   * Convierte el buffer subido en filas usando Streams de Node.js:
   * Readable.from() crea el stream y readline lo consume línea a línea.
   */
  private async leerCsv_jc(
    bufferArchivo_jc: Buffer,
  ): Promise<Record<string, string>[]> {
    const flujo_jc = Readable.from(bufferArchivo_jc.toString('utf-8'));
    const lector_jc = readline.createInterface({
      input: flujo_jc,
      crlfDelay: Infinity,
    });

    const filas_jc: Record<string, string>[] = [];
    let encabezados_jc: string[] | null = null;

    for await (const lineaCruda_jc of lector_jc) {
      const linea_jc = lineaCruda_jc.replace(/^﻿/, '').trim();
      if (!linea_jc) continue;

      if (!encabezados_jc) {
        encabezados_jc = this.dividirLineaCsv_jc(linea_jc).map((e_jc) =>
          e_jc.toLowerCase().replace(/\s+/g, '_'),
        );
        continue;
      }

      const celdas_jc = this.dividirLineaCsv_jc(linea_jc);
      const fila_jc: Record<string, string> = {};
      encabezados_jc.forEach((encabezado_jc, indice_jc) => {
        fila_jc[encabezado_jc] = celdas_jc[indice_jc] ?? '';
      });
      filas_jc.push(fila_jc);
    }

    if (!encabezados_jc || filas_jc.length === 0) {
      throw new BadRequestException(
        'El archivo CSV está vacío o no tiene encabezados.',
      );
    }
    return filas_jc;
  }

  /** Punto de entrada único: enruta según la entidad solicitada. */
  async procesar_jc(
    entidad_jc: string,
    bufferArchivo_jc: Buffer,
    soloValidar_jc: boolean,
    idUsuario_jc: number,
  ): Promise<ResultadoEtl_jc> {
    const filas_jc = await this.leerCsv_jc(bufferArchivo_jc);

    switch (entidad_jc) {
      case 'carreras':
        return this.procesarCarreras_jc(filas_jc, soloValidar_jc);
      case 'materias':
        return this.procesarMaterias_jc(filas_jc, soloValidar_jc);
      case 'planes-evaluacion':
        return this.procesarPlanes_jc(filas_jc, soloValidar_jc);
      case 'calificaciones':
        return this.procesarCalificaciones_jc(filas_jc, soloValidar_jc, idUsuario_jc);
      default:
        throw new BadRequestException(
          `Entidad "${entidad_jc}" no soportada. Usa: carreras, materias, planes-evaluacion o calificaciones.`,
        );
    }
  }

  // ──────────────────────────────────────────────────────────────
  // CARRERAS  (codigo,nombre,regimen,duracion_anios,limite_creditos,descripcion)
  // ──────────────────────────────────────────────────────────────

  private async procesarCarreras_jc(
    filas_jc: Record<string, string>[],
    soloValidar_jc: boolean,
  ): Promise<ResultadoEtl_jc> {
    const errores_jc: string[] = [];
    const advertencias_jc: string[] = [];
    const validas_jc: any[] = [];
    const codigosVistos_jc = new Set<string>();

    for (const [indice_jc, fila_jc] of filas_jc.entries()) {
      const nroFila_jc = indice_jc + 2;
      const codigo_jc = (fila_jc.codigo ?? '').toUpperCase();
      const regimen_jc = (fila_jc.regimen ?? 'SEMESTRAL').toUpperCase();
      const duracion_jc = Number(fila_jc.duracion_anios);
      const limite_jc = Number(fila_jc.limite_creditos || 21);

      if (!codigo_jc || !fila_jc.nombre) {
        errores_jc.push(`Fila ${nroFila_jc}: falta código o nombre.`);
        continue;
      }
      if (codigosVistos_jc.has(codigo_jc)) {
        errores_jc.push(`Fila ${nroFila_jc}: código "${codigo_jc}" repetido en el archivo.`);
        continue;
      }
      codigosVistos_jc.add(codigo_jc);

      if (!['SEMESTRAL', 'TRIMESTRAL'].includes(regimen_jc)) {
        errores_jc.push(`Fila ${nroFila_jc}: régimen "${regimen_jc}" inválido (SEMESTRAL o TRIMESTRAL).`);
        continue;
      }
      if (!Number.isInteger(duracion_jc) || duracion_jc < 1 || duracion_jc > 7) {
        errores_jc.push(`Fila ${nroFila_jc}: duración en años inválida.`);
        continue;
      }

      const existente_jc = await this.prisma_jc.td_carrera_cjgp.findUnique({
        where: { codigo_cjgp: codigo_jc },
      });
      if (existente_jc) {
        advertencias_jc.push(`Fila ${nroFila_jc}: la carrera "${codigo_jc}" ya existe; se omite.`);
        continue;
      }

      validas_jc.push({
        codigo_cjgp: codigo_jc,
        nombre_cjgp: fila_jc.nombre,
        regimen_cjgp: regimen_jc,
        duracionAnios_cjgp: duracion_jc,
        limiteCreditos_cjgp: limite_jc,
        descripcion_cjgp: fila_jc.descripcion || null,
      });
    }

    if (!soloValidar_jc && errores_jc.length === 0 && validas_jc.length > 0) {
      await this.prisma_jc.td_carrera_cjgp.createMany({ data: validas_jc });
    }

    return {
      exito: errores_jc.length === 0,
      entidad: 'carreras',
      totalFilas: filas_jc.length,
      procesadas: soloValidar_jc ? 0 : validas_jc.length,
      errores: errores_jc,
      advertencias: advertencias_jc,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // MATERIAS  (carrera_codigo,codigo,nombre,creditos,bloque,prelaciones)
  // ──────────────────────────────────────────────────────────────

  private async procesarMaterias_jc(
    filas_jc: Record<string, string>[],
    soloValidar_jc: boolean,
  ): Promise<ResultadoEtl_jc> {
    const errores_jc: string[] = [];
    const advertencias_jc: string[] = [];

    // Cache de carreras referenciadas para validar contra configuración previa
    const carrerasCache_jc = new Map<string, any>();
    const obtenerCarrera_jc = async (codigo_jc: string) => {
      if (!carrerasCache_jc.has(codigo_jc)) {
        carrerasCache_jc.set(
          codigo_jc,
          await this.prisma_jc.td_carrera_cjgp.findUnique({
            where: { codigo_cjgp: codigo_jc },
            include: { materias_cjgp: true },
          }),
        );
      }
      return carrerasCache_jc.get(codigo_jc);
    };

    const validas_jc: {
      data: any;
      requisitos_jc: string[];
      carreraCodigo_jc: string;
    }[] = [];

    for (const [indice_jc, fila_jc] of filas_jc.entries()) {
      const nroFila_jc = indice_jc + 2;
      const carreraCodigo_jc = (fila_jc.carrera_codigo ?? '').toUpperCase();
      const codigo_jc = (fila_jc.codigo ?? '').toUpperCase();
      const creditos_jc = Number(fila_jc.creditos);
      const bloque_jc = Number(fila_jc.bloque);

      const carrera_jc = await obtenerCarrera_jc(carreraCodigo_jc);
      if (!carrera_jc) {
        errores_jc.push(`Fila ${nroFila_jc}: la carrera "${carreraCodigo_jc}" no existe (cárgala primero).`);
        continue;
      }
      if (!codigo_jc || !fila_jc.nombre) {
        errores_jc.push(`Fila ${nroFila_jc}: falta código o nombre de la materia.`);
        continue;
      }
      if (!Number.isInteger(creditos_jc) || creditos_jc < 1) {
        errores_jc.push(`Fila ${nroFila_jc}: créditos inválidos.`);
        continue;
      }
      const totalBloques_jc =
        carrera_jc.duracionAnios_cjgp * (carrera_jc.regimen_cjgp === 'TRIMESTRAL' ? 3 : 2);
      if (!Number.isInteger(bloque_jc) || bloque_jc < 1 || bloque_jc > totalBloques_jc) {
        errores_jc.push(`Fila ${nroFila_jc}: bloque fuera de rango (1 a ${totalBloques_jc}).`);
        continue;
      }
      const yaExiste_jc = carrera_jc.materias_cjgp.some(
        (materia_jc: any) => materia_jc.codigo_cjgp === codigo_jc,
      );
      if (yaExiste_jc) {
        advertencias_jc.push(`Fila ${nroFila_jc}: la materia "${codigo_jc}" ya existe en la carrera; se omite.`);
        continue;
      }

      validas_jc.push({
        carreraCodigo_jc,
        requisitos_jc: (fila_jc.prelaciones ?? '')
          .split(';')
          .map((r_jc) => r_jc.trim().toUpperCase())
          .filter((r_jc) => r_jc.length > 0),
        data: {
          codigo_cjgp: codigo_jc,
          nombre_cjgp: fila_jc.nombre,
          creditos_cjgp: creditos_jc,
          nroBloque_cjgp: bloque_jc,
          id_carrera_materia_cjgp: carrera_jc.id_carrera_cjgp,
        },
      });
    }

    let procesadas_jc = 0;
    if (!soloValidar_jc && errores_jc.length === 0 && validas_jc.length > 0) {
      await this.prisma_jc.$transaction(async (tx_jc) => {
        // Primera pasada: crear materias
        const idPorClave_jc = new Map<string, number>();
        for (const valida_jc of validas_jc) {
          const creada_jc = await tx_jc.td_materia_cjgp.create({ data: valida_jc.data });
          idPorClave_jc.set(
            `${valida_jc.carreraCodigo_jc}:${creada_jc.codigo_cjgp}`,
            creada_jc.id_materia_cjgp,
          );
          procesadas_jc++;
        }
        // Segunda pasada: prelaciones (pueden apuntar a materias previas o nuevas)
        for (const valida_jc of validas_jc) {
          const idMateria_jc = idPorClave_jc.get(
            `${valida_jc.carreraCodigo_jc}:${valida_jc.data.codigo_cjgp}`,
          )!;
          for (const requisito_jc of valida_jc.requisitos_jc) {
            let idRequisito_jc = idPorClave_jc.get(
              `${valida_jc.carreraCodigo_jc}:${requisito_jc}`,
            );
            if (!idRequisito_jc) {
              const existente_jc = await tx_jc.td_materia_cjgp.findFirst({
                where: {
                  codigo_cjgp: requisito_jc,
                  id_carrera_materia_cjgp: valida_jc.data.id_carrera_materia_cjgp,
                },
              });
              idRequisito_jc = existente_jc?.id_materia_cjgp;
            }
            if (!idRequisito_jc) {
              throw new BadRequestException(
                `La prelación "${requisito_jc}" de la materia "${valida_jc.data.codigo_cjgp}" no existe.`,
              );
            }
            await tx_jc.td_prelacion_cjgp.create({
              data: {
                id_materia_cjgp: idMateria_jc,
                id_materia_requisito_cjgp: idRequisito_jc,
              },
            });
          }
        }
      });
    }

    return {
      exito: errores_jc.length === 0,
      entidad: 'materias',
      totalFilas: filas_jc.length,
      procesadas: procesadas_jc,
      errores: errores_jc,
      advertencias: advertencias_jc,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // PLANES DE EVALUACIÓN
  // (periodo,carrera_codigo,plan,nota_maxima,nota_aprobatoria,
  //  evaluacion,orden,peso,es_recuperacion)  → una fila por ítem
  // ──────────────────────────────────────────────────────────────

  private async procesarPlanes_jc(
    filas_jc: Record<string, string>[],
    soloValidar_jc: boolean,
  ): Promise<ResultadoEtl_jc> {
    const errores_jc: string[] = [];
    const advertencias_jc: string[] = [];

    // Agrupar filas por plan (período + carrera + nombre del plan)
    const grupos_jc = new Map<string, Record<string, string>[]>();
    for (const fila_jc of filas_jc) {
      const clave_jc = `${fila_jc.periodo}|${fila_jc.carrera_codigo ?? ''}|${fila_jc.plan}`;
      grupos_jc.set(clave_jc, [...(grupos_jc.get(clave_jc) ?? []), fila_jc]);
    }

    let procesadas_jc = 0;
    for (const [clave_jc, filasPlan_jc] of grupos_jc.entries()) {
      const [nombrePeriodo_jc, codigoCarrera_jc, nombrePlan_jc] = clave_jc.split('|');

      const periodo_jc = await this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { nombre_cjgp: nombrePeriodo_jc },
      });
      if (!periodo_jc) {
        errores_jc.push(`Plan "${nombrePlan_jc}": el período "${nombrePeriodo_jc}" no existe.`);
        continue;
      }

      let idCarrera_jc: number | null = null;
      if (codigoCarrera_jc) {
        const carrera_jc = await this.prisma_jc.td_carrera_cjgp.findUnique({
          where: { codigo_cjgp: codigoCarrera_jc.toUpperCase() },
        });
        if (!carrera_jc) {
          errores_jc.push(`Plan "${nombrePlan_jc}": la carrera "${codigoCarrera_jc}" no existe.`);
          continue;
        }
        idCarrera_jc = carrera_jc.id_carrera_cjgp;
      }

      const items_jc = filasPlan_jc.map((fila_jc) => ({
        nombre_jc: fila_jc.evaluacion,
        orden_jc: Number(fila_jc.orden),
        peso_jc: Number(fila_jc.peso),
        esRecuperacion_jc: ['SI', 'SÍ', 'TRUE', '1'].includes(
          (fila_jc.es_recuperacion ?? '').toUpperCase(),
        ),
      }));

      const sumaPesos_jc = items_jc
        .filter((item_jc) => !item_jc.esRecuperacion_jc)
        .reduce((suma_jc, item_jc) => suma_jc + item_jc.peso_jc, 0);
      if (Math.abs(sumaPesos_jc - 100) > 0.01) {
        errores_jc.push(
          `Plan "${nombrePlan_jc}": los pesos regulares suman ${sumaPesos_jc}% (deben sumar 100%).`,
        );
        continue;
      }

      const duplicado_jc = await this.prisma_jc.td_plan_evaluacion_jc.findFirst({
        where: {
          id_periodo_plan_jc: periodo_jc.id_periodo_cjgp,
          id_carrera_plan_jc: idCarrera_jc,
        },
      });
      if (duplicado_jc) {
        advertencias_jc.push(
          `Plan "${nombrePlan_jc}": ya existe un plan para ese período/alcance; se omite.`,
        );
        continue;
      }

      if (!soloValidar_jc) {
        await this.prisma_jc.td_plan_evaluacion_jc.create({
          data: {
            nombre_jc: nombrePlan_jc,
            id_periodo_plan_jc: periodo_jc.id_periodo_cjgp,
            id_carrera_plan_jc: idCarrera_jc,
            notaMaxima_jc: Number(filasPlan_jc[0].nota_maxima || 20),
            notaAprobatoria_jc: Number(filasPlan_jc[0].nota_aprobatoria || 10),
            estado_jc: 'PUBLICADO',
            items_jc: { create: items_jc },
          },
        });
        procesadas_jc++;
      }
    }

    return {
      exito: errores_jc.length === 0,
      entidad: 'planes-evaluacion',
      totalFilas: filas_jc.length,
      procesadas: procesadas_jc,
      errores: errores_jc,
      advertencias: advertencias_jc,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // CALIFICACIONES  (periodo,carrera_codigo,materia_codigo,cedula,evaluacion,valor)
  // ──────────────────────────────────────────────────────────────

  private async procesarCalificaciones_jc(
    filas_jc: Record<string, string>[],
    soloValidar_jc: boolean,
    idUsuario_jc: number,
  ): Promise<ResultadoEtl_jc> {
    const errores_jc: string[] = [];
    const advertencias_jc: string[] = [];
    let procesadas_jc = 0;

    for (const [indice_jc, fila_jc] of filas_jc.entries()) {
      const nroFila_jc = indice_jc + 2;

      const periodo_jc = await this.prisma_jc.td_periodo_academico_cjgp.findUnique({
        where: { nombre_cjgp: fila_jc.periodo ?? '' },
      });
      if (!periodo_jc) {
        errores_jc.push(`Fila ${nroFila_jc}: el período "${fila_jc.periodo}" no existe.`);
        continue;
      }

      const materia_jc = await this.prisma_jc.td_materia_cjgp.findFirst({
        where: {
          codigo_cjgp: (fila_jc.materia_codigo ?? '').toUpperCase(),
          carrera_cjgp: { codigo_cjgp: (fila_jc.carrera_codigo ?? '').toUpperCase() },
        },
      });
      if (!materia_jc) {
        errores_jc.push(
          `Fila ${nroFila_jc}: la materia "${fila_jc.materia_codigo}" no existe en la carrera "${fila_jc.carrera_codigo}".`,
        );
        continue;
      }

      const alumno_jc = await this.prisma_jc.td_usuario_ahbb.findUnique({
        where: { cedula_ahbb: fila_jc.cedula ?? '' },
      });
      if (!alumno_jc) {
        errores_jc.push(`Fila ${nroFila_jc}: no existe un usuario con cédula "${fila_jc.cedula}".`);
        continue;
      }

      // Validación contra la configuración dinámica: el ítem debe existir
      // en el plan vigente y el valor respetar su escala.
      let plan_jc: any;
      try {
        plan_jc = await this.planesService_jc.resolverPlanVigente_jc(
          materia_jc.id_materia_cjgp,
          periodo_jc.id_periodo_cjgp,
        );
      } catch (error_jc: any) {
        errores_jc.push(`Fila ${nroFila_jc}: ${error_jc.message ?? 'sin plan de evaluación vigente.'}`);
        continue;
      }

      const item_jc = plan_jc.items_jc.find(
        (candidato_jc: any) =>
          candidato_jc.nombre_jc.toLowerCase() === (fila_jc.evaluacion ?? '').toLowerCase(),
      );
      if (!item_jc) {
        errores_jc.push(
          `Fila ${nroFila_jc}: la evaluación "${fila_jc.evaluacion}" no está definida en el plan "${plan_jc.nombre_jc}".`,
        );
        continue;
      }

      const valor_jc = Number(fila_jc.valor);
      if (Number.isNaN(valor_jc) || valor_jc < 0 || valor_jc > Number(plan_jc.notaMaxima_jc)) {
        errores_jc.push(
          `Fila ${nroFila_jc}: la nota "${fila_jc.valor}" está fuera de la escala (0 a ${Number(plan_jc.notaMaxima_jc)}).`,
        );
        continue;
      }

      if (soloValidar_jc) continue;

      // Buscar (o crear) la inscripción del alumno en la materia/período
      let inscripcion_jc = await this.prisma_jc.td_inscripcion_materia_cjgp.findFirst({
        where: {
          id_usuario_im_cjgp: alumno_jc.id_usuario_ahbb,
          id_materia_im_cjgp: materia_jc.id_materia_cjgp,
          id_periodo_im_cjgp: periodo_jc.id_periodo_cjgp,
        },
      });
      if (!inscripcion_jc) {
        inscripcion_jc = await this.prisma_jc.td_inscripcion_materia_cjgp.create({
          data: {
            id_usuario_im_cjgp: alumno_jc.id_usuario_ahbb,
            id_materia_im_cjgp: materia_jc.id_materia_cjgp,
            id_periodo_im_cjgp: periodo_jc.id_periodo_cjgp,
          },
        });
        advertencias_jc.push(
          `Fila ${nroFila_jc}: el alumno ${fila_jc.cedula} no estaba inscrito en ${materia_jc.codigo_cjgp}; se creó la inscripción.`,
        );
      }

      await this.prisma_jc.td_calificacion_jc.upsert({
        where: {
          id_inscripcion_materia_cal_jc_id_item_cal_jc: {
            id_inscripcion_materia_cal_jc: inscripcion_jc.id_inscripcion_materia_cjgp,
            id_item_cal_jc: item_jc.id_item_jc,
          },
        },
        create: {
          id_inscripcion_materia_cal_jc: inscripcion_jc.id_inscripcion_materia_cjgp,
          id_item_cal_jc: item_jc.id_item_jc,
          valor_jc: valor_jc,
          cargadoPorUsuarioId_jc: idUsuario_jc,
        },
        update: {
          valor_jc: valor_jc,
          cargadoPorUsuarioId_jc: idUsuario_jc,
          actualizadoEn_jc: new Date(),
        },
      });
      procesadas_jc++;
    }

    return {
      exito: errores_jc.length === 0,
      entidad: 'calificaciones',
      totalFilas: filas_jc.length,
      procesadas: procesadas_jc,
      errores: errores_jc,
      advertencias: advertencias_jc,
    };
  }
}
