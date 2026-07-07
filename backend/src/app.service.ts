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
      
      return { 
        totalCursos, 
        cursosActivos, 
        cursosPendientes: cursosBorradores, // we re-use this prop for borradores/ocultos 
        totalEstudiantes: totalAlumnos,
        alumnosPendientes
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

      return {
        totalCursos,
        cursosActivos,
        totalEstudiantes
      };
    } else if (rol === 'ALUMNO') {
      const enCurso = await this.prisma_ahbb.td_inscripcion_ahbb.count({ 
        where: { id_usuario_inscripcion_ahbb: userId, estatus_ahbb: { in: ['INSCRITO', 'OYENTE'] } } 
      });
      const certificados = await this.prisma_ahbb.td_certificado_ahbb.count({
        where: { inscripcion: { id_usuario_inscripcion_ahbb: userId } }
      });

      return {
        cursosInscritos: enCurso,
        certificados
      };
    }

    return {};
  }
}
