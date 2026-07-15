import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** Resultado de evaluar una materia contra el reglamento (Épica 2). */
export interface EvaluacionMateria_cjgp {
  id_materia_cjgp: number;
  codigo_cjgp: string;
  nombre_cjgp: string;
  creditos_cjgp: number;
  nroBloque_cjgp: number;
  // ELEGIBLE | BLOQUEADA | INSCRITA | APROBADA
  condicion_cjgp: string;
  requisitosFaltantes_cjgp: { codigo_cjgp: string; nombre_cjgp: string }[];
  // Profesor asignado por el administrador (visible en la vitrina del alumno)
  profesor_cjgp: { nombre_ahbb: string; apellido_ahbb: string } | null;
}

/**
 * MotorReglasService_cjgp — Épica 2: "El Guardián".
 *
 * Aplica el reglamento académico de forma automática e invisible:
 *  1. Bloqueo inteligente de prelaciones: una materia solo es elegible
 *     si TODAS sus prelaciones figuran APROBADAS en el historial del alumno.
 *  2. Control de créditos: la suma de créditos inscritos en el período
 *     no puede exceder el límite definido por la carrera.
 *
 * La vitrina (Épica 3) y la inscripción usan este mismo servicio, de modo
 * que lo que el alumno ve en pantalla y lo que el servidor permite
 * procesar nunca se contradicen.
 */
@Injectable()
export class MotorReglasService_cjgp {
  constructor(private readonly prisma_cjgp: PrismaService) {}

  /** IDs de materias APROBADAS en todo el historial del alumno. */
  async obtenerAprobadas_cjgp(id_usuario_cjgp: number): Promise<Set<number>> {
    const aprobadas_cjgp =
      await this.prisma_cjgp.td_inscripcion_materia_cjgp.findMany({
        where: { id_usuario_im_cjgp: id_usuario_cjgp, estatus_cjgp: 'APROBADO' },
        select: { id_materia_im_cjgp: true },
      });
    return new Set(aprobadas_cjgp.map((i_cjgp) => i_cjgp.id_materia_im_cjgp));
  }

  /** IDs de materias con inscripción vigente (INSCRITO) en el período dado. */
  async obtenerInscritas_cjgp(
    id_usuario_cjgp: number,
    id_periodo_cjgp: number,
  ): Promise<Set<number>> {
    const inscritas_cjgp =
      await this.prisma_cjgp.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_usuario_im_cjgp: id_usuario_cjgp,
          id_periodo_im_cjgp: id_periodo_cjgp,
          estatus_cjgp: 'INSCRITO',
        },
        select: { id_materia_im_cjgp: true },
      });
    return new Set(inscritas_cjgp.map((i_cjgp) => i_cjgp.id_materia_im_cjgp));
  }

  /** Créditos ya comprometidos por el alumno en el período (estatus INSCRITO). */
  async calcularCreditosInscritos_cjgp(
    id_usuario_cjgp: number,
    id_periodo_cjgp: number,
  ): Promise<number> {
    const inscripciones_cjgp =
      await this.prisma_cjgp.td_inscripcion_materia_cjgp.findMany({
        where: {
          id_usuario_im_cjgp: id_usuario_cjgp,
          id_periodo_im_cjgp: id_periodo_cjgp,
          estatus_cjgp: 'INSCRITO',
        },
        include: { materia_cjgp: { select: { creditos_cjgp: true } } },
      });

    return inscripciones_cjgp.reduce(
      (suma_cjgp, inscripcion_cjgp) =>
        suma_cjgp + inscripcion_cjgp.materia_cjgp.creditos_cjgp,
      0,
    );
  }

  /**
   * Evalúa TODAS las materias de una carrera contra el historial del alumno.
   * Es la fuente de datos de la vitrina: cada materia sale etiquetada con su
   * condición y, si está bloqueada, con la lista exacta de requisitos faltantes
   * (para el mensaje empático del frontend).
   */
  async evaluarPensum_cjgp(
    id_usuario_cjgp: number,
    id_carrera_cjgp: number,
    id_periodo_cjgp: number,
  ): Promise<EvaluacionMateria_cjgp[]> {
    const [materias_cjgp, aprobadas_cjgp, inscritas_cjgp] = await Promise.all([
      this.prisma_cjgp.td_materia_cjgp.findMany({
        where: { id_carrera_materia_cjgp: id_carrera_cjgp },
        include: {
          prelaciones_cjgp: { include: { requisito_cjgp: true } },
          profesor_cjgp: {
            select: { nombre_ahbb: true, apellido_ahbb: true },
          },
        },
        orderBy: [{ nroBloque_cjgp: 'asc' }, { codigo_cjgp: 'asc' }],
      }),
      this.obtenerAprobadas_cjgp(id_usuario_cjgp),
      this.obtenerInscritas_cjgp(id_usuario_cjgp, id_periodo_cjgp),
    ]);

    return materias_cjgp.map((materia_cjgp) => {
      const requisitosFaltantes_cjgp = materia_cjgp.prelaciones_cjgp
        .filter(
          (prelacion_cjgp) =>
            !aprobadas_cjgp.has(prelacion_cjgp.id_materia_requisito_cjgp),
        )
        .map((prelacion_cjgp) => ({
          codigo_cjgp: prelacion_cjgp.requisito_cjgp.codigo_cjgp,
          nombre_cjgp: prelacion_cjgp.requisito_cjgp.nombre_cjgp,
        }));

      let condicion_cjgp = 'ELEGIBLE';
      if (aprobadas_cjgp.has(materia_cjgp.id_materia_cjgp)) {
        condicion_cjgp = 'APROBADA';
      } else if (inscritas_cjgp.has(materia_cjgp.id_materia_cjgp)) {
        condicion_cjgp = 'INSCRITA';
      } else if (requisitosFaltantes_cjgp.length > 0) {
        condicion_cjgp = 'BLOQUEADA';
      }

      return {
        id_materia_cjgp: materia_cjgp.id_materia_cjgp,
        codigo_cjgp: materia_cjgp.codigo_cjgp,
        nombre_cjgp: materia_cjgp.nombre_cjgp,
        creditos_cjgp: materia_cjgp.creditos_cjgp,
        nroBloque_cjgp: materia_cjgp.nroBloque_cjgp,
        condicion_cjgp,
        requisitosFaltantes_cjgp,
        profesor_cjgp: materia_cjgp.profesor_cjgp ?? null,
      };
    });
  }

  /**
   * Auditoría final antes de procesar una inscripción (Épica 2).
   * Reaplica en el servidor las mismas reglas de la vitrina y devuelve
   * la lista de violaciones en lenguaje claro (nunca códigos crípticos).
   */
  async auditarInscripcion_cjgp(
    id_usuario_cjgp: number,
    id_carrera_cjgp: number,
    id_periodo_cjgp: number,
    idsMaterias_cjgp: number[],
  ): Promise<{ valida_cjgp: boolean; violaciones_cjgp: string[] }> {
    const violaciones_cjgp: string[] = [];

    const [carrera_cjgp, evaluaciones_cjgp, creditosActuales_cjgp] =
      await Promise.all([
        this.prisma_cjgp.td_carrera_cjgp.findUnique({
          where: { id_carrera_cjgp },
        }),
        this.evaluarPensum_cjgp(id_usuario_cjgp, id_carrera_cjgp, id_periodo_cjgp),
        this.calcularCreditosInscritos_cjgp(id_usuario_cjgp, id_periodo_cjgp),
      ]);

    if (!carrera_cjgp) {
      return {
        valida_cjgp: false,
        violaciones_cjgp: ['La carrera indicada no existe.'],
      };
    }

    const porId_cjgp = new Map(
      evaluaciones_cjgp.map((evaluacion_cjgp) => [
        evaluacion_cjgp.id_materia_cjgp,
        evaluacion_cjgp,
      ]),
    );

    let creditosNuevos_cjgp = 0;
    for (const idMateria_cjgp of idsMaterias_cjgp) {
      const evaluacion_cjgp = porId_cjgp.get(idMateria_cjgp);

      if (!evaluacion_cjgp) {
        violaciones_cjgp.push(
          'Una de las materias seleccionadas no pertenece a la carrera.',
        );
        continue;
      }
      if (evaluacion_cjgp.condicion_cjgp === 'APROBADA') {
        violaciones_cjgp.push(
          `Ya aprobaste "${evaluacion_cjgp.nombre_cjgp}"; no es necesario volver a cursarla.`,
        );
        continue;
      }
      if (evaluacion_cjgp.condicion_cjgp === 'INSCRITA') {
        violaciones_cjgp.push(
          `Ya estás inscrito en "${evaluacion_cjgp.nombre_cjgp}" este período.`,
        );
        continue;
      }
      if (evaluacion_cjgp.condicion_cjgp === 'BLOQUEADA') {
        const nombresFaltantes_cjgp = evaluacion_cjgp.requisitosFaltantes_cjgp
          .map((req_cjgp) => req_cjgp.nombre_cjgp)
          .join(', ');
        violaciones_cjgp.push(
          `"${evaluacion_cjgp.nombre_cjgp}" requiere aprobar antes: ${nombresFaltantes_cjgp}.`,
        );
        continue;
      }

      creditosNuevos_cjgp += evaluacion_cjgp.creditos_cjgp;
    }

    // Control de créditos: lo ya inscrito + lo nuevo no puede superar el límite
    const totalCreditos_cjgp = creditosActuales_cjgp + creditosNuevos_cjgp;
    if (totalCreditos_cjgp > carrera_cjgp.limiteCreditos_cjgp) {
      violaciones_cjgp.push(
        `Has alcanzado el límite máximo de ${carrera_cjgp.limiteCreditos_cjgp} créditos para este período (intentas inscribir ${totalCreditos_cjgp}). Por favor, desmarca una materia para continuar.`,
      );
    }

    return {
      valida_cjgp: violaciones_cjgp.length === 0,
      violaciones_cjgp,
    };
  }
}
