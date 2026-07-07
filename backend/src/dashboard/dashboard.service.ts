import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  async getDashboardStats_ahbb(userId_ahbb: number, rol_ahbb: string) {
    if (rol_ahbb === 'ADMIN') {
      const totalCursos = await this.prisma_ahbb.td_curso_ahbb.count();
      const cursosActivos = await this.prisma_ahbb.td_curso_ahbb.count({
        where: { isPublished_ahbb: true, imagenBloqueada_ahbb: { not: true } },
      });
      const totalEstudiantes = await this.prisma_ahbb.td_usuario_ahbb.count({
        where: { rol_ahbb: 'ALUMNO' },
      });
      const alumnosPendientes = await this.prisma_ahbb.td_usuario_ahbb.count({
        where: { rol_ahbb: 'ALUMNO', estadoCuenta_ahbb: 'PENDIENTE_APROBACION' },
      });
      return { totalCursos, cursosActivos, totalEstudiantes, alumnosPendientes };
    }

    if (rol_ahbb === 'PROFESOR') {
      const totalCursos = await this.prisma_ahbb.td_curso_ahbb.count({
        where: { id_usuario_curso_ahbb: userId_ahbb },
      });
      const cursosActivos = await this.prisma_ahbb.td_curso_ahbb.count({
        where: { 
          id_usuario_curso_ahbb: userId_ahbb, 
          isPublished_ahbb: true, 
          imagenBloqueada_ahbb: { not: true } 
        },
      });
      
      const cursos = await this.prisma_ahbb.td_curso_ahbb.findMany({
        where: { id_usuario_curso_ahbb: userId_ahbb },
        select: { id_curso_ahbb: true },
      });
      const cursoIds = cursos.map(c => c.id_curso_ahbb);
      
      const uniqueStudents = await this.prisma_ahbb.td_inscripcion_ahbb.groupBy({
        by: ['id_usuario_inscripcion_ahbb'],
        where: {
           id_curso_inscripcion_ahbb: { in: cursoIds }
        }
      });
      const totalEstudiantes = uniqueStudents.length;

      return { totalCursos, cursosActivos, totalEstudiantes };
    }

    if (rol_ahbb === 'ALUMNO') {
      const cursosInscritos = await this.prisma_ahbb.td_inscripcion_ahbb.count({
        where: { 
          id_usuario_inscripcion_ahbb: userId_ahbb,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] }
        },
      });
      
      const certificadosCount = await this.prisma_ahbb.td_inscripcion_ahbb.count({
         where: { 
           id_usuario_inscripcion_ahbb: userId_ahbb,
           certificado: { isNot: null }
         }
      });

      return { cursosInscritos, certificados: certificadosCount };
    }

    return {};
  }
}
