import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CrearCursoDto_ahbb } from './dto/crear-curso.dto_ahbb';

@Injectable()
export class CursosService {
  constructor(private readonly prisma_ahbb: PrismaService) {}

  private readonly DIAS_SEMANA_AHBB = [
    'DOMINGO',
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
  ];

  private normalizarDiaSemana_ahbb(diaSemana_ahbb: string) {
    return String(diaSemana_ahbb ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private convertirFechaSoloDia_ahbb(fecha_ahbb: Date | string) {
    const base_ahbb =
      fecha_ahbb instanceof Date ? new Date(fecha_ahbb) : new Date(`${fecha_ahbb}T12:00:00`);

    return new Date(
      base_ahbb.getFullYear(),
      base_ahbb.getMonth(),
      base_ahbb.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  private obtenerNombreDiaFecha_ahbb(fecha_ahbb: Date) {
    return this.DIAS_SEMANA_AHBB[fecha_ahbb.getDay()];
  }

  private formatearFechaISO_ahbb(fecha_ahbb: Date): string {
    // Normalización de fechas UTC para consistencia
    // Usamos los métodos UTC para asegurar consistencia independientemente de la zona horaria del servidor
    const anio = fecha_ahbb.getUTCFullYear();
    const mes = String(fecha_ahbb.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha_ahbb.getUTCDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private calcularHorasDisponiblesHorario_ahbb(
    horaInicio_ahbb: string,
    horaFin_ahbb: string,
  ) {
    const [ih_ahbb, im_ahbb] = horaInicio_ahbb.split(':').map(Number);
    const [fh_ahbb, fm_ahbb] = horaFin_ahbb.split(':').map(Number);

    const inicioDecimal_ahbb = ih_ahbb + im_ahbb / 60;
    let finDecimal_ahbb = fh_ahbb + fm_ahbb / 60;

    if (horaFin_ahbb === '00:00' || horaFin_ahbb === '00:00:00') {
      finDecimal_ahbb = 24;
    } else if (finDecimal_ahbb <= inicioDecimal_ahbb) {
      finDecimal_ahbb += 24;
    }

    return finDecimal_ahbb - inicioDecimal_ahbb;
  }

  private obtenerHorasProgramablesHorario_ahbb(
    horaInicio_ahbb: string,
    horaFin_ahbb: string,
  ) {
    return Math.min(
      3,
      Math.max(0, this.calcularHorasDisponiblesHorario_ahbb(horaInicio_ahbb, horaFin_ahbb)),
    );
  }

  private validarHorariosCurso_ahbb(horarios_ahbb: any[]) {
    if (!Array.isArray(horarios_ahbb) || horarios_ahbb.length === 0) {
      throw new BadRequestException(
        'Debes configurar al menos un horario para poder programar el curso.',
      );
    }

    const horasPorDia_ahbb = new Map<string, number>();

    for (const horario_ahbb of horarios_ahbb) {
      const diaSemana_ahbb = this.normalizarDiaSemana_ahbb(
        horario_ahbb.diaSemana_ahbb,
      );
      const horasProgramables_ahbb = this.obtenerHorasProgramablesHorario_ahbb(
        horario_ahbb.horaInicio_ahbb,
        horario_ahbb.horaFin_ahbb,
      );

      if (!this.DIAS_SEMANA_AHBB.includes(diaSemana_ahbb)) {
        throw new BadRequestException(
          'Uno de los dias configurados para el curso no es valido.',
        );
      }

      if (horasProgramables_ahbb <= 0) {
        throw new BadRequestException(
          'Cada horario del curso debe tener una duracion valida mayor a cero.',
        );
      }

      const acumuladasDia_ahbb = horasPorDia_ahbb.get(diaSemana_ahbb) ?? 0;
      horasPorDia_ahbb.set(diaSemana_ahbb, acumuladasDia_ahbb + horasProgramables_ahbb);
    }

    const superaTopeDiario_ahbb = [...horasPorDia_ahbb.values()].some(
      (horasDia_ahbb) => horasDia_ahbb > 3,
    );
    if (superaTopeDiario_ahbb) {
      throw new BadRequestException(
        'Un curso no puede exceder 3 horas academicas programadas en un mismo dia.',
      );
    }
  }

  private validarFechaInicioConHorarios_ahbb(
    fechaInicio_ahbb: Date,
    horarios_ahbb: any[],
  ) {
    const diaInicio_ahbb = this.obtenerNombreDiaFecha_ahbb(fechaInicio_ahbb);
    const coincideDia_ahbb = horarios_ahbb.some(
      (horario_ahbb) =>
        this.normalizarDiaSemana_ahbb(horario_ahbb.diaSemana_ahbb) === diaInicio_ahbb,
    );

    if (!coincideDia_ahbb) {
      throw new BadRequestException(
        'La fecha de inicio del curso debe coincidir con uno de los dias configurados en el horario.',
      );
    }
  }

  private simularProgramacionCurso_ahbb(
    fechaInicio_ahbb: Date,
    horarios_ahbb: any[],
    totalHoras_ahbb: number,
  ) {
    this.validarHorariosCurso_ahbb(horarios_ahbb);
    this.validarFechaInicioConHorarios_ahbb(fechaInicio_ahbb, horarios_ahbb);

    if (!Number.isFinite(totalHoras_ahbb) || totalHoras_ahbb <= 0) {
      throw new BadRequestException(
        'La duracion total del curso debe ser mayor a cero.',
      );
    }

    const horariosNormalizados_ahbb = horarios_ahbb
      .map((horario_ahbb) => ({
        diaSemana_ahbb: this.normalizarDiaSemana_ahbb(horario_ahbb.diaSemana_ahbb),
        horasProgramables_ahbb: this.obtenerHorasProgramablesHorario_ahbb(
          horario_ahbb.horaInicio_ahbb,
          horario_ahbb.horaFin_ahbb,
        ),
      }))
      .sort(
        (a_ahbb, b_ahbb) =>
          this.DIAS_SEMANA_AHBB.indexOf(a_ahbb.diaSemana_ahbb) -
          this.DIAS_SEMANA_AHBB.indexOf(b_ahbb.diaSemana_ahbb),
      );

    let horasAcumuladas_ahbb = 0;
    let cantidadSesiones_ahbb = 0;
    let fechaUltimaSesion_ahbb: Date | null = null;
    let iteraciones_ahbb = 0;
    const fechaCursor_ahbb = this.convertirFechaSoloDia_ahbb(fechaInicio_ahbb);

    while (horasAcumuladas_ahbb < totalHoras_ahbb && iteraciones_ahbb < 2000) {
      iteraciones_ahbb += 1;
      const nombreDia_ahbb = this.obtenerNombreDiaFecha_ahbb(fechaCursor_ahbb);
      const horariosDia_ahbb = horariosNormalizados_ahbb.filter(
        (horario_ahbb) => horario_ahbb.diaSemana_ahbb === nombreDia_ahbb,
      );

      for (const horarioDia_ahbb of horariosDia_ahbb) {
        const horasRestantes_ahbb = totalHoras_ahbb - horasAcumuladas_ahbb;
        const horasSesion_ahbb = Math.min(
          horarioDia_ahbb.horasProgramables_ahbb,
          horasRestantes_ahbb,
        );

        if (horasSesion_ahbb <= 0) {
          continue;
        }

        cantidadSesiones_ahbb += 1;
        fechaUltimaSesion_ahbb = new Date(fechaCursor_ahbb);
        horasAcumuladas_ahbb += horasSesion_ahbb;

        if (horasAcumuladas_ahbb >= totalHoras_ahbb) {
          break;
        }
      }

      fechaCursor_ahbb.setDate(fechaCursor_ahbb.getDate() + 1);
    }

    if (!fechaUltimaSesion_ahbb || cantidadSesiones_ahbb === 0) {
      throw new BadRequestException(
        'No se pudo calcular una programacion valida para este curso con la fecha y horarios indicados.',
      );
    }

    return {
      fechaFin_ahbb: fechaUltimaSesion_ahbb,
      diasCalculados_ahbb: cantidadSesiones_ahbb,
    };
  }

  private async construirContextoAgenda_ahbb(
    rolLogueado_ahbb: string,
    idLogueado_ahbb: number,
    rolFiltro_ahbb?: string,
    idUsuarioFiltro_ahbb?: number,
  ) {
    let id_target_ahbb = idLogueado_ahbb;
    let rol_target_ahbb = rolLogueado_ahbb;

    if (idUsuarioFiltro_ahbb && rolFiltro_ahbb) {
      if (rolLogueado_ahbb === 'ADMIN') {
        id_target_ahbb = idUsuarioFiltro_ahbb;
        rol_target_ahbb = rolFiltro_ahbb;
      } else if (rolLogueado_ahbb === 'PROFESOR') {
        if (rolFiltro_ahbb === 'ALUMNO') {
          const estaVinculado_ahbb =
            await this.prisma_ahbb.td_inscripcion_ahbb.findFirst({
              where: {
                id_usuario_inscripcion_ahbb: idUsuarioFiltro_ahbb,
                curso: { id_usuario_curso_ahbb: idLogueado_ahbb },
              },
            });
          if (!estaVinculado_ahbb) {
            return null;
          }
          id_target_ahbb = idUsuarioFiltro_ahbb;
          rol_target_ahbb = 'ALUMNO';
        } else if (idUsuarioFiltro_ahbb === idLogueado_ahbb) {
          id_target_ahbb = idLogueado_ahbb;
          rol_target_ahbb = 'PROFESOR';
        } else {
          return null;
        }
      }
    }

    const rolNormal_ahbb = rol_target_ahbb?.toUpperCase();
    let whereCursos_ahbb: any;

    if (rolNormal_ahbb === 'PROFESOR') {
      whereCursos_ahbb = { id_usuario_curso_ahbb: id_target_ahbb };
    } else if (rolNormal_ahbb === 'ALUMNO') {
      whereCursos_ahbb = {
        inscripciones: {
          some: {
            id_usuario_inscripcion_ahbb: id_target_ahbb,
            estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
          },
        },
      };
    } else {
      whereCursos_ahbb = {};
    }

    return { whereCursos_ahbb };
  }

  /**
   * Recupera la lista de cursos disponibles, aplicando filtros de visibilidad y pertenencia según el rol del usuario.
   * Realiza una sincronización automática de estados de inscripciones al ser consultada.
   */
  async obtenerTodos_ahbb(
    rol_ahbb?: string,
    id_usuario_ahbb?: number,
    soloPropios_ahbb: boolean = false,
    soloInscritos_ahbb: boolean = false,
  ) {
    let whereClause: any = {
      isPublished_ahbb: true,
      imagenBloqueada_ahbb: { not: true },
    };

    const rolNormal_ahbb = rol_ahbb?.toUpperCase();

    if (rolNormal_ahbb === 'ADMIN') {
      whereClause = {};
      if (soloPropios_ahbb && id_usuario_ahbb) {
        whereClause = { id_usuario_curso_ahbb: id_usuario_ahbb };
      }
    } else if (rolNormal_ahbb === 'PROFESOR' && id_usuario_ahbb) {
      if (soloPropios_ahbb) {
        whereClause = { id_usuario_curso_ahbb: id_usuario_ahbb };
      } else {
        whereClause = {
          OR: [
            { id_usuario_curso_ahbb: id_usuario_ahbb },
            { isPublished_ahbb: true, imagenBloqueada_ahbb: { not: true } },
          ],
        };
      }
    } else if (rolNormal_ahbb === 'ALUMNO' && id_usuario_ahbb) {
      if (soloInscritos_ahbb) {
        whereClause = {
          inscripciones: {
            some: {
              id_usuario_inscripcion_ahbb: id_usuario_ahbb,
              estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
            },
          },
        };
      }
    }

    const cursos_ahbb = await this.prisma_ahbb.td_curso_ahbb.findMany({
      where: whereClause,
      include: {
        profesor: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
        horarios: true,
        prelacion: {
          select: { id_curso_ahbb: true, nombre_ahbb: true },
        },
        inscripciones: {
          where: {
            estatus_ahbb: {
              in: ['INSCRITO', 'OYENTE', 'APROBADO'],
            },
          },
        },
      },
      orderBy: { creadoEn_ahbb: 'desc' },
    });

    // Sincronizar estados de inscripciones para cursos que ya iniciaron hoy
    await this.sincronizarEstadosInscritos_ahbb();

    return cursos_ahbb.map((curso_ahbb) => this.mapearCurso_ahbb(curso_ahbb));
  }

  /**
   * Obtiene el detalle completo de un curso y sus dependencias (profesor, horarios, prelaciones).
   */
  async obtenerPorId_ahbb(id_curso_ahbb: number) {
    const curso_ahbb = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb },
      include: {
        profesor: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
        horarios: true,
        prelacion: {
          select: { id_curso_ahbb: true, nombre_ahbb: true },
        },
        inscripciones: true,
      },
    });

    if (!curso_ahbb) {
      throw new NotFoundException('Curso no encontrado.');
    }

    return this.mapearCurso_ahbb(curso_ahbb);
  }

  /**
   * Validates that fechaInicio is between 3 days and 1 month from now.
   * Relaxed for ADMINs to allow historical data entry.
   */
  private validarFechaInicio_ahbb(fechaInicio_ahbb: Date, rol_ahbb?: string) {
    if (rol_ahbb === 'ADMIN') return; // Admin can set any date

    const ahora_ahbb = new Date();
    const minFecha_ahbb = new Date(ahora_ahbb.getTime() + 3 * 24 * 60 * 60 * 1000);
    const maxFecha_ahbb = new Date(ahora_ahbb.getTime() + 31 * 24 * 60 * 60 * 1000);

    if (fechaInicio_ahbb < minFecha_ahbb) {
      throw new BadRequestException(
        'La fecha de inicio debe ser al menos 3 días a partir de hoy, para dar tiempo a los alumnos de inscribirse.',
      );
    }
    if (fechaInicio_ahbb > maxFecha_ahbb) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor a 1 mes desde la fecha actual.',
      );
    }
  }

  /**
   * Gestiona la creación de un nuevo curso, validando solapamientos de horarios y fechas de inicio.
   * Genera de forma atómica el registro del curso, sus horarios y sesiones programadas.
   */
  async crearCurso_ahbb(
    id_usuario_logueado: number,
    datos_ahbb: CrearCursoDto_ahbb & { id_usuario_curso_ahbb?: number },
    rol_ahbb?: string,
  ) {
    const id_profesor_ahbb =
      rol_ahbb === 'ADMIN' && datos_ahbb.id_usuario_curso_ahbb
        ? Number(datos_ahbb.id_usuario_curso_ahbb)
        : id_usuario_logueado;

    const fechaInicio_ahbb = datos_ahbb.fechaInicio_ahbb
      ? this.convertirFechaSoloDia_ahbb(datos_ahbb.fechaInicio_ahbb)
      : this.convertirFechaSoloDia_ahbb(new Date());
    
    this.validarFechaInicio_ahbb(fechaInicio_ahbb, rol_ahbb);
    
    const programacion_ahbb = this.simularProgramacionCurso_ahbb(
      fechaInicio_ahbb,
      datos_ahbb.horarios_ahbb,
      Number(datos_ahbb.horasDefinidas_ahbb),
    );
    const fechaFin_ahbb = programacion_ahbb.fechaFin_ahbb;
    const diasCalculados = programacion_ahbb.diasCalculados_ahbb;

    await this.validarSolapamientoProfesor_ahbb(
      id_profesor_ahbb,
      datos_ahbb.horarios_ahbb,
      fechaInicio_ahbb,
      fechaFin_ahbb,
    );

    const estadoAprobacion = rol_ahbb === 'ADMIN' ? 'ACTIVO' : 'PENDIENTE';
    const isPublished = rol_ahbb === 'ADMIN';

    const curso_ahbb = await this.prisma_ahbb.td_curso_ahbb.create({
      data: {
        nombre_ahbb: datos_ahbb.nombre_ahbb,
        tematica_ahbb: datos_ahbb.tematica_ahbb,
        descripcion_ahbb: datos_ahbb.descripcion_ahbb ?? null,
        temarioTexto_ahbb: datos_ahbb.temarioTexto_ahbb ?? null,
        fechaInicio_ahbb,
        fechaFin_ahbb,
        fechaDuracion_ahbb: fechaFin_ahbb,
        horasDefinidas_ahbb: Number(datos_ahbb.horasDefinidas_ahbb),
        diasDefinidos_ahbb: diasCalculados,
        topeEstudiantes_ahbb: Number(datos_ahbb.topeEstudiantes_ahbb ?? 5),
        isPublished_ahbb: isPublished,
        estadoAprobacion_ahbb: estadoAprobacion,
        id_usuario_curso_ahbb: id_profesor_ahbb,
        id_curso_curso_ahbb: datos_ahbb.id_curso_curso_ahbb ?? null,
        horarios: {
          create: datos_ahbb.horarios_ahbb.map((horario_ahbb) => ({
            diaSemana_ahbb: horario_ahbb.diaSemana_ahbb.toUpperCase(),
            horaInicio_ahbb: horario_ahbb.horaInicio_ahbb,
            horaFin_ahbb: horario_ahbb.horaFin_ahbb,
          })),
        },
      },
      include: {
        profesor: {
          select: { nombre_ahbb: true, apellido_ahbb: true },
        },
        horarios: true,
        prelacion: {
          select: { id_curso_ahbb: true, nombre_ahbb: true },
        },
        inscripciones: true,
      },
    });

    // Generar sesiones individuales vía Stored Procedure
    const diasArray_ahbb = datos_ahbb.horarios_ahbb.map(h => h.diaSemana_ahbb.toUpperCase());
    const iniciosArray_ahbb = datos_ahbb.horarios_ahbb.map(h => h.horaInicio_ahbb);
    const finesArray_ahbb = datos_ahbb.horarios_ahbb.map(h => h.horaFin_ahbb);

    await this.prisma_ahbb.$queryRaw`SELECT fn_generar_sesiones_curso_ahbb(
      ${curso_ahbb.id_curso_ahbb}::INT,
      ${fechaInicio_ahbb.toISOString().split('T')[0]}::DATE,
      ${diasArray_ahbb}::TEXT[],
      ${iniciosArray_ahbb}::TEXT[],
      ${finesArray_ahbb}::TEXT[],
      ${Number(datos_ahbb.horasDefinidas_ahbb)}::NUMERIC
    )`;

    return this.mapearCurso_ahbb(curso_ahbb);
  }

  /**
   * Actualiza la información de un curso existente garantizando la integridad de las inscripciones actuales.
   * Regenera la programación de sesiones si hay cambios detectados en las fechas o el horario.
   */
  async actualizarCurso_ahbb(
    id_curso_ahbb: number,
    id_usuario_logueado: number,
    datos_ahbb: CrearCursoDto_ahbb & { id_usuario_curso_ahbb?: number },
    rol_ahbb?: string,
  ) {
    const id_profesor_ahbb =
      rol_ahbb === 'ADMIN' && datos_ahbb.id_usuario_curso_ahbb
        ? Number(datos_ahbb.id_usuario_curso_ahbb)
        : id_usuario_logueado;

    const cursoExistente_ahbb = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb },
      include: { horarios: true },
    });
    if (!cursoExistente_ahbb) {
      throw new NotFoundException('Curso no encontrado.');
    }

    const fechaInicio_ahbb = datos_ahbb.fechaInicio_ahbb
      ? this.convertirFechaSoloDia_ahbb(datos_ahbb.fechaInicio_ahbb)
      : this.convertirFechaSoloDia_ahbb(cursoExistente_ahbb.fechaInicio_ahbb ?? new Date());

    if (datos_ahbb.fechaInicio_ahbb) {
      const nuevaFecha_str = this.convertirFechaSoloDia_ahbb(
        datos_ahbb.fechaInicio_ahbb,
      ).toISOString().split('T')[0];
      const fechaAnterior_str = cursoExistente_ahbb.fechaInicio_ahbb?.toISOString().split('T')[0];
      if (nuevaFecha_str !== fechaAnterior_str) {
        this.validarFechaInicio_ahbb(fechaInicio_ahbb, rol_ahbb);
      }
    }

    const horariosProgramacion_ahbb =
      datos_ahbb.horarios_ahbb && datos_ahbb.horarios_ahbb.length > 0
        ? datos_ahbb.horarios_ahbb
        : cursoExistente_ahbb.horarios;
    const programacion_ahbb = this.simularProgramacionCurso_ahbb(
      fechaInicio_ahbb,
      horariosProgramacion_ahbb,
      Number(datos_ahbb.horasDefinidas_ahbb ?? cursoExistente_ahbb.horasDefinidas_ahbb),
    );
    const fechaFin_ahbb = programacion_ahbb.fechaFin_ahbb;

    await this.validarSolapamientoProfesor_ahbb(
      id_profesor_ahbb,
      horariosProgramacion_ahbb,
      fechaInicio_ahbb,
      fechaFin_ahbb,
      id_curso_ahbb, // Excluir este curso de la validación de solapamiento
    );

    // Validación de restricción de cambio de fecha con inscritos
    if (datos_ahbb.fechaInicio_ahbb) {
      const nuevaFecha_str = this.convertirFechaSoloDia_ahbb(
        datos_ahbb.fechaInicio_ahbb,
      ).toISOString().split('T')[0];
      const fechaAnterior_str = cursoExistente_ahbb.fechaInicio_ahbb?.toISOString().split('T')[0];
      
      if (nuevaFecha_str !== fechaAnterior_str) {
        const inscritosCount_ahbb = await this.prisma_ahbb.td_inscripcion_ahbb.count({
          where: {
            id_curso_inscripcion_ahbb: id_curso_ahbb,
            estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
          },
        });
        if (inscritosCount_ahbb > 0) {
          throw new BadRequestException(
            'No se puede cambiar la fecha de inicio del curso porque ya posee alumnos inscritos activos.',
          );
        }
      }
    }

    const diasCalculados = programacion_ahbb.diasCalculados_ahbb;

    const cursoActualizado_ahbb = await this.prisma_ahbb.$transaction(
      async (tx_ahbb) => {
        await tx_ahbb.td_horario_ahbb.deleteMany({
          where: { id_curso_horario_ahbb: id_curso_ahbb },
        });

        // Reinicio de flujo de aprobación ante cambios del profesor
        const esProfesorActualizando_ahbb = rol_ahbb === 'PROFESOR';
        const nuevoEstadoAprobacion_ahbb = esProfesorActualizando_ahbb ? 'PENDIENTE' : undefined;
        const nuevoIsPublished_ahbb = esProfesorActualizando_ahbb ? false : undefined;

        return tx_ahbb.td_curso_ahbb.update({
          where: { id_curso_ahbb },
          data: {
            nombre_ahbb: datos_ahbb.nombre_ahbb,
            tematica_ahbb: datos_ahbb.tematica_ahbb,
            descripcion_ahbb: datos_ahbb.descripcion_ahbb ?? null,
            temarioTexto_ahbb: datos_ahbb.temarioTexto_ahbb ?? null,
            fechaInicio_ahbb,
            fechaFin_ahbb,
            fechaDuracion_ahbb: fechaFin_ahbb,
            horasDefinidas_ahbb: Number(datos_ahbb.horasDefinidas_ahbb),
            diasDefinidos_ahbb: diasCalculados,
            topeEstudiantes_ahbb: Number(datos_ahbb.topeEstudiantes_ahbb ?? 5),
            id_usuario_curso_ahbb: id_profesor_ahbb,
            id_curso_curso_ahbb: datos_ahbb.id_curso_curso_ahbb ?? null,
            ...(nuevoEstadoAprobacion_ahbb && { estadoAprobacion_ahbb: nuevoEstadoAprobacion_ahbb }),
            ...(nuevoIsPublished_ahbb !== undefined && { isPublished_ahbb: nuevoIsPublished_ahbb }),
            ...(esProfesorActualizando_ahbb && datos_ahbb.mensajeCorreccion_ahbb && {
              mensajeCorreccion_ahbb: datos_ahbb.mensajeCorreccion_ahbb,
              motivoRechazo_ahbb: null, // clear previous rejection reason on resubmit
            }),
            horarios: {
              create: horariosProgramacion_ahbb.map((horario_ahbb) => ({
                diaSemana_ahbb: horario_ahbb.diaSemana_ahbb.toUpperCase(),
                horaInicio_ahbb: horario_ahbb.horaInicio_ahbb,
                horaFin_ahbb: horario_ahbb.horaFin_ahbb,
              })),
            },
          },
          include: {
            profesor: {
              select: { nombre_ahbb: true, apellido_ahbb: true },
            },
            horarios: true,
            prelacion: {
              select: { id_curso_ahbb: true, nombre_ahbb: true },
            },
            inscripciones: true,
          },
        });
      },
    );

    // Regenerar sesiones individuales vía Stored Procedure
    const diasArray_ahbb = horariosProgramacion_ahbb.map((h) =>
      h.diaSemana_ahbb.toUpperCase(),
    );
    const iniciosArray_ahbb = horariosProgramacion_ahbb.map((h) => h.horaInicio_ahbb);
    const finesArray_ahbb = horariosProgramacion_ahbb.map((h) => h.horaFin_ahbb);

    await this.prisma_ahbb.$queryRaw`SELECT fn_generar_sesiones_curso_ahbb(
      ${id_curso_ahbb}::INT,
      ${fechaInicio_ahbb.toISOString().split('T')[0]}::DATE,
      ${diasArray_ahbb}::TEXT[],
      ${iniciosArray_ahbb}::TEXT[],
      ${finesArray_ahbb}::TEXT[],
      ${Number(datos_ahbb.horasDefinidas_ahbb ?? cursoExistente_ahbb.horasDefinidas_ahbb)}::NUMERIC
    )`;

    return this.mapearCurso_ahbb(cursoActualizado_ahbb);
  }

  /**
   * Actualizar solo la imagen de fondo del certificado para un curso.
   * No afecta el estado de aprobación del curso.
   */
  async actualizarImagenCertificadoCurso_ahbb(
    id_curso_ahbb: number,
    imagenBase64_ahbb: string | null,
    id_usuario_ahbb: number,
    rol_ahbb: string,
  ) {
    const curso_ahbb = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb },
    });

    if (!curso_ahbb) {
      throw new NotFoundException('Curso no encontrado.');
    }

    // Profesor solo puede modificar sus propios cursos
    if (
      rol_ahbb === 'PROFESOR' &&
      curso_ahbb.id_usuario_curso_ahbb !== id_usuario_ahbb
    ) {
      throw new BadRequestException(
        'No puedes modificar la imagen de un curso que no te pertenece.',
      );
    }

    await this.prisma_ahbb.td_curso_ahbb.update({
      where: { id_curso_ahbb },
      data: { imagenBasePdf_ahbb: imagenBase64_ahbb },
    });

    return {
      exito: true,
      mensaje: imagenBase64_ahbb
        ? 'Imagen de fondo del certificado actualizada.'
        : 'Imagen de fondo del certificado eliminada.',
    };
  }

  /**
   * Gestiona la eliminación de un curso favoreciendo el archivado (soft-delete) si existen dependencias.
   */
  async eliminarCurso_ahbb(id_curso_ahbb: number) {
    const inscripciones = await this.prisma_ahbb.td_inscripcion_ahbb.count({
      where: { id_curso_inscripcion_ahbb: id_curso_ahbb },
    });

    if (inscripciones > 0) {
      // Eliminación lógica para preservar integridad referencial
      await this.prisma_ahbb.td_curso_ahbb.update({
        where: { id_curso_ahbb },
        data: {
          isPublished_ahbb: false,
          imagenBloqueada_ahbb: true, // Opcional, pero marca visualmente o logicamente otra cosa si se desea
        },
      });
      return {
        exito: true,
        softDeleted: true,
        mensaje:
          'Curso archivado y retirado de la oferta por tener alumnos inscritos.',
      };
    }

    // Eliminación física del registro
    await this.prisma_ahbb.td_curso_ahbb.delete({
      where: { id_curso_ahbb },
    });

    return {
      exito: true,
      softDeleted: false,
      mensaje: 'Curso eliminado permanentemente.',
    };
  }

  /**
   * Permite a la administración evaluar (aprobar o rechazar) un curso propuesto por un profesor.
   */
  async evaluarCurso_ahbb(
    id_curso_ahbb: number,
    data: { estado: string; motivo?: string },
  ) {
    const cursoExistente = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb },
    });

    if (!cursoExistente) {
      throw new NotFoundException('Curso no encontrado');
    }

    const { estado, motivo } = data;

    await this.prisma_ahbb.td_curso_ahbb.update({
      where: { id_curso_ahbb },
      data: {
        estadoAprobacion_ahbb: estado,
        motivoRechazo_ahbb: motivo || null,
        isPublished_ahbb: estado === 'ACTIVO',
      },
    });

    return {
      exito: true,
      mensaje: `Curso ${estado === 'ACTIVO' ? 'aprobado' : 'rechazado'} exitosamente.`,
    };
  }

  /**
   * Calcula la disponibilidad de cupos y el estado de matrícula de un curso específico.
   */
  async obtenerDisponibilidad_ahbb(id_curso_ahbb: number) {
    const curso_ahbb = await this.prisma_ahbb.td_curso_ahbb.findUnique({
      where: { id_curso_ahbb },
      include: {
        inscripciones: {
          where: {
            estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
          },
        },
      },
    });

    if (!curso_ahbb) {
      throw new NotFoundException('Curso no encontrado.');
    }

    const ocupados_ahbb = curso_ahbb.inscripciones.length;
    const capacidad_ahbb = Number(curso_ahbb.topeEstudiantes_ahbb ?? 5);

    return {
      id_curso_ahbb,
      capacidad_ahbb,
      ocupados_ahbb,
      disponible_ahbb: ocupados_ahbb < capacidad_ahbb,
      cuposRestantes_ahbb: Math.max(capacidad_ahbb - ocupados_ahbb, 0),
    };
  }

  async validarSolapamientoProfesor_ahbb(
    id_profesor_ahbb: number,
    horariosNuevos_ahbb: any[],
    fechaInicioNivel_ahbb: Date,
    fechaFinNivel_ahbb: Date,
    id_curso_excluir?: number,
  ) {
    const solapamientos_ahbb = await this.obtenerSolapamientos_ahbb(
      id_profesor_ahbb,
      'PROFESOR',
      horariosNuevos_ahbb,
      fechaInicioNivel_ahbb,
      fechaFinNivel_ahbb,
      id_curso_excluir,
    );

    if (solapamientos_ahbb.length > 0) {
      const huecos_ahbb = await this.obtenerHuecosDisponibles_ahbb(
        id_profesor_ahbb,
        'PROFESOR',
        fechaInicioNivel_ahbb,
        fechaFinNivel_ahbb,
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

  async obtenerSolapamientos_ahbb(
    id_usuario_ahbb: number,
    rol_ahbb: 'PROFESOR' | 'ALUMNO',
    horariosNuevos_ahbb: any[],
    fechaInicio_ahbb: Date,
    fechaFin_ahbb: Date,
    id_curso_excluir?: number,
  ) {
    const solapamientos_ahbb: any[] = [];
    let cursos_ahbb: any[] = [];

    if (rol_ahbb === 'PROFESOR') {
      cursos_ahbb = await this.prisma_ahbb.td_curso_ahbb.findMany({
        where: {
          id_usuario_curso_ahbb: id_usuario_ahbb,
          id_curso_ahbb: id_curso_excluir ? { not: id_curso_excluir } : undefined,
          estadoAprobacion_ahbb: { not: 'ARCHIVADO' },
        },
        include: { horarios: true },
      });
    } else {
      const inscripciones_ahbb = await this.prisma_ahbb.td_inscripcion_ahbb.findMany({
        where: {
          id_usuario_inscripcion_ahbb: id_usuario_ahbb,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE'] },
        },
        include: {
          curso: {
            include: { horarios: true },
          },
        },
      });
      cursos_ahbb = inscripciones_ahbb.map((i) => i.curso);
    }

    for (const cursoExistente_ahbb of cursos_ahbb) {
      const inicioExistente_ahbb = cursoExistente_ahbb.fechaInicio_ahbb ?? new Date();
      const finExistente_ahbb = cursoExistente_ahbb.fechaFin_ahbb ?? new Date();

      const fechasSeCruzan_ahbb =
        inicioExistente_ahbb <= fechaFin_ahbb &&
        fechaInicio_ahbb <= finExistente_ahbb;

      if (!fechasSeCruzan_ahbb) continue;

      for (const horarioExistente_ahbb of cursoExistente_ahbb.horarios) {
        for (const horarioNuevo_ahbb of horariosNuevos_ahbb) {
          const mismoDia_ahbb =
            horarioExistente_ahbb.diaSemana_ahbb ===
            horarioNuevo_ahbb.diaSemana_ahbb.toUpperCase();

          if (
            mismoDia_ahbb &&
            this.hayCruceHoras_ahbb(
              horarioExistente_ahbb.horaInicio_ahbb,
              horarioExistente_ahbb.horaFin_ahbb,
              horarioNuevo_ahbb.horaInicio_ahbb,
              horarioNuevo_ahbb.horaFin_ahbb,
            )
          ) {
            solapamientos_ahbb.push({
              cursoId: cursoExistente_ahbb.id_curso_ahbb,
              cursoNombre: cursoExistente_ahbb.nombre_ahbb,
              dia: horarioExistente_ahbb.diaSemana_ahbb,
              horaInicio: horarioExistente_ahbb.horaInicio_ahbb,
              horaFin: horarioExistente_ahbb.horaFin_ahbb,
            });
          }
        }
      }
    }
    return solapamientos_ahbb;
  }

  async obtenerHuecosDisponibles_ahbb(
    id_usuario_ahbb: number,
    rol_ahbb: 'PROFESOR' | 'ALUMNO',
    fechaInicio_ahbb: Date,
    fechaFin_ahbb: Date,
  ) {
    let cursos_ahbb: any[] = [];
    if (rol_ahbb === 'PROFESOR') {
      cursos_ahbb = await this.prisma_ahbb.td_curso_ahbb.findMany({
        where: {
          id_usuario_curso_ahbb: id_usuario_ahbb,
          estadoAprobacion_ahbb: { not: 'ARCHIVADO' },
        },
        include: { horarios: true },
      });
    } else {
      const inscripciones_ahbb = await this.prisma_ahbb.td_inscripcion_ahbb.findMany({
        where: {
          id_usuario_inscripcion_ahbb: id_usuario_ahbb,
          estatus_ahbb: { in: ['INSCRITO', 'OYENTE'] },
        },
        include: {
          curso: {
            include: { horarios: true },
          },
        },
      });
      cursos_ahbb = inscripciones_ahbb.map((i) => i.curso);
    }

    const huecos_ahbb: any[] = [];
    const franjas_ahbb = [
      { inicio: '07:00', fin: '10:00' },
      { inicio: '10:00', fin: '13:00' },
      { inicio: '13:00', fin: '16:00' },
      { inicio: '16:00', fin: '19:00' },
      { inicio: '19:00', fin: '22:00' },
    ];

    for (const dia_ahbb of this.DIAS_SEMANA_AHBB) {
      if (dia_ahbb === 'DOMINGO') continue; // No clases los domingos por defecto

      for (const franja_ahbb of franjas_ahbb) {
        let ocupado_ahbb = false;

        for (const curso_ahbb of cursos_ahbb) {
          const inicioC = curso_ahbb.fechaInicio_ahbb ?? new Date();
          const finC = curso_ahbb.fechaFin_ahbb ?? new Date();

          if (inicioC <= fechaFin_ahbb && fechaInicio_ahbb <= finC) {
            for (const h_ahbb of curso_ahbb.horarios) {
              if (
                h_ahbb.diaSemana_ahbb === dia_ahbb &&
                this.hayCruceHoras_ahbb(
                  h_ahbb.horaInicio_ahbb,
                  h_ahbb.horaFin_ahbb,
                  franja_ahbb.inicio,
                  franja_ahbb.fin,
                )
              ) {
                ocupado_ahbb = true;
                break;
              }
            }
          }
          if (ocupado_ahbb) break;
        }

        if (!ocupado_ahbb) {
          huecos_ahbb.push({
            dia: dia_ahbb,
            horaInicio: franja_ahbb.inicio,
            horaFin: franja_ahbb.fin,
          });
        }
      }
    }

    return huecos_ahbb.slice(0, 10); // Retornar max 10 sugerencias
  }

  hayCruceHoras_ahbb(
    inicioA_ahbb: string,
    finA_ahbb: string,
    inicioB_ahbb: string,
    finB_ahbb: string,
  ) {
    return inicioA_ahbb < finB_ahbb && inicioB_ahbb < finA_ahbb;
  }

  async obtenerSesiones_ahbb(
    rolLogueado_ahbb: string,
    idLogueado_ahbb: number,
    rolFiltro_ahbb?: string,
    idUsuarioFiltro_ahbb?: number,
    id_curso_ahbb?: number,
  ) {
    const contextoAgenda_ahbb = await this.construirContextoAgenda_ahbb(
      rolLogueado_ahbb,
      idLogueado_ahbb,
      rolFiltro_ahbb,
      idUsuarioFiltro_ahbb,
    );

    if (!contextoAgenda_ahbb) {
      return { sesiones: [], marcadores: [] };
    }

    const whereCursos_ahbb = {
      ...contextoAgenda_ahbb.whereCursos_ahbb,
      ...(id_curso_ahbb ? { id_curso_ahbb } : {}),
    };

    const cursosAgenda_ahbb = await this.prisma_ahbb.td_curso_ahbb.findMany({
      where: whereCursos_ahbb,
      select: {
        id_curso_ahbb: true,
        nombre_ahbb: true,
        fechaInicio_ahbb: true,
        inscripciones: {
          where: {
            estatus_ahbb: { in: ['INSCRITO', 'OYENTE', 'APROBADO'] },
          },
          select: { id_inscripcion_ahbb: true },
        },
      },
    });

    const cursosConfirmadosIds_ahbb = cursosAgenda_ahbb
      .filter((curso_ahbb) => curso_ahbb.inscripciones.length > 0)
      .map((curso_ahbb) => curso_ahbb.id_curso_ahbb);

    const sesiones_ahbb = await this.prisma_ahbb.td_sesion_curso_ahbb.findMany({
      where: {
        ...(cursosConfirmadosIds_ahbb.length > 0
          ? { id_curso_sesion_ahbb: { in: cursosConfirmadosIds_ahbb } }
          : { id_curso_sesion_ahbb: -1 }),
      },
      select: {
        id_sesion_ahbb: true,
        nroSesion_ahbb: true,
        fechaSesion_ahbb: true,
        horaInicio_ahbb: true,
        horaFin_ahbb: true,
        id_curso_sesion_ahbb: true,
        curso: {
          select: {
            nombre_ahbb: true,
          },
        },
      },
      orderBy: { fechaSesion_ahbb: 'asc' },
    });

    const sesionesMapeadas_ahbb = sesiones_ahbb.map((s) => ({
      id: s.id_sesion_ahbb,
      nroClase: s.nroSesion_ahbb,
      fecha: this.formatearFechaISO_ahbb(new Date(s.fechaSesion_ahbb)),
      horaInicio: s.horaInicio_ahbb,
      horaFin: s.horaFin_ahbb,
      cursoNombre: s.curso.nombre_ahbb,
      idCurso: s.id_curso_sesion_ahbb,
    }));

    const hoy_ahbb = this.convertirFechaSoloDia_ahbb(new Date());
    const marcadoresAgenda_ahbb: Array<{
      fecha: string;
      tipo: 'sesion' | 'tentativo';
      cursoNombre: string;
      idCurso: number;
      mensaje?: string;
    }> = [];

    for (const sesion_ahbb of sesionesMapeadas_ahbb) {
      const fechaMarcador_ahbb = this.formatearFechaISO_ahbb(new Date(sesion_ahbb.fecha));
      marcadoresAgenda_ahbb.push({
        fecha: fechaMarcador_ahbb,
        tipo: 'sesion',
        cursoNombre: sesion_ahbb.cursoNombre,
        idCurso: sesion_ahbb.idCurso,
      });
    }

    for (const curso_ahbb of cursosAgenda_ahbb) {
      if (
        curso_ahbb.inscripciones.length > 0 ||
        !curso_ahbb.fechaInicio_ahbb
      ) {
        continue;
      }

      const fechaInicioCurso_ahbb = this.convertirFechaSoloDia_ahbb(
        curso_ahbb.fechaInicio_ahbb,
      );
      if (fechaInicioCurso_ahbb < hoy_ahbb) {
        continue;
      }

      // Para el marcador tentativo usamos getFullYear etc porque convertirFechaSoloDia crea una fecha LOCAL
      const anio = fechaInicioCurso_ahbb.getFullYear();
      const mes = String(fechaInicioCurso_ahbb.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaInicioCurso_ahbb.getDate()).padStart(2, '0');
      const fechaMarcador_ahbb = `${anio}-${mes}-${dia}`;

      marcadoresAgenda_ahbb.push({
        fecha: fechaMarcador_ahbb,
        tipo: 'tentativo',
        cursoNombre: curso_ahbb.nombre_ahbb,
        idCurso: curso_ahbb.id_curso_ahbb,
        mensaje: 'Inicio tentativo sin alumnos inscritos.',
      });
    }

    return {
      sesiones: sesionesMapeadas_ahbb,
      marcadores: marcadoresAgenda_ahbb.sort((a_ahbb, b_ahbb) => {
        const comparacionFecha_ahbb = String(a_ahbb.fecha).localeCompare(
          String(b_ahbb.fecha),
        );
        if (comparacionFecha_ahbb !== 0) {
          return comparacionFecha_ahbb;
        }

        return Number(a_ahbb.idCurso) - Number(b_ahbb.idCurso);
      }),
    };
  }

  mapearCurso_ahbb(curso_ahbb: any) {
    const profesorNombre_ahbb = curso_ahbb.profesor
      ? `${curso_ahbb.profesor.nombre_ahbb} ${curso_ahbb.profesor.apellido_ahbb}`
      : 'Sin asignar';

    return {
      id: curso_ahbb.id_curso_ahbb,
      nombre: curso_ahbb.nombre_ahbb,
      descripcion: curso_ahbb.descripcion_ahbb ?? curso_ahbb.tematica_ahbb,
      profesor: profesorNombre_ahbb,
      profesorId: curso_ahbb.id_usuario_curso_ahbb,
      duracionHoras: curso_ahbb.horasDefinidas_ahbb,
      cantidadDias: curso_ahbb.diasDefinidos_ahbb,
      topeEstudiantes: curso_ahbb.topeEstudiantes_ahbb ?? 5,
      estatus: curso_ahbb.imagenBloqueada_ahbb
        ? 'archivado'
        : curso_ahbb.estadoAprobacion_ahbb === 'PENDIENTE'
          ? 'pendiente'
          : curso_ahbb.estadoAprobacion_ahbb === 'RECHAZADO'
            ? 'rechazado'
            : (curso_ahbb.fechaFin_ahbb && new Date(curso_ahbb.fechaFin_ahbb) < new Date())
              ? 'inactivo'
              : (curso_ahbb.estadoAprobacion_ahbb === 'ACTIVO' &&
                 curso_ahbb.isPublished_ahbb &&
                 curso_ahbb.fechaInicio_ahbb &&
                 new Date(curso_ahbb.fechaInicio_ahbb) <= new Date() &&
                 (curso_ahbb.inscripciones?.length ?? 0) > 0)
                ? 'iniciado'
                : 'activo',
      estadoAprobacion: curso_ahbb.estadoAprobacion_ahbb,
      motivoRechazo: curso_ahbb.motivoRechazo_ahbb,
      mensajeCorreccion: curso_ahbb.mensajeCorreccion_ahbb,
      temario: curso_ahbb.temarioTexto_ahbb,
      fechaInicio: curso_ahbb.fechaInicio_ahbb ? this.formatearFechaISO_ahbb(new Date(curso_ahbb.fechaInicio_ahbb)) : null,
      fechaFin: curso_ahbb.fechaFin_ahbb ? this.formatearFechaISO_ahbb(new Date(curso_ahbb.fechaFin_ahbb)) : null,
      fechaCreacion: curso_ahbb.creadoEn_ahbb,
      estudiantesInscritos: curso_ahbb.inscripciones?.length ?? 0,
      dias:
        curso_ahbb.horarios?.map((horario_ahbb: any) =>
          horario_ahbb.diaSemana_ahbb.toLowerCase(),
        ) ?? [],
      horaInicio: curso_ahbb.horarios?.[0]?.horaInicio_ahbb ?? null,
      horaFin: curso_ahbb.horarios?.[0]?.horaFin_ahbb ?? null,
      horarios: curso_ahbb.horarios ?? [],
      tienePrelacion: Boolean(curso_ahbb.prelacion),
      prelacionCursoId: curso_ahbb.prelacion?.id_curso_ahbb ?? null,
      prelacionNombre: curso_ahbb.prelacion?.nombre_ahbb ?? null,
      isPublished: curso_ahbb.isPublished_ahbb,
      imagenBasePdf: curso_ahbb.imagenBasePdf_ahbb ?? null,
    };
  }

  /**
   * Actualiza alumnos de INSCRITO a OYENTE para cursos que ya empezaron.
   */
  private async sincronizarEstadosInscritos_ahbb() {
    const ahora_ahbb = new Date();
    
    // Cursos iniciados (ACTIVO + fechaInicio <= ahora)
    const cursosIniciadosIds_ahbb = await this.prisma_ahbb.td_curso_ahbb.findMany({
      where: {
        estadoAprobacion_ahbb: 'ACTIVO',
        isPublished_ahbb: true,
        fechaInicio_ahbb: { lte: ahora_ahbb },
      },
      select: { id_curso_ahbb: true },
    }).then(res => res.map(c => c.id_curso_ahbb));

    if (cursosIniciadosIds_ahbb.length > 0) {
      await this.prisma_ahbb.td_inscripcion_ahbb.updateMany({
        where: {
          id_curso_inscripcion_ahbb: { in: cursosIniciadosIds_ahbb },
          estatus_ahbb: 'INSCRITO',
        },
        data: { estatus_ahbb: 'OYENTE' },
      });
    }
  }
}
