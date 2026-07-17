import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MultimediaService_jf {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecuta una consulta o mutation dentro de una transacción PostgreSQL
   * estableciendo la variable local 'app.usuario_actual' para que actúen las políticas RLS.
   */
  private async ejecutarConRLS<T>(usuarioId: number, callback: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.usuario_actual = '${usuarioId}';`);
      return callback(tx);
    });
  }

  // ─── BLOQUES ──────────────────────────────────────────────────

  async crearBloque(usuarioId: number, datos: any) {
    // Verificar que el usuario sea profesor del curso o administrador
    await this.verificarPermisoEscrituraCurso(datos.id_curso_bloque_jf, usuarioId);

    return this.prisma.td_bloques_jf.create({
      data: {
        id_curso_bloque_jf: datos.id_curso_bloque_jf,
        nombre_jf: datos.nombre_jf,
        descripcion_jf: datos.descripcion_jf,
        orden_jf: datos.orden_jf,
      },
    });
  }

  async actualizarBloque(id_bloque_jf: number, usuarioId: number, datos: any) {
    const bloque = await this.prisma.td_bloques_jf.findUnique({
      where: { id_bloque_jf },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');

    await this.verificarPermisoEscrituraCurso(bloque.id_curso_bloque_jf, usuarioId);

    return this.prisma.td_bloques_jf.update({
      where: { id_bloque_jf },
      data: {
        nombre_jf: datos.nombre_jf ?? undefined,
        descripcion_jf: datos.descripcion_jf ?? undefined,
        orden_jf: datos.orden_jf ?? undefined,
        actualizadoEn_jf: new Date(),
      },
    });
  }

  async eliminarBloque(id_bloque_jf: number, usuarioId: number) {
    const bloque = await this.prisma.td_bloques_jf.findUnique({
      where: { id_bloque_jf },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');

    await this.verificarPermisoEscrituraCurso(bloque.id_curso_bloque_jf, usuarioId);

    await this.prisma.td_bloques_jf.delete({
      where: { id_bloque_jf },
    });

    return { exito: true };
  }

  // ─── LECCIONES ─────────────────────────────────────────────────

  async crearLeccion(usuarioId: number, datos: any) {
    const bloque = await this.prisma.td_bloques_jf.findUnique({
      where: { id_bloque_jf: datos.id_bloque_leccion_jf },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');

    await this.verificarPermisoEscrituraCurso(bloque.id_curso_bloque_jf, usuarioId);

    // Registra en RLS
    return this.ejecutarConRLS(usuarioId, async (tx) => {
      return tx.td_lecciones_jf.create({
        data: {
          id_bloque_leccion_jf: datos.id_bloque_leccion_jf,
          titulo_jf: datos.titulo_jf,
          descripcion_jf: datos.descripcion_jf,
          orden_jf: datos.orden_jf,
          tipo_jf: datos.tipo_jf,
          contenidoTexto_jf: datos.contenidoTexto_jf,
        },
      });
    });
  }

  async actualizarLeccion(id_leccion_jf: number, usuarioId: number, datos: any) {
    const leccion = await this.prisma.td_lecciones_jf.findUnique({
      where: { id_leccion_jf },
      include: { bloque_jf: true },
    });
    if (!leccion) throw new NotFoundException('Lección no encontrada');

    await this.verificarPermisoEscrituraCurso(leccion.bloque_jf.id_curso_bloque_jf, usuarioId);

    return this.ejecutarConRLS(usuarioId, async (tx) => {
      return tx.td_lecciones_jf.update({
        where: { id_leccion_jf },
        data: {
          titulo_jf: datos.titulo_jf ?? undefined,
          descripcion_jf: datos.descripcion_jf ?? undefined,
          orden_jf: datos.orden_jf ?? undefined,
          tipo_jf: datos.tipo_jf ?? undefined,
          contenidoTexto_jf: datos.contenidoTexto_jf ?? null,
          actualizadoEn_jf: new Date(),
        },
      });
    });
  }

  async eliminarLeccion(id_leccion_jf: number, usuarioId: number) {
    const leccion = await this.prisma.td_lecciones_jf.findUnique({
      where: { id_leccion_jf },
      include: { bloque_jf: true },
    });
    if (!leccion) throw new NotFoundException('Lección no encontrada');

    await this.verificarPermisoEscrituraCurso(leccion.bloque_jf.id_curso_bloque_jf, usuarioId);

    // Si tiene video asociado, eliminarlo del disco físicamente
    if (leccion.urlArchivo_jf) {
      try {
        const filePath = path.resolve(leccion.urlArchivo_jf);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error al borrar archivo físico de video:', err);
      }
    }

    return this.ejecutarConRLS(usuarioId, async (tx) => {
      await tx.td_lecciones_jf.delete({
        where: { id_leccion_jf },
      });
      return { exito: true };
    });
  }

  async guardarVideoLeccion(id_leccion_jf: number, usuarioId: number, file: Express.Multer.File) {
    const leccion = await this.prisma.td_lecciones_jf.findUnique({
      where: { id_leccion_jf },
      include: { bloque_jf: true },
    });
    if (!leccion) throw new NotFoundException('Lección no encontrada');

    await this.verificarPermisoEscrituraCurso(leccion.bloque_jf.id_curso_bloque_jf, usuarioId);

    // Guardar ruta
    const dbPath = file.path; // e.g. uploads/lecciones_jf/xxxx.mp4

    return this.ejecutarConRLS(usuarioId, async (tx) => {
      return tx.td_lecciones_jf.update({
        where: { id_leccion_jf },
        data: {
          urlArchivo_jf: dbPath,
          actualizadoEn_jf: new Date(),
        },
      });
    });
  }

  // ─── OBTENER CONTENIDO (ALUMNO Y PROFESOR) ────────────────────

  async obtenerContenidoCurso(cursoId: number, usuarioId: number, rol: string) {
    // Si es ALUMNO, verificar que esté inscrito en el curso
    if (rol === 'ALUMNO') {
      const inscripcion = await this.prisma.td_inscripcion_ahbb.findFirst({
        where: {
          id_curso_inscripcion_ahbb: cursoId,
          id_usuario_inscripcion_ahbb: usuarioId,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
        },
      });
      if (!inscripcion) {
        throw new ForbiddenException('No estás inscrito en este curso.');
      }

      // Consulta protegida con RLS
      return this.ejecutarConRLS(usuarioId, async (tx) => {
        const bloques = await tx.td_bloques_jf.findMany({
          where: { id_curso_bloque_jf: cursoId },
          orderBy: { orden_jf: 'asc' },
          include: {
            lecciones_jf: {
              orderBy: { orden_jf: 'asc' },
              include: {
                progresos_jf: {
                  where: { id_usuario_alumno_jf: usuarioId },
                },
              },
            },
            evaluacion_jf: {
              include: {
                intentos_jf: {
                  where: { id_usuario_alumno_jf: usuarioId },
                  orderBy: { fechaIntento_jf: 'desc' },
                },
              },
            },
          },
        });

        // Calcular progreso global del curso
        let totalLecciones = 0;
        let leccionesCompletadas = 0;
        bloques.forEach((b) => {
          b.lecciones_jf.forEach((l) => {
            totalLecciones++;
            if (l.progresos_jf[0]?.completada_jf) {
              leccionesCompletadas++;
            }
          });
        });

        const porcentajeProgreso = totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;

        return {
          bloques,
          progresoCurso: {
            totalLecciones,
            leccionesCompletadas,
            porcentajeProgreso,
          },
        };
      });
    } else {
      // Profesores / Admins
      // Verificar que el profesor dicte el curso o sea admin
      const curso = await this.prisma.td_curso_ahbb.findUnique({
        where: { id_curso_ahbb: cursoId },
      });
      if (!curso) throw new NotFoundException('Curso no encontrado');
      if (rol === 'PROFESOR' && curso.id_usuario_curso_ahbb !== usuarioId) {
        throw new ForbiddenException('No tienes permisos de profesor sobre este curso.');
      }

      // Obtener bloques, lecciones y estadísticas de alumnos
      const bloques = await this.prisma.td_bloques_jf.findMany({
        where: { id_curso_bloque_jf: cursoId },
        orderBy: { orden_jf: 'asc' },
        include: {
          lecciones_jf: {
            orderBy: { orden_jf: 'asc' },
          },
          evaluacion_jf: true,
        },
      });

      // Obtener el progreso consolidado de los alumnos inscritos
      const inscritos = await this.prisma.td_inscripcion_ahbb.findMany({
        where: {
          id_curso_inscripcion_ahbb: cursoId,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
        },
        include: {
          alumno: {
            select: {
              id_usuario_ahbb: true,
              nombre_ahbb: true,
              apellido_ahbb: true,
              correo_ahbb: true,
            },
          },
          progresosMultimedia_jf: {
            include: { leccion_jf: true },
          },
        },
      });

      const totalLecciones = bloques.reduce((acc, b) => acc + b.lecciones_jf.length, 0);

      const progresoAlumnos = inscritos.map((ins) => {
        const completadas = ins.progresosMultimedia_jf.filter((p) => p.completada_jf).length;
        const pct = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;

        return {
          alumnoId: ins.alumno.id_usuario_ahbb,
          nombre: `${ins.alumno.nombre_ahbb} ${ins.alumno.apellido_ahbb}`,
          correo: ins.alumno.correo_ahbb,
          leccionesCompletadas: completadas,
          porcentaje: pct,
        };
      });

      return {
        bloques,
        progresoAlumnos,
        totalLecciones,
      };
    }
  }

  // ─── STREAM DE VIDEO ───────────────────────────────────────────

  async obtenerLeccionParaStream(id_leccion_jf: number, usuarioId: number) {
    // Comprobar la lección utilizando RLS transaccional para validar acceso
    return this.ejecutarConRLS(usuarioId, async (tx) => {
      const leccion = await tx.td_lecciones_jf.findUnique({
        where: { id_leccion_jf },
        include: {
          bloque_jf: true,
        },
      });
      return leccion;
    });
  }

  // ─── PROGRESO DE LECCIÓN ───────────────────────────────────────

  async registrarProgresoLeccion(id_leccion_jf: number, usuarioId: number, completada: boolean, porcentajeVisto?: number) {
    const leccion = await this.prisma.td_lecciones_jf.findUnique({
      where: { id_leccion_jf },
      include: { bloque_jf: true },
    });
    if (!leccion) throw new NotFoundException('Lección no encontrada');

    const inscripcion = await this.prisma.td_inscripcion_ahbb.findFirst({
      where: {
        id_curso_inscripcion_ahbb: leccion.bloque_jf.id_curso_bloque_jf,
        id_usuario_inscripcion_ahbb: usuarioId,
        estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
      },
    });
    if (!inscripcion) throw new ForbiddenException('No estás inscrito en este curso.');

    return this.ejecutarConRLS(usuarioId, async (tx) => {
      return tx.td_progreso_lecciones_jf.upsert({
        where: {
          id_inscripcion_progreso_jf_id_leccion_progreso_jf: {
            id_inscripcion_progreso_jf: inscripcion.id_inscripcion_ahbb,
            id_leccion_progreso_jf: id_leccion_jf,
          },
        },
        update: {
          completada_jf: completada,
          porcentajeVisto_jf: porcentajeVisto ?? undefined,
          actualizadoEn_jf: new Date(),
        },
        create: {
          id_inscripcion_progreso_jf: inscripcion.id_inscripcion_ahbb,
          id_leccion_progreso_jf: id_leccion_jf,
          id_usuario_alumno_jf: usuarioId,
          completada_jf: completada,
          porcentajeVisto_jf: porcentajeVisto ?? 0,
        },
      });
    });
  }

  // ─── EVALUACIONES ──────────────────────────────────────────────

  async guardarEvaluacion(usuarioId: number, datos: any) {
    const bloque = await this.prisma.td_bloques_jf.findUnique({
      where: { id_bloque_jf: datos.id_bloque_evaluacion_jf },
    });
    if (!bloque) throw new NotFoundException('Bloque no encontrado');

    await this.verificarPermisoEscrituraCurso(bloque.id_curso_bloque_jf, usuarioId);

    return this.prisma.td_evaluaciones_jf.upsert({
      where: { id_bloque_evaluacion_jf: datos.id_bloque_evaluacion_jf },
      update: {
        titulo_jf: datos.titulo_jf,
        descripcion_jf: datos.descripcion_jf,
        notaMinima_jf: datos.notaMinima_jf,
        intentosMaximos_jf: datos.intentosMaximos_jf ?? 3,
        preguntasJson_jf: datos.preguntasJson_jf,
        actualizadoEn_jf: new Date(),
      },
      create: {
        id_bloque_evaluacion_jf: datos.id_bloque_evaluacion_jf,
        titulo_jf: datos.titulo_jf,
        descripcion_jf: datos.descripcion_jf,
        notaMinima_jf: datos.notaMinima_jf,
        intentosMaximos_jf: datos.intentosMaximos_jf ?? 3,
        preguntasJson_jf: datos.preguntasJson_jf,
      },
    });
  }

  async resolverEvaluacion(id_evaluacion_jf: number, usuarioId: number, respuestasAlumno: any[]) {
    const evaluacion = await this.prisma.td_evaluaciones_jf.findUnique({
      where: { id_evaluacion_jf },
      include: { bloque_jf: true },
    });
    if (!evaluacion) throw new NotFoundException('Evaluación no encontrada');

    const inscripcion = await this.prisma.td_inscripcion_ahbb.findFirst({
      where: {
        id_curso_inscripcion_ahbb: evaluacion.bloque_jf.id_curso_bloque_jf,
        id_usuario_inscripcion_ahbb: usuarioId,
        estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
      },
    });
    if (!inscripcion) throw new ForbiddenException('No estás inscrito en este curso.');

    // Validar intentos anteriores
    const intentosHechos = await this.prisma.td_intento_evaluacion_jf.count({
      where: {
        id_evaluacion_intento_jf: id_evaluacion_jf,
        id_inscripcion_intento_jf: inscripcion.id_inscripcion_ahbb,
      },
    });

    if (intentosHechos >= evaluacion.intentosMaximos_jf) {
      throw new BadRequestException(`Has alcanzado el límite máximo de ${evaluacion.intentosMaximos_jf} intentos para esta evaluación.`);
    }

    // Corregir evaluación
    const preguntas = evaluacion.preguntasJson_jf as any[];
    let aciertos = 0;

    preguntas.forEach((pregunta, index) => {
      // El alumno envía un array de respuestas, ej. [0, 2, 1] correspondientes a las opciones elegidas
      const respuestaUsuario = respuestasAlumno[index];
      if (respuestaUsuario !== undefined && respuestaUsuario === pregunta.respuestaCorrecta) {
        aciertos++;
      }
    });

    const totalPreguntas = preguntas.length;
    // Nota escalada sobre 20 (standard en la academia)
    const notaObtenida = totalPreguntas > 0 ? (aciertos / totalPreguntas) * 20 : 0;
    const aprobado = notaObtenida >= Number(evaluacion.notaMinima_jf);

    // Guardar intento
    const intento = await this.prisma.td_intento_evaluacion_jf.create({
      data: {
        id_evaluacion_intento_jf: id_evaluacion_jf,
        id_inscripcion_intento_jf: inscripcion.id_inscripcion_ahbb,
        id_usuario_alumno_jf: usuarioId,
        notaObtenida_jf: notaObtenida,
        aprobado_jf: aprobado,
        respuestasAlumnoJson_jf: respuestasAlumno,
      },
    });

    return {
      intentoId: intento.id_intento_jf,
      notaObtenida,
      aprobado,
      aciertos,
      totalPreguntas,
      intentosRestantes: evaluacion.intentosMaximos_jf - (intentosHechos + 1),
    };
  }

  // ─── VIDEOLLAMADAS (JITSI MEET) ───────────────────────────────

  async obtenerSalasCurso(cursoId: number, usuarioId: number, rol: string) {
    // Validar acceso
    if (rol === 'ALUMNO') {
      const inscrito = await this.prisma.td_inscripcion_ahbb.findFirst({
        where: {
          id_curso_inscripcion_ahbb: cursoId,
          id_usuario_inscripcion_ahbb: usuarioId,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
        },
      });
      if (!inscrito) throw new ForbiddenException('No estás inscrito en este curso.');
    } else if (rol === 'PROFESOR') {
      const curso = await this.prisma.td_curso_ahbb.findUnique({
        where: { id_curso_ahbb: cursoId },
      });
      if (!curso || curso.id_usuario_curso_ahbb !== usuarioId) {
        throw new ForbiddenException('No eres el profesor de este curso.');
      }
    }

    return this.prisma.td_salas_videollamadas_jf.findMany({
      where: { id_curso_sala_jf: cursoId },
      orderBy: { fechaProgramada_jf: 'desc' },
    });
  }

  async crearSalaVideollamada(usuarioId: number, datos: any) {
    await this.verificarPermisoEscrituraCurso(datos.id_curso_sala_jf, usuarioId);

    // Generar un nombre de sala único e impredecible (Jitsi)
    // Combinamos salt, timestamp, id de curso
    const randomSalt = Math.floor(Math.random() * 1000000);
    const nombreSala_jf = `AcademiaHB_Curso${datos.id_curso_sala_jf}_Sala_${Date.now()}_${randomSalt}`;

    return this.prisma.td_salas_videollamadas_jf.create({
      data: {
        id_curso_sala_jf: datos.id_curso_sala_jf,
        id_usuario_creador_jf: usuarioId,
        nombreSala_jf,
        titulo_jf: datos.titulo_jf,
        fechaProgramada_jf: new Date(datos.fechaProgramada_jf),
        estado_jf: 'PROGRAMADA',
      },
    });
  }

  async actualizarEstadoSala(salaId: number, usuarioId: number, estado: string) {
    const sala = await this.prisma.td_salas_videollamadas_jf.findUnique({
      where: { id_sala_jf: salaId },
    });
    if (!sala) throw new NotFoundException('Sala de videollamada no encontrada');

    await this.verificarPermisoEscrituraCurso(sala.id_curso_sala_jf, usuarioId);

    const actualizacion: any = { estado_jf: estado };

    if (estado === 'EN_VIVO') {
      actualizacion.fechaInicioReal_jf = new Date();
    } else if (estado === 'FINALIZADA') {
      const fechaFin = new Date();
      actualizacion.fechaFinReal_jf = fechaFin;
      
      const inicio = sala.fechaInicioReal_jf || new Date();
      const duracionSegundos = Math.round((fechaFin.getTime() - inicio.getTime()) / 1000);
      actualizacion.duracionSegundos_jf = duracionSegundos;
    }

    return this.prisma.td_salas_videollamadas_jf.update({
      where: { id_sala_jf: salaId },
      data: actualizacion,
    });
  }

  async accederASala(salaId: number, usuarioId: number, rol: string) {
    const sala = await this.prisma.td_salas_videollamadas_jf.findUnique({
      where: { id_sala_jf: salaId },
      include: {
        curso_jf: true,
      },
    });
    if (!sala) throw new NotFoundException('Sala no encontrada');

    // Validar pertenencia del alumno o docente
    if (rol === 'ALUMNO') {
      const inscrito = await this.prisma.td_inscripcion_ahbb.findFirst({
        where: {
          id_curso_inscripcion_ahbb: sala.id_curso_sala_jf,
          id_usuario_inscripcion_ahbb: usuarioId,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
        },
      });
      if (!inscrito) throw new ForbiddenException('No estás inscrito en este curso.');
      if (sala.estado_jf !== 'EN_VIVO') {
        throw new BadRequestException('La sala de videollamada aún no se encuentra activa (EN_VIVO).');
      }
    } else if (rol === 'PROFESOR') {
      if (sala.curso_jf.id_usuario_curso_ahbb !== usuarioId) {
        throw new ForbiddenException('No eres el profesor asignado a esta videollamada.');
      }
    }

    const usuario = await this.prisma.td_usuario_ahbb.findUnique({
      where: { id_usuario_ahbb: usuarioId },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Devolver credenciales y nombre de sala Jitsi Meet
    return {
      nombreSala: sala.nombreSala_jf,
      titulo: sala.titulo_jf,
      estado: sala.estado_jf,
      usuario: {
        id: usuarioId,
        nombreCompleto: `${usuario.nombre_ahbb} ${usuario.apellido_ahbb}`,
        correo: usuario.correo_ahbb,
        esModerador: rol === 'PROFESOR' || rol === 'ADMIN',
      },
    };
  }

  // ─── HELPERS PRIVADOS ──────────────────────────────────────────

  private async verificarPermisoEscrituraCurso(cursoId: number, usuarioId: number) {
    // Admins pueden editar siempre
    const usuario = await this.prisma.td_usuario_ahbb.findUnique({
      where: { id_usuario_ahbb: usuarioId },
    });
    if (usuario?.rol_ahbb === 'ADMIN') return;

    // Profesores solo si el curso les pertenece
    const curso = await this.prisma.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb: cursoId },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    if (curso.id_usuario_curso_ahbb !== usuarioId) {
      throw new ForbiddenException('No tienes permisos de edición sobre este curso.');
    }
  }
}
