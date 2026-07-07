import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CursosService } from '../cursos/cursos.service';
import { CrearInscripcionDto_ahbb } from './dto/crear-inscripcion.dto_ahbb';
import { ActualizarEstadoInscripcionDto_ahbb } from './dto/actualizar-estado-inscripcion.dto_ahbb';

@Injectable()
export class InscripcionesService_ahbb {
  constructor(
    private readonly prisma_ahbb: PrismaService,
    private readonly cursosService_ahbb: CursosService,
  ) {}

  async crearInscripcion_ahbb(datos_ahbb: CrearInscripcionDto_ahbb) {
    const curso_ahbb = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb: datos_ahbb.id_curso_inscripcion_ahbb },
      include: {
        horarios: true,
        inscripciones: true,
        prelacion: true,
      },
    });

    if (!curso_ahbb) {
      throw new NotFoundException('Curso no encontrado.');
    }

    await this.validarPrelacion_ahbb(
      datos_ahbb.id_usuario_inscripcion_ahbb,
      curso_ahbb.id_curso_curso_ahbb,
    );
    await this.validarReingreso_ahbb(
      datos_ahbb.id_usuario_inscripcion_ahbb,
      datos_ahbb.id_curso_inscripcion_ahbb,
    );
    await this.validarSolapamiento_ahbb(
      datos_ahbb.id_usuario_inscripcion_ahbb,
      curso_ahbb.horarios,
      curso_ahbb.fechaInicio_ahbb ?? new Date(),
      curso_ahbb.fechaFin_ahbb ?? new Date(),
    );

    return this.prisma_ahbb.$transaction(async (tx_ahbb) => {
      const totalActivos_ahbb = await tx_ahbb.td_inscripcion_ahbb.count({
        where: {
          id_curso_inscripcion_ahbb: datos_ahbb.id_curso_inscripcion_ahbb,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
        },
      });

      const capacidad_ahbb = Number(curso_ahbb.topeEstudiantes_ahbb ?? 5);
      if (totalActivos_ahbb >= capacidad_ahbb) {
        throw new BadRequestException(
          'El curso alcanzó el tope máximo de 5 alumnos.',
        );
      }

      const intentosPrevios_ahbb = await tx_ahbb.td_inscripcion_ahbb.count({
        where: {
          id_usuario_inscripcion_ahbb: datos_ahbb.id_usuario_inscripcion_ahbb,
          id_curso_inscripcion_ahbb: datos_ahbb.id_curso_inscripcion_ahbb,
        },
      });

      return tx_ahbb.td_inscripcion_ahbb.create({
        data: {
          id_usuario_inscripcion_ahbb: datos_ahbb.id_usuario_inscripcion_ahbb,
          id_curso_inscripcion_ahbb: datos_ahbb.id_curso_inscripcion_ahbb,
          estatus_ahbb: 'INSCRITO',
          intento_ahbb: intentosPrevios_ahbb + 1,
        },
      });
    });
  }

  async obtenerTodas_ahbb() {
    return this.prisma_ahbb.td_inscripcion_ahbb.findMany({
      include: {
        alumno: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
          },
        },
        curso: {
          select: {
            id_curso_ahbb: true,
            nombre_ahbb: true,
          },
        },
      },
      orderBy: { creadoEn_ahbb: 'desc' },
    });
  }

  async obtenerHistorialAlumno_ahbb(id_usuario_ahbb: number) {
    return this.prisma_ahbb.td_inscripcion_ahbb.findMany({
      where: { id_usuario_inscripcion_ahbb: id_usuario_ahbb },
      include: {
        curso: {
          include: {
            horarios: true,
            profesor: {
              select: { nombre_ahbb: true, apellido_ahbb: true },
            },
          },
        },
      },
      orderBy: { creadoEn_ahbb: 'desc' },
    });
  }

  async obtenerPorCurso_ahbb(id_curso_ahbb: number) {
    return this.prisma_ahbb.td_inscripcion_ahbb.findMany({
      where: { id_curso_inscripcion_ahbb: id_curso_ahbb },
      include: {
        alumno: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
            cedula_ahbb: true,
          },
        },
        curso: true,
      },
      orderBy: { alumno: { apellido_ahbb: 'asc' } },
    });
  }

  async obtenerAlumnosPorProfesor_ahbb(id_profesor_ahbb: number) {
    return this.prisma_ahbb.td_inscripcion_ahbb.findMany({
      where: {
        curso: { id_usuario_curso_ahbb: id_profesor_ahbb },
      },
      include: {
        alumno: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
            cedula_ahbb: true,
          },
        },
        curso: {
          select: {
            id_curso_ahbb: true,
            nombre_ahbb: true,
          },
        },
      },
      orderBy: [
        { curso: { nombre_ahbb: 'asc' } },
        { alumno: { apellido_ahbb: 'asc' } },
      ],
    });
  }

  async actualizarEstado_ahbb(
    id_inscripcion_ahbb: number,
    datos_ahbb: ActualizarEstadoInscripcionDto_ahbb,
  ) {
    return this.prisma_ahbb.td_inscripcion_ahbb.update({
      where: { id_inscripcion_ahbb },
      data: {
        estatus_ahbb: datos_ahbb.estatus_ahbb,
      },
    });
  }

  async validarSolapamiento_ahbb(
    id_usuario_ahbb: number,
    horariosCursoNuevo_ahbb: any[],
    fechaInicioBase_ahbb: Date,
    fechaFinBase_ahbb: Date,
  ) {
    const solapamientos_ahbb = await this.cursosService_ahbb.obtenerSolapamientos_ahbb(
      id_usuario_ahbb,
      'ALUMNO',
      horariosCursoNuevo_ahbb,
      fechaInicioBase_ahbb,
      fechaFinBase_ahbb,
    );

    if (solapamientos_ahbb.length > 0) {
      const huecos_ahbb = await this.cursosService_ahbb.obtenerHuecosDisponibles_ahbb(
        id_usuario_ahbb,
        'ALUMNO',
        fechaInicioBase_ahbb,
        fechaFinBase_ahbb,
      );

      throw new BadRequestException({
        message: 'SOLAPAMIENTO_DETECTADO',
        payload: {
          solapamientos: solapamientos_ahbb,
          huecosDisponibles: huecos_ahbb,
        },
      });
    }
  }

  async validarPrelacion_ahbb(
    id_usuario_ahbb: number,
    id_curso_prelacion_ahbb?: number | null,
  ) {
    if (!id_curso_prelacion_ahbb) {
      return;
    }

    const aprobada_ahbb = await this.prisma_ahbb.td_inscripcion_ahbb.findFirst({
      where: {
        id_usuario_inscripcion_ahbb: id_usuario_ahbb,
        id_curso_inscripcion_ahbb: id_curso_prelacion_ahbb,
        estatus_ahbb: 'APROBADO',
      },
    });

    if (!aprobada_ahbb) {
      throw new BadRequestException(
        'No cumple la prelación requerida para inscribirse en este curso.',
      );
    }
  }

  async validarReingreso_ahbb(id_usuario_ahbb: number, id_curso_ahbb: number) {
    const inscripcionesPrevias_ahbb =
      await this.prisma_ahbb.td_inscripcion_ahbb.findMany({
        where: {
          id_usuario_inscripcion_ahbb: id_usuario_ahbb,
          id_curso_inscripcion_ahbb: id_curso_ahbb,
        },
        orderBy: { creadoEn_ahbb: 'desc' },
      });

    const tieneAprobado_ahbb = inscripcionesPrevias_ahbb.some(
      (inscripcion_ahbb) => inscripcion_ahbb.estatus_ahbb === 'APROBADO',
    );
    if (tieneAprobado_ahbb) {
      throw new BadRequestException('El alumno ya aprobó este curso.');
    }

    const tieneActivo_ahbb = inscripcionesPrevias_ahbb.some(
      (inscripcion_ahbb) =>
        ['INSCRITO', 'OYENTE'].includes(String(inscripcion_ahbb.estatus_ahbb)),
    );
    if (tieneActivo_ahbb) {
      throw new BadRequestException('Usted ya está inscrito en este curso.');
    }

    const ultima_ahbb = inscripcionesPrevias_ahbb[0];
    if (ultima_ahbb) {
      // Si ya tiene un registro previo, solo puede re-inscribirse si reprobó
      if (ultima_ahbb.estatus_ahbb !== 'REPROBADO') {
        throw new BadRequestException(
          'Solo es posible inscribirse nuevamente si el estado previo es REPROBADO.',
        );
      }

      // Además, el curso debe haber terminado (opcional, pero sugerido por el usuario)
      // En este sistema, REPROBADO solo se asigna al final, así que la lógica de REPROBADO ya cubre "que terminó"
    }
  }
}
