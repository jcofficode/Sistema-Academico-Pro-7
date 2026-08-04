import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma.service';
import { RegistrarNotaContingenciaDto_ga } from './dto/contingencia-nota.dto_ga';
import { CrearPlanificacionDto_ga } from './dto/crear-planificacion.dto_ga';

/**
 * Servicio Orientado a Objetos (POO + SOLID) para la Gestión de Planificación Curricular (_ga)
 */
@Injectable()
export class PlanesEstudioService_ga {
  // Inyección de dependencias respetando Inversión de Control (DIP)
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genera Hash SHA-256 para verificación digital de integridad del plan
   */
  private generarHashVerificacion_ga(contenido_ga: string): string {
    return crypto.createHash('sha256').update(contenido_ga).digest('hex');
  }

  /**
   * Valida las reglas de negocio del plan de evaluación
   */
  private validarReglasNegocio_ga(dto_ga: CrearPlanificacionDto_ga): void {
    console.log('[PlanesEstudioService_ga] Validando reglas de negocio para la planificación...');

    // Rule 1: Agrupar actividades por lapso
    const actividadesLapso1_ga = dto_ga.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 1);
    const actividadesLapso2_ga = dto_ga.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 2);

    // Rule 2: Límite máximo 4 evaluaciones por lapso
    if (actividadesLapso1_ga.length > 4) {
      throw new BadRequestException('El Lapso 1 no puede tener más de 4 actividades de evaluación.');
    }
    if (actividadesLapso2_ga.length > 4) {
      throw new BadRequestException('El Lapso 2 no puede tener más de 4 actividades de evaluación.');
    }

    // Rule 3: En formato CUANTITATIVO, la suma debe ser exactamente 100% por lapso
    if (dto_ga.formato_evaluacion_ga === 'CUANTITATIVO') {
      const sumaLapso1_ga = actividadesLapso1_ga.reduce((acc, curr) => acc + Number(curr.porcentaje_ga), 0);
      const sumaLapso2_ga = actividadesLapso2_ga.reduce((acc, curr) => acc + Number(curr.porcentaje_ga), 0);

      if (Math.abs(sumaLapso1_ga - 100) > 0.01) {
        throw new BadRequestException(
          `Las actividades del Lapso 1 deben sumar exactamente 100%. Suma actual: ${sumaLapso1_ga}%`,
        );
      }

      if (Math.abs(sumaLapso2_ga - 100) > 0.01) {
        throw new BadRequestException(
          `Las actividades del Lapso 2 deben sumar exactamente 100%. Suma actual: ${sumaLapso2_ga}%`,
        );
      }
    }
  }

  /**
   * Guarda de forma atómica (con Rollback completo) la planificación completa
   */
  async guardarPlanificacionCompleta_ga(
    idProfesor_ga: number,
    dto_ga: CrearPlanificacionDto_ga,
  ) {
    console.log(`[PlanesEstudioService_ga] Iniciando guardado de planificación para Profesor ID: ${idProfesor_ga}`);

    // Ejecutar validaciones puras
    this.validarReglasNegocio_ga(dto_ga);

    try {
      // Transacción Atómica con Rollback en bloque (ACID)
      return await this.prisma.$transaction(async (tx) => {
        // 1. Crear o actualizar la planificación (Cabecera)
        const codigo_ga = `PLAN-MAT${dto_ga.id_materia_ga}-PER${dto_ga.id_periodo_ga}`;
        const hash_ga = this.generarHashVerificacion_ga(JSON.stringify(dto_ga));

        const planificacion_ga = await tx.td_planificaciones_ga.upsert({
          where: {
            id_materia_ga_id_periodo_ga: {
              id_materia_ga: dto_ga.id_materia_ga,
              id_periodo_ga: dto_ga.id_periodo_ga,
            },
          },
          update: {
            id_profesor_ga: idProfesor_ga,
            programaUrl_ga: dto_ga.programaUrl_ga,
            formato_evaluacion_ga: dto_ga.formato_evaluacion_ga,
            estado_ga: 'ENTREGADO',
            codigo_ga: codigo_ga,
            hashVerificacion_ga: hash_ga,
            actualizadoEn_ga: new Date(),
          },
          create: {
            id_materia_ga: dto_ga.id_materia_ga,
            id_periodo_ga: dto_ga.id_periodo_ga,
            id_profesor_ga: idProfesor_ga,
            programaUrl_ga: dto_ga.programaUrl_ga,
            formato_evaluacion_ga: dto_ga.formato_evaluacion_ga,
            estado_ga: 'ENTREGADO',
            codigo_ga: codigo_ga,
            hashVerificacion_ga: hash_ga,
          },
        });

        // 2. Limpiar detalles didácticos y actividades anteriores (para permitir reemplazo limpio)
        await tx.td_detalles_didacticos_ga.deleteMany({
          where: { id_planificacion_ga: planificacion_ga.id_planificacion_ga },
        });
        await tx.td_actividades_evaluacion_ga.deleteMany({
          where: { id_planificacion_ga: planificacion_ga.id_planificacion_ga },
        });

        // 3. Insertar Detalles Didácticos por Lapso
        for (const detalle_ga of dto_ga.detallesDidacticos_ga) {
          await tx.td_detalles_didacticos_ga.create({
            data: {
              id_planificacion_ga: planificacion_ga.id_planificacion_ga,
              lapso_ga: detalle_ga.lapso_ga,
              unidad_tematica_ga: detalle_ga.unidad_tematica_ga,
              estrategia_ga: detalle_ga.estrategia_ga,
              recursos_ga: detalle_ga.recursos_ga,
              orden_ga: detalle_ga.orden_ga,
            },
          });
        }

        // 4. Insertar Actividades de Evaluación e Indicadores
        for (const act_ga of dto_ga.actividadesEvaluacion_ga) {
          const actividadCreada_ga = await tx.td_actividades_evaluacion_ga.create({
            data: {
              id_planificacion_ga: planificacion_ga.id_planificacion_ga,
              lapso_ga: act_ga.lapso_ga,
              nombre_actividad_ga: act_ga.nombre_actividad_ga,
              tipo_evaluacion_ga: act_ga.tipo_evaluacion_ga,
              porcentaje_ga: act_ga.porcentaje_ga,
              fecha_evaluacion_ga: (act_ga.fecha_evaluacion_ga && !isNaN(Date.parse(act_ga.fecha_evaluacion_ga)))
                ? new Date(act_ga.fecha_evaluacion_ga)
                : new Date(),
              orden_ga: act_ga.orden_ga,
            },
          });

          if (act_ga.indicadores_ga && act_ga.indicadores_ga.length > 0) {
            for (const ind_ga of act_ga.indicadores_ga) {
              await tx.td_indicadores_logro_ga.create({
                data: {
                  id_actividad_evaluacion_ga: actividadCreada_ga.id_actividad_evaluacion_ga,
                  descripcion_ga: ind_ga.descripcion_ga,
                  criterio_cualitativo_ga: ind_ga.criterio_cualitativo_ga,
                },
              });
            }
          }
        }

        console.log(`[PlanesEstudioService_ga] Transacción ejecutada con éxito. Planificación ID: ${planificacion_ga.id_planificacion_ga}`);
        return planificacion_ga;
      });
    } catch (error_ga: any) {
      console.error('[PlanesEstudioService_ga] Error en transacción. Ejecutando Rollback automáticamente:', error_ga.message);
      if (error_ga instanceof BadRequestException) {
        throw error_ga;
      }
      throw new InternalServerErrorException(`Fallo al guardar la planificación: ${error_ga.message}`);
    }
  }

  /**
   * Obtiene la planificación completa por materia y período
   */
  async obtenerPlanificacionPorMateriaPeriodo_ga(
    idMateria_ga: number,
    idPeriodo_ga: number,
  ) {
    console.log(`[PlanesEstudioService_ga] Consultando planificación para Materia: ${idMateria_ga}, Período: ${idPeriodo_ga}`);

    const planificacion_ga = await this.prisma.td_planificaciones_ga.findUnique({
      where: {
        id_materia_ga_id_periodo_ga: {
          id_materia_ga: Number(idMateria_ga),
          id_periodo_ga: Number(idPeriodo_ga),
        },
      },
      include: {
        materia_ga: true,
        periodo_ga: true,
        profesor_ga: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
          },
        },
        detallesDidacticos_ga: {
          orderBy: [{ lapso_ga: 'asc' }, { orden_ga: 'asc' }],
        },
        actividadesEvaluacion_ga: {
          orderBy: [{ lapso_ga: 'asc' }, { orden_ga: 'asc' }],
          include: {
            indicadoresLogro_ga: true,
          },
        },
        revisiones_ga: {
          orderBy: { creadoEn_ga: 'desc' },
        },
      },
    });

    if (!planificacion_ga) {
      throw new NotFoundException('No existe planificación registrada para la materia y período indicados.');
    }

    return planificacion_ga;
  }

  /**
   * Endpoint de Contingencia Exclusivo para el Rol de Jefe de Control de Estudio
   */
  async registrarNotaContingencia_ga(
    idUsuarioControl_ga: number,
    dto_ga: RegistrarNotaContingenciaDto_ga,
  ) {
    console.log(`[PlanesEstudioService_ga] Ejecutando registro de nota por contingencia de Control de Estudio (ID: ${idUsuarioControl_ga})`);

    // Validar inscripción del alumno en la materia y período
    const inscripcion_ga = await this.prisma.td_inscripcion_materia_cjgp.findUnique({
      where: {
        id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
          id_usuario_im_cjgp: dto_ga.id_alumno_ga,
          id_materia_im_cjgp: dto_ga.id_materia_ga,
          id_periodo_im_cjgp: dto_ga.id_periodo_ga,
        },
      },
    });

    if (!inscripcion_ga) {
      throw new NotFoundException('El alumno no posee inscripción en la materia y período indicados.');
    }

    // Actualizar nota final e inscripción en contingencia
    const estatus_ga = dto_ga.nota_final_ga >= 10 ? 'APROBADO' : 'REPROBADO';

    const resultado_ga = await this.prisma.$transaction(async (tx) => {
      const inscripcionActualizada_ga = await tx.td_inscripcion_materia_cjgp.update({
        where: { id_inscripcion_materia_cjgp: inscripcion_ga.id_inscripcion_materia_cjgp },
        data: {
          notaFinal_cjgp: dto_ga.nota_final_ga,
          estatus_cjgp: estatus_ga,
          actualizadoEn_cjgp: new Date(),
        },
      });

      // Registrar auditoría en la bitácora del sistema (_jc)
      await tx.td_auditoria_jc.create({
        data: {
          modulo_jc: 'CONTROL_ESTUDIOS',
          accion_jc: 'NOTA_CONTINGENCIA_REGISTRADA',
          descripcion_jc: `Jefe de Control de Estudios (ID: ${idUsuarioControl_ga}) registró nota por contingencia de ${dto_ga.nota_final_ga} pts al alumno ID: ${dto_ga.id_alumno_ga}. Motivo: ${dto_ga.observacion_ga}`,
          resultado_jc: 'EXITO',
          id_usuario_auditoria_jc: idUsuarioControl_ga,
          id_afectado_jc: dto_ga.id_alumno_ga,
          id_materia_aud_jc: dto_ga.id_materia_ga,
          id_periodo_aud_jc: dto_ga.id_periodo_ga,
        },
      });

      return inscripcionActualizada_ga;
    });

    console.log(`[PlanesEstudioService_ga] Nota de contingencia registrada exitosamente.`);
    return resultado_ga;
  }

  /**
   * Obtiene la bandeja de revisión de planes para un período (Admin / Control de Estudios)
   */
  async obtenerBandejaRevision_ga(idPeriodo_ga: number) {
    console.log(`[PlanesEstudioService_ga] Consultando bandeja de revisión para período: ${idPeriodo_ga}`);

    const planes_ga = await this.prisma.td_planificaciones_ga.findMany({
      where: {
        id_periodo_ga: Number(idPeriodo_ga),
      },
      include: {
        materia_ga: {
          include: {
            carrera_cjgp: true,
          },
        },
        periodo_ga: true,
        profesor_ga: {
          select: {
            id_usuario_ahbb: true,
            nombre_ahbb: true,
            apellido_ahbb: true,
            correo_ahbb: true,
          },
        },
        detallesDidacticos_ga: {
          orderBy: [{ lapso_ga: 'asc' }, { orden_ga: 'asc' }],
        },
        actividadesEvaluacion_ga: {
          orderBy: [{ lapso_ga: 'asc' }, { orden_ga: 'asc' }],
          include: {
            indicadoresLogro_ga: true,
          },
        },
        revisiones_ga: {
          orderBy: { creadoEn_ga: 'desc' },
        },
      },
      orderBy: { actualizadoEn_ga: 'desc' },
    });

    return planes_ga;
  }

  /**
   * Revisa un plan de estudio (Aprobar o Devolver con observaciones)
   */
  async revisarPlan_ga(
    idPlanificacion_ga: number,
    idRevisor_ga: number,
    accion_ga: 'APROBADO' | 'DEVUELTO',
    observacion_ga?: string,
  ) {
    console.log(`[PlanesEstudioService_ga] Revisando plan ${idPlanificacion_ga} por Revisor ${idRevisor_ga} → Acción: ${accion_ga}`);

    const plan_ga = await this.prisma.td_planificaciones_ga.findUnique({
      where: { id_planificacion_ga: Number(idPlanificacion_ga) },
    });

    if (!plan_ga) {
      throw new NotFoundException('Planificación no encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar estado del plan
      const planActualizado_ga = await tx.td_planificaciones_ga.update({
        where: { id_planificacion_ga: Number(idPlanificacion_ga) },
        data: {
          estado_ga: accion_ga,
          actualizadoEn_ga: new Date(),
        },
      });

      // 2. Registrar historial de revisión
      await tx.td_revisiones_plan_ga.create({
        data: {
          id_planificacion_ga: Number(idPlanificacion_ga),
          id_revisor_ga: idRevisor_ga,
          accion_ga: accion_ga,
          observacion_ga: observacion_ga || null,
        },
      });

      return planActualizado_ga;
    });
  }

  /**
   * Genera la Plantilla Excel (.xlsx) Oficial para el Cronograma de Planificación Curricular (_ga)
   */
  generarPlantillaExcel_ga(): Buffer {
    console.log('[PlanesEstudioService_ga] Generando plantilla Excel de cronograma');

    // Fila de ejemplo 1 (Lapso 1)
    const filasPlantilla_ga = [
      {
        Lapso: 1,
        'Unidad Temática': 'Unidad I: Fundamentos y Conceptos Básicos',
        'Estrategia Didáctica': 'Clases teóricas magistrales y talleres',
        'Recursos Instruccionales': 'Proyector, Guía de ejercicios en PDF',
        'Nombre Actividad Evaluativa': 'Examen Parcial I',
        'Tipo Evaluación': 'EXAMEN',
        'Porcentaje (%)': 50,
        'Fecha Estimada (AAAA-MM-DD)': '2026-08-15',
        'Indicador de Logro': 'Demuestra dominio de conceptos teóricos fundamentales',
      },
      {
        Lapso: 1,
        'Unidad Temática': 'Unidad I: Fundamentos y Conceptos Básicos',
        'Estrategia Didáctica': 'Clases teóricas magistrales y talleres',
        'Recursos Instruccionales': 'Proyector, Guía de ejercicios en PDF',
        'Nombre Actividad Evaluativa': 'Taller Práctico I',
        'Tipo Evaluación': 'TALLER',
        'Porcentaje (%)': 50,
        'Fecha Estimada (AAAA-MM-DD)': '2026-08-30',
        'Indicador de Logro': 'Aplica los algoritmos aprendidos en la solución de ejercicios',
      },
      {
        Lapso: 2,
        'Unidad Temática': 'Unidad II: Aplicaciones Avanzadas y Proyectos',
        'Estrategia Didáctica': 'Resolución de problemas en grupo y laboratorios',
        'Recursos Instruccionales': 'Laboratorio de Computación, Guías de código',
        'Nombre Actividad Evaluativa': 'Examen Parcial II',
        'Tipo Evaluación': 'EXAMEN',
        'Porcentaje (%)': 50,
        'Fecha Estimada (AAAA-MM-DD)': '2026-09-15',
        'Indicador de Logro': 'Resuelve problemas avanzados con rigor metodológico',
      },
      {
        Lapso: 2,
        'Unidad Temática': 'Unidad II: Aplicaciones Avanzadas y Proyectos',
        'Estrategia Didáctica': 'Resolución de problemas en grupo y laboratorios',
        'Recursos Instruccionales': 'Laboratorio de Computación, Guías de código',
        'Nombre Actividad Evaluativa': 'Proyecto Final Integrador',
        'Tipo Evaluación': 'PROYECTO',
        'Porcentaje (%)': 50,
        'Fecha Estimada (AAAA-MM-DD)': '2026-09-30',
        'Indicador de Logro': 'Desarrolla un proyecto funcional aplicando todas las unidades',
      },
    ];

    const hoja_ga = XLSX.utils.json_to_sheet(filasPlantilla_ga);

    // Ajustar ancho de columnas para visualización amigable
    hoja_ga['!cols'] = [
      { wch: 8 },  // Lapso
      { wch: 38 }, // Unidad Temática
      { wch: 38 }, // Estrategia Didáctica
      { wch: 32 }, // Recursos
      { wch: 28 }, // Nombre Actividad
      { wch: 18 }, // Tipo Evaluación
      { wch: 15 }, // Porcentaje (%)
      { wch: 22 }, // Fecha
      { wch: 45 }, // Indicador
    ];

    const libro_ga = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro_ga, hoja_ga, 'Cronograma UNE');

    return XLSX.write(libro_ga, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Procesa la subida de un archivo Excel (.xlsx) y extrae las actividades y detalles didácticos (_ga)
   */
  importarCronogramaExcel_ga(bufferArchivo_ga: Buffer) {
    console.log('[PlanesEstudioService_ga] Procesando archivo Excel para importación de cronograma');

    try {
      const libro_ga = XLSX.read(bufferArchivo_ga, { type: 'buffer' });
      const primeraHojaNombre_ga = libro_ga.SheetNames[0];
      const hoja_ga = libro_ga.Sheets[primeraHojaNombre_ga];

      if (!hoja_ga) {
        throw new BadRequestException('El archivo Excel no contiene hojas de datos válidas.');
      }

      const filas_ga: any[] = XLSX.utils.sheet_to_json(hoja_ga);

      if (!filas_ga || filas_ga.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío o no contiene filas con encabezados válidos.');
      }

      const detallesDidacticos_ga: any[] = [];
      const actividadesEvaluacion_ga: any[] = [];

      // Mapear filas a la estructura del DTO
      for (const fila_ga of filas_ga) {
        const lapso_ga = Number(fila_ga['Lapso'] || fila_ga['lapso'] || 1);
        const unidad_tematica_ga = String(fila_ga['Unidad Temática'] || fila_ga['unidad_tematica'] || '').trim();
        const estrategia_ga = String(fila_ga['Estrategia Didáctica'] || fila_ga['estrategia'] || '').trim();
        const recursos_ga = String(fila_ga['Recursos Instruccionales'] || fila_ga['recursos'] || '').trim();

        const nombre_actividad_ga = String(fila_ga['Nombre Actividad Evaluativa'] || fila_ga['nombre_actividad'] || '').trim();
        const tipo_evaluacion_ga = String(fila_ga['Tipo Evaluación'] || fila_ga['tipo'] || 'TALLER').trim().toUpperCase();
        const porcentaje_ga = Number(fila_ga['Porcentaje (%)'] || fila_ga['porcentaje'] || 0);
        const fecha_evaluacion_ga = String(fila_ga['Fecha Estimada (AAAA-MM-DD)'] || fila_ga['fecha'] || '').trim();
        const descripcion_indicador_ga = String(fila_ga['Indicador de Logro'] || fila_ga['indicador'] || '').trim();

        // Acumular detalle didáctico por lapso (evitar duplicados de la misma unidad en el lapso)
        let detalleExistente_ga = detallesDidacticos_ga.find((d) => d.lapso_ga === lapso_ga);
        if (!detalleExistente_ga && (unidad_tematica_ga || estrategia_ga || recursos_ga)) {
          detallesDidacticos_ga.push({
            lapso_ga,
            unidad_tematica_ga: unidad_tematica_ga || `Unidad Temática Lapso ${lapso_ga}`,
            estrategia_ga: estrategia_ga || 'Estrategias didácticas variadas',
            recursos_ga: recursos_ga || 'Recursos didácticos de la materia',
            orden_ga: 1,
          });
        }

        // Acumular actividad evaluativa
        if (nombre_actividad_ga) {
          const countActividadesLapso_ga = actividadesEvaluacion_ga.filter((a) => a.lapso_ga === lapso_ga).length;
          if (countActividadesLapso_ga >= 4) {
            throw new BadRequestException(`El Lapso ${lapso_ga} en el Excel supera el límite máximo de 4 evaluaciones.`);
          }

          actividadesEvaluacion_ga.push({
            lapso_ga,
            nombre_actividad_ga,
            tipo_evaluacion_ga,
            porcentaje_ga,
            fecha_evaluacion_ga: fecha_evaluacion_ga || new Date().toISOString().split('T')[0],
            orden_ga: countActividadesLapso_ga + 1,
            descripcion_indicador_ga,
          });
        }
      }

      // Validar reglas de suma porcentual 100% si hay actividades
      const sumaLapso1_ga = actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 1).reduce((acc, c) => acc + Number(c.porcentaje_ga), 0);
      const sumaLapso2_ga = actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 2).reduce((acc, c) => acc + Number(c.porcentaje_ga), 0);

      if (actividadesEvaluacion_ga.length > 0) {
        if (Math.abs(sumaLapso1_ga - 100) > 0.01) {
          throw new BadRequestException(`Las actividades del Lapso 1 en el Excel deben sumar 100%. Suma actual: ${sumaLapso1_ga}%`);
        }
        if (Math.abs(sumaLapso2_ga - 100) > 0.01) {
          throw new BadRequestException(`Las actividades del Lapso 2 en el Excel deben sumar 100%. Suma actual: ${sumaLapso2_ga}%`);
        }
      }

      console.log(`[PlanesEstudioService_ga] Importación Excel exitosa: ${actividadesEvaluacion_ga.length} actividades procesadas.`);

      return {
        exito_ga: true,
        mensaje_ga: 'Cronograma importado exitosamente desde Excel.',
        detallesDidacticos_ga,
        actividadesEvaluacion_ga,
        formato_evaluacion_ga: 'CUANTITATIVO',
      };
    } catch (error_ga: any) {
      console.error('[PlanesEstudioService_ga] Error al importar Excel:', error_ga.message);
      if (error_ga instanceof BadRequestException) throw error_ga;
      throw new BadRequestException(`Error al procesar el archivo Excel: ${error_ga.message}`);
    }
  }

  /**
   * Exporta la planificación activa de una materia en formato Excel (.xlsx)
   */
  async exportarPlanExcel_ga(idMateria_ga: number, idPeriodo_ga: number): Promise<Buffer> {
    console.log(`[PlanesEstudioService_ga] Exportando planificación a Excel: Materia ${idMateria_ga}, Período ${idPeriodo_ga}`);

    const plan_ga = await this.obtenerPlanificacionPorMateriaPeriodo_ga(idMateria_ga, idPeriodo_ga);

    const filas_ga: any[] = [];

    for (const act_ga of plan_ga.actividadesEvaluacion_ga) {
      const det_ga = plan_ga.detallesDidacticos_ga.find((d) => d.lapso_ga === act_ga.lapso_ga);

      filas_ga.push({
        Lapso: act_ga.lapso_ga,
        'Unidad Temática': det_ga?.unidad_tematica_ga || '',
        'Estrategia Didáctica': det_ga?.estrategia_ga || '',
        'Recursos Instruccionales': det_ga?.recursos_ga || '',
        'Nombre Actividad Evaluativa': act_ga.nombre_actividad_ga,
        'Tipo Evaluación': act_ga.tipo_evaluacion_ga,
        'Porcentaje (%)': Number(act_ga.porcentaje_ga),
        'Fecha Estimada (AAAA-MM-DD)': act_ga.fecha_evaluacion_ga ? new Date(act_ga.fecha_evaluacion_ga).toISOString().split('T')[0] : '',
        'Indicador de Logro': act_ga.indicadoresLogro_ga?.[0]?.descripcion_ga || '',
      });
    }

    const hoja_ga = XLSX.utils.json_to_sheet(filas_ga);
    hoja_ga['!cols'] = [
      { wch: 8 },  { wch: 38 }, { wch: 38 }, { wch: 32 },
      { wch: 28 }, { wch: 18 }, { wch: 15 }, { wch: 22 }, { wch: 45 },
    ];

    const libro_ga = XLSX.utils.book_new();
    const nombreHoja_ga = `${plan_ga.materia_ga?.codigo_cjgp || 'MAT'}_${plan_ga.periodo_ga?.nombre_cjgp || 'PER'}`;
    XLSX.utils.book_append_sheet(libro_ga, hoja_ga, nombreHoja_ga);

    return XLSX.write(libro_ga, { type: 'buffer', bookType: 'xlsx' });
  }
}

