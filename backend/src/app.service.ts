import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  getHello(): string {
    return 'Backend de la Academia H&B corriendo exitosamente';
  }

  async getDashboardStats(userId: number, rol: string) {
    if (rol === 'ADMIN') {
      const totalCursos = await this.prisma_ahbb.td_curso_ahbb.count();
      const cursosActivos = await this.prisma_ahbb.td_curso_ahbb.count({ where: { isPublished_ahbb: true } });
      const cursosBorradores = totalCursos - cursosActivos;
      const totalAlumnos = await this.prisma_ahbb.td_usuario_ahbb.count({ where: { rol_ahbb: 'ALUMNO', estadoCuenta_ahbb: 'ACTIVO' } });
      const alumnosPendientes = await this.prisma_ahbb.td_usuario_ahbb.count({ where: { rol_ahbb: 'ALUMNO', estadoCuenta_ahbb: 'PENDIENTE_APROBACION' } });
      
      // ── Módulo de Carreras (_cjgp): visión global para el administrador ──
      const [totalCarreras_cjgp, totalMaterias_cjgp, periodoActivo_cjgp, planesPublicados_jc, materiasCursando_cjgp, carreras_cjgp] =
        await Promise.all([
          this.prisma_ahbb.td_carrera_cjgp.count(),
          this.prisma_ahbb.td_materia_cjgp.count(),
          this.prisma_ahbb.td_periodo_academico_cjgp.findFirst({ where: { activo_cjgp: true } }),
          this.prisma_ahbb.td_plan_evaluacion_jc.count({ where: { estado_jc: 'PUBLICADO' } }),
          this.prisma_ahbb.td_inscripcion_materia_cjgp.count({ where: { estatus_cjgp: 'INSCRITO' } }),
          this.prisma_ahbb.td_carrera_cjgp.findMany({ select: { nombre_cjgp: true } }),
        ]);

      return {
        totalCursos,
        cursosActivos,
        cursosPendientes: cursosBorradores, // we re-use this prop for borradores/ocultos
        totalEstudiantes: totalAlumnos,
        alumnosPendientes,
        totalCarreras: totalCarreras_cjgp,
        totalMaterias: totalMaterias_cjgp,
        periodoActivo: periodoActivo_cjgp?.nombre_cjgp ?? null,
        planesPublicados: planesPublicados_jc,
        materiasCursando: materiasCursando_cjgp,
        carrerasNombres: carreras_cjgp.map((c_cjgp) => c_cjgp.nombre_cjgp),
      };
    } else if (rol === 'PROFESOR') {
      const totalCursos = await this.prisma_ahbb.td_curso_ahbb.count({ where: { id_usuario_curso_ahbb: userId } });
      const cursosActivos = await this.prisma_ahbb.td_curso_ahbb.count({ where: { id_usuario_curso_ahbb: userId, isPublished_ahbb: true } });
      
      // Amount of unique students enrolled in courses dictated by this professor
      const students = await this.prisma_ahbb.td_inscripcion_ahbb.groupBy({
        by: ['id_usuario_inscripcion_ahbb'],
        where: { curso: { id_usuario_curso_ahbb: userId }, estatus_ahbb: { in: ['INSCRITO', 'APROBADO', 'OYENTE'] } }
      });
      const totalEstudiantes = students.length;

      // ── Módulo de Carreras (_cjgp): las materias que el profesor dicta ──
      const materiasAsignadas_cjgp = await this.prisma_ahbb.td_materia_cjgp.findMany({
        where: { id_profesor_materia_cjgp: userId },
        include: {
          carrera_cjgp: { select: { nombre_cjgp: true } },
          inscripciones_cjgp: {
            where: { estatus_cjgp: 'INSCRITO' },
            select: { id_usuario_im_cjgp: true },
          },
        },
      });

      const carrerasProfesor_cjgp = [
        ...new Set(
          materiasAsignadas_cjgp.map((m_cjgp) => m_cjgp.carrera_cjgp.nombre_cjgp),
        ),
      ];
      const alumnosEnMaterias_cjgp = new Set(
        materiasAsignadas_cjgp.flatMap((m_cjgp) =>
          m_cjgp.inscripciones_cjgp.map((i_cjgp) => i_cjgp.id_usuario_im_cjgp),
        ),
      ).size;

      return {
        totalCursos,
        cursosActivos,
        totalEstudiantes,
        materiasAsignadas: materiasAsignadas_cjgp.length,
        alumnosEnMaterias: alumnosEnMaterias_cjgp,
        carrerasProfesor: carrerasProfesor_cjgp,
      };
    } else if (rol === 'ALUMNO') {
      const enCurso = await this.prisma_ahbb.td_inscripcion_ahbb.count({
        where: { id_usuario_inscripcion_ahbb: userId, estatus_ahbb: { in: ['INSCRITO', 'OYENTE'] } }
      });
      const certificados = await this.prisma_ahbb.td_certificado_ahbb.count({
        where: { inscripcion: { id_usuario_inscripcion_ahbb: userId } }
      });

      // ── Módulo de Carreras (_cjgp): carreras del alumno y sus materias ──
      const inscripcionesMaterias_cjgp =
        await this.prisma_ahbb.td_inscripcion_materia_cjgp.findMany({
          where: { id_usuario_im_cjgp: userId, estatus_cjgp: { not: 'RETIRADO' } },
          include: {
            materia_cjgp: {
              include: {
                carrera_cjgp: { select: { nombre_cjgp: true, codigo_cjgp: true } },
              },
            },
          },
        });

      const carrerasMapa_cjgp = new Map<string, string>();
      for (const inscripcion_cjgp of inscripcionesMaterias_cjgp) {
        carrerasMapa_cjgp.set(
          inscripcion_cjgp.materia_cjgp.carrera_cjgp.codigo_cjgp,
          inscripcion_cjgp.materia_cjgp.carrera_cjgp.nombre_cjgp,
        );
      }

      return {
        cursosInscritos: enCurso,
        certificados,
        carrerasAlumno: [...carrerasMapa_cjgp.values()],
        totalCarreras: carrerasMapa_cjgp.size,
        materiasEnCurso: inscripcionesMaterias_cjgp.filter(
          (i_cjgp) => i_cjgp.estatus_cjgp === 'INSCRITO',
        ).length,
        materiasAprobadas: inscripcionesMaterias_cjgp.filter(
          (i_cjgp) => i_cjgp.estatus_cjgp === 'APROBADO',
        ).length,
        totalMateriasInscritas: inscripcionesMaterias_cjgp.length,
      };
    }

    return {};
  }
}
