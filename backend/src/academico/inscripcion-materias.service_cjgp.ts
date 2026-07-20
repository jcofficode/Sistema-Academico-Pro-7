import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MotorReglasService_cjgp } from './motor-reglas.service_cjgp';
import { PagosService_ap } from '../pagos/pagos.service_ap';

/**
 * InscripcionMateriasService_cjgp — Épica 3: Inscripción sin Fricción.
 *
 * Expone la "vitrina" (oferta del período etiquetada por el Motor de Reglas)
 * y procesa la inscripción definitiva. Toda solicitud pasa por la auditoría
 * del Guardián antes de tocar la base de datos.
 */
@Injectable()
export class InscripcionMateriasService_cjgp {
  constructor(
    private readonly prisma_cjgp: PrismaService,
    private readonly motorReglas_cjgp: MotorReglasService_cjgp,
    private readonly pagosService_ap: PagosService_ap,
  ) {}

  /** Período activo o error claro si la coordinación aún no abrió uno. */
  private async obtenerPeriodoActivo_cjgp() {
    const periodo_cjgp =
      await this.prisma_cjgp.td_periodo_academico_cjgp.findFirst({
        where: { activo_cjgp: true },
      });
    if (!periodo_cjgp) {
      throw new BadRequestException(
        'No hay un período académico activo. Contacta a la coordinación.',
      );
    }
    return periodo_cjgp;
  }

  /**
   * Vitrina de materias (Épica 3): pensum completo de la carrera agrupado
   * por bloque, con la condición de cada materia y el estado de créditos
   * del alumno para alimentar la calculadora reactiva.
   */
  async obtenerVitrina_cjgp(id_usuario_cjgp: number, id_carrera_cjgp: number) {
    const carrera_cjgp = await this.prisma_cjgp.td_carrera_cjgp.findUnique({
      where: { id_carrera_cjgp },
    });
    if (!carrera_cjgp) {
      throw new NotFoundException('Carrera no encontrada.');
    }

    const periodo_cjgp = await this.obtenerPeriodoActivo_cjgp();

    const [evaluaciones_cjgp, creditosInscritos_cjgp] = await Promise.all([
      this.motorReglas_cjgp.evaluarPensum_cjgp(
        id_usuario_cjgp,
        id_carrera_cjgp,
        periodo_cjgp.id_periodo_cjgp,
      ),
      this.motorReglas_cjgp.calcularCreditosInscritos_cjgp(
        id_usuario_cjgp,
        periodo_cjgp.id_periodo_cjgp,
      ),
    ]);

    // Agrupar por bloque para que la vitrina se dibuje como malla curricular
    const totalBloques_cjgp =
      carrera_cjgp.duracionAnios_cjgp *
      (carrera_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 3 : 2);

    const bloques_cjgp = Array.from(
      { length: totalBloques_cjgp },
      (_, indice_cjgp) => ({
        nroBloque_cjgp: indice_cjgp + 1,
        materias_cjgp: evaluaciones_cjgp.filter(
          (evaluacion_cjgp) => evaluacion_cjgp.nroBloque_cjgp === indice_cjgp + 1,
        ),
      }),
    ).filter((bloque_cjgp) => bloque_cjgp.materias_cjgp.length > 0);

    // Verificar si el alumno es solvente para el período activo
    let solvente_ap = true;
    try {
      await this.pagosService_ap.verificarSolvencia_ap(id_usuario_cjgp, periodo_cjgp.id_periodo_cjgp);
    } catch (e) {
      solvente_ap = false;
    }

    return {
      carrera: {
        id_carrera_cjgp: carrera_cjgp.id_carrera_cjgp,
        nombre_cjgp: carrera_cjgp.nombre_cjgp,
        regimen_cjgp: carrera_cjgp.regimen_cjgp,
        limiteCreditos_cjgp: carrera_cjgp.limiteCreditos_cjgp,
      },
      periodo: periodo_cjgp,
      creditosInscritos_cjgp,
      bloques_cjgp,
      solvente_ap,
    };
  }

  /**
   * Procesa la inscripción del alumno. El Motor de Reglas re-audita en el
   * servidor: si algo no cumple el reglamento, se devuelve la lista de
   * violaciones en lenguaje claro y NO se inscribe nada (todo o nada).
   */
  async inscribir_cjgp(
    id_usuario_cjgp: number,
    id_carrera_cjgp: number,
    id_periodo_cjgp: number,
    idsMaterias_cjgp: number[],
  ) {
    const periodo_cjgp =
      await this.prisma_cjgp.td_periodo_academico_cjgp.findUnique({
        where: { id_periodo_cjgp },
      });
    if (!periodo_cjgp?.activo_cjgp) {
      throw new BadRequestException(
        'El período indicado no está activo para inscripciones.',
      );
    }

    // ── REGLA DE NEGOCIO CENTRAL (_ap): verificar solvencia del alumno ──
    // El alumno debe tener un pago CONFIRMADO del período activo.
    // Si no, se devuelve un error empático con violaciones claras.
    await this.pagosService_ap.verificarSolvencia_ap(id_usuario_cjgp, id_periodo_cjgp);

    const auditoria_cjgp = await this.motorReglas_cjgp.auditarInscripcion_cjgp(
      id_usuario_cjgp,
      id_carrera_cjgp,
      id_periodo_cjgp,
      idsMaterias_cjgp,
    );

    if (!auditoria_cjgp.valida_cjgp) {
      // 422: petición entendida pero rechazada por el reglamento académico
      throw new BadRequestException({
        mensaje: 'La inscripción no cumple el reglamento académico.',
        violaciones: auditoria_cjgp.violaciones_cjgp,
      });
    }

    // upsert: si la materia fue RETIRADA este mismo período, la inscripción
    // se reactiva en lugar de chocar con el constraint único.
    const inscripciones_cjgp = await this.prisma_cjgp.$transaction(
      idsMaterias_cjgp.map((idMateria_cjgp) =>
        this.prisma_cjgp.td_inscripcion_materia_cjgp.upsert({
          where: {
            id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
              id_usuario_im_cjgp: id_usuario_cjgp,
              id_materia_im_cjgp: idMateria_cjgp,
              id_periodo_im_cjgp: id_periodo_cjgp,
            },
          },
          create: {
            id_usuario_im_cjgp: id_usuario_cjgp,
            id_materia_im_cjgp: idMateria_cjgp,
            id_periodo_im_cjgp: id_periodo_cjgp,
          },
          update: {
            estatus_cjgp: 'INSCRITO',
            actualizadoEn_cjgp: new Date(),
          },
          include: { materia_cjgp: true },
        }),
      ),
    );

    return {
      exito: true,
      inscripciones: inscripciones_cjgp,
      mensaje: `Inscripción procesada: ${inscripciones_cjgp.length} materia(s) registradas para ${periodo_cjgp.nombre_cjgp}.`,
    };
  }

  /** Historial académico del alumno en el módulo de carreras. */
  async obtenerHistorial_cjgp(id_usuario_cjgp: number) {
    return this.prisma_cjgp.td_inscripcion_materia_cjgp.findMany({
      where: { id_usuario_im_cjgp: id_usuario_cjgp },
      include: {
        materia_cjgp: {
          include: {
            carrera_cjgp: true,
            profesor_cjgp: {
              select: { nombre_ahbb: true, apellido_ahbb: true },
            },
          },
        },
        periodo_cjgp: true,
      },
      orderBy: [{ creadoEn_cjgp: 'desc' }],
    });
  }

  /** Retiro de una materia inscrita (solo mientras siga en estatus INSCRITO). */
  async retirar_cjgp(id_usuario_cjgp: number, id_inscripcion_materia_cjgp: number) {
    const inscripcion_cjgp =
      await this.prisma_cjgp.td_inscripcion_materia_cjgp.findUnique({
        where: { id_inscripcion_materia_cjgp },
        include: { materia_cjgp: true },
      });

    if (
      !inscripcion_cjgp ||
      inscripcion_cjgp.id_usuario_im_cjgp !== id_usuario_cjgp
    ) {
      throw new NotFoundException('Inscripción no encontrada.');
    }
    if (inscripcion_cjgp.estatus_cjgp !== 'INSCRITO') {
      throw new BadRequestException(
        'Solo puedes retirar materias que sigan en curso.',
      );
    }

    await this.prisma_cjgp.td_inscripcion_materia_cjgp.update({
      where: { id_inscripcion_materia_cjgp },
      data: { estatus_cjgp: 'RETIRADO' },
    });

    return {
      exito: true,
      mensaje: `Materia "${inscripcion_cjgp.materia_cjgp.nombre_cjgp}" retirada correctamente.`,
    };
  }
}
