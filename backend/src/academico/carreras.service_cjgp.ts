import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CrearCarreraDto_cjgp,
  MateriaPensumDto_cjgp,
} from './dto/crear-carrera.dto_cjgp';
import * as XLSX from 'xlsx';

/**
 * CarrerasService_cjgp — Épica 1: Creación Ágil de Carreras y Pensums.
 *
 * Centraliza la creación transaccional de la oferta académica:
 * carrera → bloques → materias → prelaciones. La validación del pensum
 * es compartida entre el asistente paso a paso y la carga masiva Excel,
 * de modo que ambas rutas apliquen exactamente las mismas reglas.
 */
@Injectable()
export class CarrerasService_cjgp {
  constructor(private readonly prisma_cjgp: PrismaService) {}

  /** Bloques por año según el régimen: semestral = 2, trimestral = 3. */
  private bloquesPorAnio_cjgp(regimen_cjgp: string): number {
    return regimen_cjgp === 'TRIMESTRAL' ? 3 : 2;
  }

  /**
   * Valida la coherencia interna de un pensum antes de persistirlo:
   * códigos únicos, bloques dentro del rango de la carrera y prelaciones
   * que existan y pertenezcan a un bloque anterior al de la materia.
   * Devuelve la lista de errores encontrados (vacía si todo está bien).
   */
  validarPensum_cjgp(
    materias_cjgp: MateriaPensumDto_cjgp[],
    totalBloques_cjgp: number,
  ): string[] {
    const errores_cjgp: string[] = [];
    const porCodigo_cjgp = new Map<string, MateriaPensumDto_cjgp>();

    for (const materia_cjgp of materias_cjgp) {
      const codigo_cjgp = materia_cjgp.codigo_cjgp.trim().toUpperCase();
      if (porCodigo_cjgp.has(codigo_cjgp)) {
        errores_cjgp.push(
          `El código "${codigo_cjgp}" está repetido en el pensum.`,
        );
        continue;
      }
      porCodigo_cjgp.set(codigo_cjgp, materia_cjgp);

      if (materia_cjgp.nroBloque_cjgp > totalBloques_cjgp) {
        errores_cjgp.push(
          `La materia "${codigo_cjgp}" está en el bloque ${materia_cjgp.nroBloque_cjgp}, pero la carrera solo tiene ${totalBloques_cjgp} bloques.`,
        );
      }
    }

    // Validación de prelaciones: deben existir y estar en un bloque anterior
    for (const materia_cjgp of materias_cjgp) {
      for (const requisito_cjgp of materia_cjgp.requisitos_cjgp ?? []) {
        const codigoReq_cjgp = requisito_cjgp.trim().toUpperCase();
        const materiaReq_cjgp = porCodigo_cjgp.get(codigoReq_cjgp);

        if (!materiaReq_cjgp) {
          errores_cjgp.push(
            `La materia "${materia_cjgp.codigo_cjgp}" declara la prelación "${codigoReq_cjgp}", que no existe en el pensum.`,
          );
          continue;
        }
        if (codigoReq_cjgp === materia_cjgp.codigo_cjgp.trim().toUpperCase()) {
          errores_cjgp.push(
            `La materia "${materia_cjgp.codigo_cjgp}" no puede ser prelación de sí misma.`,
          );
          continue;
        }
        if (materiaReq_cjgp.nroBloque_cjgp >= materia_cjgp.nroBloque_cjgp) {
          errores_cjgp.push(
            `La prelación "${codigoReq_cjgp}" debe estar en un bloque anterior al de "${materia_cjgp.codigo_cjgp}".`,
          );
        }
      }
    }

    return errores_cjgp;
  }

  /**
   * Crea la carrera completa en una sola transacción (asistente paso a paso).
   * Si algo falla, no queda ningún dato a medias en la base de datos.
   */
  async crearCarreraCompleta_cjgp(datos_cjgp: CrearCarreraDto_cjgp) {
    const totalBloques_cjgp =
      datos_cjgp.duracionAnios_cjgp *
      this.bloquesPorAnio_cjgp(datos_cjgp.regimen_cjgp);

    const errores_cjgp = this.validarPensum_cjgp(
      datos_cjgp.materias_cjgp,
      totalBloques_cjgp,
    );
    if (errores_cjgp.length > 0) {
      throw new BadRequestException({
        mensaje: 'El pensum tiene errores que debes corregir.',
        errores: errores_cjgp,
      });
    }

    const existente_cjgp = await this.prisma_cjgp.td_carrera_cjgp.findUnique({
      where: { codigo_cjgp: datos_cjgp.codigo_cjgp.trim().toUpperCase() },
    });
    if (existente_cjgp) {
      throw new BadRequestException(
        `Ya existe una carrera registrada con el código "${datos_cjgp.codigo_cjgp}".`,
      );
    }

    // Validar los profesores asignados desde el asistente (deben tener rol PROFESOR)
    const idsProfesores_cjgp = [
      ...new Set(
        datos_cjgp.materias_cjgp
          .map((materia_cjgp) => materia_cjgp.id_profesor_cjgp)
          .filter((id_cjgp): id_cjgp is number => !!id_cjgp),
      ),
    ];
    if (idsProfesores_cjgp.length > 0) {
      const profesoresValidos_cjgp =
        await this.prisma_cjgp.td_usuario_ahbb.count({
          where: {
            id_usuario_ahbb: { in: idsProfesores_cjgp },
            rol_ahbb: 'PROFESOR',
          },
        });
      if (profesoresValidos_cjgp !== idsProfesores_cjgp.length) {
        throw new BadRequestException(
          'Uno de los profesores asignados no existe o no tiene rol de PROFESOR.',
        );
      }
    }

    return this.prisma_cjgp.$transaction(async (tx_cjgp) => {
      // 1. Crear la carrera
      const carrera_cjgp = await tx_cjgp.td_carrera_cjgp.create({
        data: {
          codigo_cjgp: datos_cjgp.codigo_cjgp.trim().toUpperCase(),
          nombre_cjgp: datos_cjgp.nombre_cjgp.trim(),
          descripcion_cjgp: datos_cjgp.descripcion_cjgp ?? null,
          regimen_cjgp: datos_cjgp.regimen_cjgp,
          duracionAnios_cjgp: datos_cjgp.duracionAnios_cjgp,
          limiteCreditos_cjgp: datos_cjgp.limiteCreditos_cjgp,
        },
      });

      // 2. Crear las materias y guardar el mapa código → id para las prelaciones
      const idPorCodigo_cjgp = new Map<string, number>();
      for (const materia_cjgp of datos_cjgp.materias_cjgp) {
        const creada_cjgp = await tx_cjgp.td_materia_cjgp.create({
          data: {
            codigo_cjgp: materia_cjgp.codigo_cjgp.trim().toUpperCase(),
            nombre_cjgp: materia_cjgp.nombre_cjgp.trim(),
            creditos_cjgp: materia_cjgp.creditos_cjgp,
            nroBloque_cjgp: materia_cjgp.nroBloque_cjgp,
            id_carrera_materia_cjgp: carrera_cjgp.id_carrera_cjgp,
            id_profesor_materia_cjgp: materia_cjgp.id_profesor_cjgp ?? null,
          },
        });
        idPorCodigo_cjgp.set(creada_cjgp.codigo_cjgp, creada_cjgp.id_materia_cjgp);
      }

      // 3. Crear las prelaciones (segunda pasada, ya con todos los IDs)
      let totalPrelaciones_cjgp = 0;
      for (const materia_cjgp of datos_cjgp.materias_cjgp) {
        const idMateria_cjgp = idPorCodigo_cjgp.get(
          materia_cjgp.codigo_cjgp.trim().toUpperCase(),
        )!;
        for (const requisito_cjgp of materia_cjgp.requisitos_cjgp ?? []) {
          await tx_cjgp.td_prelacion_cjgp.create({
            data: {
              id_materia_cjgp: idMateria_cjgp,
              id_materia_requisito_cjgp: idPorCodigo_cjgp.get(
                requisito_cjgp.trim().toUpperCase(),
              )!,
            },
          });
          totalPrelaciones_cjgp++;
        }
      }

      return {
        exito: true,
        carrera: carrera_cjgp,
        totalBloques: totalBloques_cjgp,
        totalMaterias: datos_cjgp.materias_cjgp.length,
        totalPrelaciones: totalPrelaciones_cjgp,
        mensaje: `Carrera "${carrera_cjgp.nombre_cjgp}" registrada con ${datos_cjgp.materias_cjgp.length} materias.`,
      };
    });
  }

  /** Lista todas las carreras con el conteo de materias de su pensum. */
  async obtenerTodas_cjgp() {
    const carreras_cjgp = await this.prisma_cjgp.td_carrera_cjgp.findMany({
      include: { _count: { select: { materias_cjgp: true } } },
      orderBy: { creadoEn_cjgp: 'desc' },
    });

    return carreras_cjgp.map((carrera_cjgp) => ({
      ...carrera_cjgp,
      totalBloques_cjgp:
        carrera_cjgp.duracionAnios_cjgp *
        this.bloquesPorAnio_cjgp(carrera_cjgp.regimen_cjgp),
      totalMaterias_cjgp: carrera_cjgp._count.materias_cjgp,
    }));
  }

  /** Detalle de una carrera: materias agrupadas por bloque con sus prelaciones. */
  async obtenerDetalle_cjgp(id_carrera_cjgp: number) {
    const carrera_cjgp = await this.prisma_cjgp.td_carrera_cjgp.findUnique({
      where: { id_carrera_cjgp },
      include: {
        materias_cjgp: {
          orderBy: [{ nroBloque_cjgp: 'asc' }, { codigo_cjgp: 'asc' }],
          include: {
            prelaciones_cjgp: { include: { requisito_cjgp: true } },
            profesor_cjgp: {
              select: {
                id_usuario_ahbb: true,
                nombre_ahbb: true,
                apellido_ahbb: true,
                cedula_ahbb: true,
              },
            },
          },
        },
      },
    });

    if (!carrera_cjgp) {
      throw new NotFoundException('Carrera no encontrada.');
    }

    const totalBloques_cjgp =
      carrera_cjgp.duracionAnios_cjgp *
      this.bloquesPorAnio_cjgp(carrera_cjgp.regimen_cjgp);

    // Agrupar materias por bloque para que el frontend "dibuje" la malla
    const bloques_cjgp = Array.from(
      { length: totalBloques_cjgp },
      (_, indice_cjgp) => ({
        nroBloque_cjgp: indice_cjgp + 1,
        materias_cjgp: carrera_cjgp.materias_cjgp
          .filter((materia_cjgp) => materia_cjgp.nroBloque_cjgp === indice_cjgp + 1)
          .map((materia_cjgp) => ({
            ...materia_cjgp,
            requisitos_cjgp: materia_cjgp.prelaciones_cjgp.map(
              (prelacion_cjgp) => ({
                id_materia_cjgp: prelacion_cjgp.requisito_cjgp.id_materia_cjgp,
                codigo_cjgp: prelacion_cjgp.requisito_cjgp.codigo_cjgp,
                nombre_cjgp: prelacion_cjgp.requisito_cjgp.nombre_cjgp,
              }),
            ),
          })),
      }),
    );

    return { ...carrera_cjgp, totalBloques_cjgp, bloques_cjgp };
  }

  /**
   * Materias que el profesor autenticado tiene asignadas, con el número de
   * alumnos cursándolas en el período activo (vista "Mis Materias" del docente).
   */
  async obtenerMisMaterias_cjgp(id_profesor_cjgp: number) {
    const periodoActivo_cjgp =
      await this.prisma_cjgp.td_periodo_academico_cjgp.findFirst({
        where: { activo_cjgp: true },
      });

    const materias_cjgp = await this.prisma_cjgp.td_materia_cjgp.findMany({
      where: { id_profesor_materia_cjgp: id_profesor_cjgp },
      include: {
        carrera_cjgp: {
          select: { nombre_cjgp: true, codigo_cjgp: true, regimen_cjgp: true },
        },
        _count: {
          select: {
            inscripciones_cjgp: {
              where: {
                estatus_cjgp: 'INSCRITO',
                id_periodo_im_cjgp: periodoActivo_cjgp?.id_periodo_cjgp ?? -1,
              },
            },
          },
        },
      },
      orderBy: [{ id_carrera_materia_cjgp: 'asc' }, { codigo_cjgp: 'asc' }],
    });

    return {
      periodoActivo: periodoActivo_cjgp,
      materias: materias_cjgp.map((materia_cjgp) => ({
        ...materia_cjgp,
        alumnosEnCurso_cjgp: materia_cjgp._count.inscripciones_cjgp,
      })),
    };
  }

  /**
   * Historial docente: todo lo que el profesor ha dictado, agrupado por
   * período, con el desglose de resultados de cada materia (en curso,
   * aprobados, reprobados, retirados y promedio de notas finales).
   */
  async obtenerHistorialMisMaterias_cjgp(id_profesor_cjgp: number) {
    const inscripciones_cjgp =
      await this.prisma_cjgp.td_inscripcion_materia_cjgp.findMany({
        where: {
          materia_cjgp: { id_profesor_materia_cjgp: id_profesor_cjgp },
        },
        include: {
          materia_cjgp: {
            include: {
              carrera_cjgp: { select: { nombre_cjgp: true, codigo_cjgp: true } },
            },
          },
          periodo_cjgp: true,
        },
      });

    // Agrupar período → materia con contadores por estatus
    const porPeriodo_cjgp = new Map<number, any>();
    for (const inscripcion_cjgp of inscripciones_cjgp) {
      const idPeriodo_cjgp = inscripcion_cjgp.id_periodo_im_cjgp;
      if (!porPeriodo_cjgp.has(idPeriodo_cjgp)) {
        porPeriodo_cjgp.set(idPeriodo_cjgp, {
          periodo_cjgp: inscripcion_cjgp.periodo_cjgp,
          materias_cjgp: new Map<number, any>(),
        });
      }
      const grupo_cjgp = porPeriodo_cjgp.get(idPeriodo_cjgp);

      const idMateria_cjgp = inscripcion_cjgp.id_materia_im_cjgp;
      if (!grupo_cjgp.materias_cjgp.has(idMateria_cjgp)) {
        grupo_cjgp.materias_cjgp.set(idMateria_cjgp, {
          materia_cjgp: {
            id_materia_cjgp: inscripcion_cjgp.materia_cjgp.id_materia_cjgp,
            codigo_cjgp: inscripcion_cjgp.materia_cjgp.codigo_cjgp,
            nombre_cjgp: inscripcion_cjgp.materia_cjgp.nombre_cjgp,
            creditos_cjgp: inscripcion_cjgp.materia_cjgp.creditos_cjgp,
            carrera_cjgp: inscripcion_cjgp.materia_cjgp.carrera_cjgp,
          },
          enCurso_cjgp: 0,
          aprobados_cjgp: 0,
          reprobados_cjgp: 0,
          retirados_cjgp: 0,
          sumaNotas_cjgp: 0,
          conNota_cjgp: 0,
        });
      }
      const resumen_cjgp = grupo_cjgp.materias_cjgp.get(idMateria_cjgp);

      if (inscripcion_cjgp.estatus_cjgp === 'INSCRITO') resumen_cjgp.enCurso_cjgp++;
      if (inscripcion_cjgp.estatus_cjgp === 'APROBADO') resumen_cjgp.aprobados_cjgp++;
      if (inscripcion_cjgp.estatus_cjgp === 'REPROBADO') resumen_cjgp.reprobados_cjgp++;
      if (inscripcion_cjgp.estatus_cjgp === 'RETIRADO') resumen_cjgp.retirados_cjgp++;
      if (inscripcion_cjgp.notaFinal_cjgp !== null) {
        resumen_cjgp.sumaNotas_cjgp += Number(inscripcion_cjgp.notaFinal_cjgp);
        resumen_cjgp.conNota_cjgp++;
      }
    }

    return [...porPeriodo_cjgp.values()]
      .map((grupo_cjgp) => ({
        periodo_cjgp: grupo_cjgp.periodo_cjgp,
        materias_cjgp: [...grupo_cjgp.materias_cjgp.values()].map(
          (resumen_cjgp) => ({
            ...resumen_cjgp,
            promedio_cjgp:
              resumen_cjgp.conNota_cjgp > 0
                ? Math.round(
                    (resumen_cjgp.sumaNotas_cjgp / resumen_cjgp.conNota_cjgp) * 100,
                  ) / 100
                : null,
          }),
        ),
      }))
      .sort(
        (a_cjgp, b_cjgp) =>
          new Date(b_cjgp.periodo_cjgp.fechaInicio_cjgp).getTime() -
          new Date(a_cjgp.periodo_cjgp.fechaInicio_cjgp).getTime(),
      );
  }

  /**
   * Asigna (o retira, con null) el profesor que dicta una materia.
   * Solo usuarios con rol PROFESOR pueden ser asignados; el dato se refleja
   * en la vitrina del alumno, sus notas y la carga de notas del docente.
   */
  async asignarProfesor_cjgp(
    id_materia_cjgp: number,
    id_profesor_cjgp: number | null,
  ) {
    const materia_cjgp = await this.prisma_cjgp.td_materia_cjgp.findUnique({
      where: { id_materia_cjgp },
    });
    if (!materia_cjgp) {
      throw new NotFoundException('Materia no encontrada.');
    }

    if (id_profesor_cjgp !== null) {
      const profesor_cjgp = await this.prisma_cjgp.td_usuario_ahbb.findUnique({
        where: { id_usuario_ahbb: id_profesor_cjgp },
      });
      if (!profesor_cjgp || profesor_cjgp.rol_ahbb !== 'PROFESOR') {
        throw new BadRequestException(
          'El usuario indicado no existe o no tiene rol de PROFESOR.',
        );
      }
    }

    const actualizada_cjgp = await this.prisma_cjgp.td_materia_cjgp.update({
      where: { id_materia_cjgp },
      data: { id_profesor_materia_cjgp: id_profesor_cjgp },
      include: {
        profesor_cjgp: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
      },
    });

    return {
      exito: true,
      materia: actualizada_cjgp,
      mensaje: id_profesor_cjgp
        ? `Profesor ${actualizada_cjgp.profesor_cjgp?.nombre_ahbb} ${actualizada_cjgp.profesor_cjgp?.apellido_ahbb} asignado a ${materia_cjgp.codigo_cjgp}.`
        : `La materia ${materia_cjgp.codigo_cjgp} quedó sin profesor asignado.`,
    };
  }

  /** Elimina una carrera (cascada: materias, prelaciones e inscripciones). */
  async eliminar_cjgp(id_carrera_cjgp: number) {
    await this.obtenerDetalle_cjgp(id_carrera_cjgp);
    await this.prisma_cjgp.td_carrera_cjgp.delete({ where: { id_carrera_cjgp } });
    return { exito: true, mensaje: 'Carrera eliminada correctamente.' };
  }

  // ──────────────────────────────────────────────────────────────
  // Carga Masiva del pensum desde Excel ("el botón mágico")
  // ──────────────────────────────────────────────────────────────

  /**
   * Analiza un archivo Excel institucional y devuelve las materias
   * interpretadas SIN persistir nada. El asistente usa este resultado
   * para precargar el pensum y que el administrador lo revise.
   *
   * Columnas esperadas: Codigo | Nombre | Creditos | Bloque | Prelaciones
   * (las prelaciones son códigos separados por ";").
   */
  analizarPensumExcel_cjgp(bufferArchivo_cjgp: Buffer) {
    let hoja_cjgp: XLSX.WorkSheet;
    try {
      const libro_cjgp = XLSX.read(bufferArchivo_cjgp, { type: 'buffer' });
      hoja_cjgp = libro_cjgp.Sheets[libro_cjgp.SheetNames[0]];
    } catch {
      throw new BadRequestException(
        'El archivo no pudo leerse. Verifica que sea un Excel válido (.xlsx).',
      );
    }

    const filas_cjgp: any[] = XLSX.utils.sheet_to_json(hoja_cjgp, {
      defval: '',
    });
    if (filas_cjgp.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío.');
    }

    const materias_cjgp: MateriaPensumDto_cjgp[] = [];
    const errores_cjgp: string[] = [];

    filas_cjgp.forEach((fila_cjgp, indice_cjgp) => {
      const nroFila_cjgp = indice_cjgp + 2; // +2: encabezado + base 1 de Excel
      const codigo_cjgp = String(fila_cjgp.Codigo ?? fila_cjgp.codigo ?? '').trim();
      const nombre_cjgp = String(fila_cjgp.Nombre ?? fila_cjgp.nombre ?? '').trim();
      const creditos_cjgp = Number(fila_cjgp.Creditos ?? fila_cjgp.creditos);
      const bloque_cjgp = Number(fila_cjgp.Bloque ?? fila_cjgp.bloque);
      const prelacionesTexto_cjgp = String(
        fila_cjgp.Prelaciones ?? fila_cjgp.prelaciones ?? '',
      ).trim();

      if (!codigo_cjgp || !nombre_cjgp) {
        errores_cjgp.push(`Fila ${nroFila_cjgp}: falta el código o el nombre.`);
        return;
      }
      if (!Number.isInteger(creditos_cjgp) || creditos_cjgp < 1) {
        errores_cjgp.push(
          `Fila ${nroFila_cjgp}: los créditos deben ser un entero mayor a 0.`,
        );
        return;
      }
      if (!Number.isInteger(bloque_cjgp) || bloque_cjgp < 1) {
        errores_cjgp.push(
          `Fila ${nroFila_cjgp}: el bloque debe ser un entero mayor a 0.`,
        );
        return;
      }

      materias_cjgp.push({
        codigo_cjgp: codigo_cjgp.toUpperCase(),
        nombre_cjgp,
        creditos_cjgp,
        nroBloque_cjgp: bloque_cjgp,
        requisitos_cjgp: prelacionesTexto_cjgp
          ? prelacionesTexto_cjgp
              .split(';')
              .map((req_cjgp) => req_cjgp.trim().toUpperCase())
              .filter((req_cjgp) => req_cjgp.length > 0)
          : [],
      });
    });

    return {
      exito: errores_cjgp.length === 0,
      totalFilas: filas_cjgp.length,
      materias: materias_cjgp,
      errores: errores_cjgp,
    };
  }

  /**
   * Genera la plantilla Excel institucional de ejemplo para el pensum,
   * adaptada al régimen elegido por el administrador:
   *  - SEMESTRAL: ejemplo de carrera de 3 años (6 semestres).
   *  - TRIMESTRAL: ejemplo de carrera de 3 años (9 trimestres).
   */
  generarPlantillaPensum_cjgp(regimen_cjgp: string = 'SEMESTRAL'): Buffer {
    const filasSemestral_cjgp = [
      { Codigo: 'MAT1', Nombre: 'Matemática I', Creditos: 4, Bloque: 1, Prelaciones: '' },
      { Codigo: 'PRG1', Nombre: 'Programación I', Creditos: 5, Bloque: 1, Prelaciones: '' },
      { Codigo: 'MAT2', Nombre: 'Matemática II', Creditos: 4, Bloque: 2, Prelaciones: 'MAT1' },
      { Codigo: 'PRG2', Nombre: 'Programación II', Creditos: 5, Bloque: 2, Prelaciones: 'PRG1' },
      { Codigo: 'BD1', Nombre: 'Base de Datos I', Creditos: 4, Bloque: 3, Prelaciones: 'PRG2' },
      { Codigo: 'EST1', Nombre: 'Estadística I', Creditos: 4, Bloque: 3, Prelaciones: 'MAT2' },
      { Codigo: 'BD2', Nombre: 'Base de Datos II', Creditos: 4, Bloque: 4, Prelaciones: 'BD1' },
      { Codigo: 'RED1', Nombre: 'Redes de Computadoras', Creditos: 4, Bloque: 5, Prelaciones: '' },
      { Codigo: 'PRY1', Nombre: 'Proyecto de Grado', Creditos: 6, Bloque: 6, Prelaciones: 'BD2;MAT2' },
    ];

    // En régimen trimestral los bloques son trimestres (3 por año):
    // el mismo pensum de ejemplo se distribuye en 9 bloques.
    const filasTrimestral_cjgp = [
      { Codigo: 'MAT1', Nombre: 'Matemática I', Creditos: 4, Bloque: 1, Prelaciones: '' },
      { Codigo: 'PRG1', Nombre: 'Programación I', Creditos: 5, Bloque: 1, Prelaciones: '' },
      { Codigo: 'MAT2', Nombre: 'Matemática II', Creditos: 4, Bloque: 2, Prelaciones: 'MAT1' },
      { Codigo: 'PRG2', Nombre: 'Programación II', Creditos: 5, Bloque: 2, Prelaciones: 'PRG1' },
      { Codigo: 'EST1', Nombre: 'Estadística I', Creditos: 4, Bloque: 3, Prelaciones: 'MAT2' },
      { Codigo: 'BD1', Nombre: 'Base de Datos I', Creditos: 4, Bloque: 4, Prelaciones: 'PRG2' },
      { Codigo: 'BD2', Nombre: 'Base de Datos II', Creditos: 4, Bloque: 5, Prelaciones: 'BD1' },
      { Codigo: 'SOP1', Nombre: 'Sistemas Operativos', Creditos: 4, Bloque: 6, Prelaciones: 'PRG2' },
      { Codigo: 'RED1', Nombre: 'Redes de Computadoras', Creditos: 4, Bloque: 7, Prelaciones: 'SOP1' },
      { Codigo: 'SEG1', Nombre: 'Seguridad Informática', Creditos: 3, Bloque: 8, Prelaciones: 'RED1' },
      { Codigo: 'PRY1', Nombre: 'Proyecto de Grado', Creditos: 6, Bloque: 9, Prelaciones: 'BD2;SEG1' },
    ];

    const esTrimestral_cjgp = regimen_cjgp?.toUpperCase() === 'TRIMESTRAL';
    const filasEjemplo_cjgp = esTrimestral_cjgp
      ? filasTrimestral_cjgp
      : filasSemestral_cjgp;

    const hoja_cjgp = XLSX.utils.json_to_sheet(filasEjemplo_cjgp);
    hoja_cjgp['!cols'] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 10 },
      { wch: 8 },
      { wch: 20 },
    ];
    const libro_cjgp = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      libro_cjgp,
      hoja_cjgp,
      esTrimestral_cjgp ? 'Pensum Trimestral' : 'Pensum Semestral',
    );

    return XLSX.write(libro_cjgp, { type: 'buffer', bookType: 'xlsx' });
  }
}
