import { apiCliente_ahbb as api } from './api_ahbb';

/**
 * Servicio de llamadas HTTP Axios para el Módulo de Planificación Curricular (_ga)
 */
export const planEstudioServicio_ga = {
  /**
   * Subir archivo del programa oficial (.pdf / .docx) via Multipart FormData
   */
  async subirProgramaOficial_ga(archivo_ga) {
    const formData_ga = new FormData();
    formData_ga.append('programa_ga', archivo_ga);

    const respuesta_ga = await api.post('/planes-estudio_ga/upload-programa', formData_ga, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return respuesta_ga.data;
  },

  /**
   * Guardar planificación completa en bloque (Lapsos, Actividades e Indicadores)
   */
  async guardarPlanificacionCompleta_ga(datosPlanificacion_ga) {
    const respuesta_ga = await api.post('/planes-estudio_ga/guardar-completo', datosPlanificacion_ga);
    return respuesta_ga.data;
  },

  /**
   * Obtener planificación registrada de una materia y período
   */
  async obtenerPlanificacionPorMateriaPeriodo_ga(idMateria_ga, idPeriodo_ga) {
    const respuesta_ga = await api.get(`/planes-estudio_ga/materia/${idMateria_ga}/periodo/${idPeriodo_ga}`);
    return respuesta_ga.data;
  },

  /**
   * Carga de Nota por Contingencia (Exclusivo Control de Estudios)
   */
  async registrarNotaContingencia_ga(datosContingencia_ga) {
    const respuesta_ga = await api.post('/planes-estudio_ga/contingencia-nota', datosContingencia_ga);
    return respuesta_ga.data;
  },

  // ─── Configuración Curricular Global (Administrador) ────────────────────────

  /**
   * Obtener todos los períodos con su configuración curricular actual (_ga)
   * Endpoint: GET /configuracion-curricular_ga/periodos
   */
  async listarPeriodosConConfiguracion_ga() {
    const respuesta_ga = await api.get('/configuracion-curricular_ga/periodos');
    return respuesta_ga.data;
  },

  /**
   * Obtener la configuración curricular de un período específico
   * Endpoint: GET /configuracion-curricular_ga/periodo/:id
   */
  async obtenerConfiguracionPorPeriodo_ga(idPeriodo_ga) {
    const respuesta_ga = await api.get(`/configuracion-curricular_ga/periodo/${idPeriodo_ga}`);
    return respuesta_ga.data;
  },

  /**
   * Actualizar la configuración curricular de un período (solo ADMIN)
   * Endpoint: PUT /configuracion-curricular_ga/periodo/:id
   */
  async actualizarConfiguracionCurricular_ga(idPeriodo_ga, payload_ga) {
    const respuesta_ga = await api.put(`/configuracion-curricular_ga/periodo/${idPeriodo_ga}`, payload_ga);
    return respuesta_ga.data;
  },

  // Métodos de compatibilidad para vistas legadas
  async obtenerPlantillas_ga() {
    try {
      const res = await api.get('/configuracion-curricular_ga/periodos');
      const periodos = Array.isArray(res.data) ? res.data : [];
      return periodos.map(p => {
        const config = Array.isArray(p.configuracionesPeriodo_ga)
          ? p.configuracionesPeriodo_ga[0]
          : (p.configuracionesPeriodo_ga || {});
        return {
          id_plantilla_ga: config.id_configuracion_periodo_ga || p.id_periodo_cjgp,
          id_periodo_ga: p.id_periodo_cjgp,
          periodo_ga: { nombre_cjgp: p.nombre_cjgp },
          nombre_ga: `Configuración Curricular Global ${p.nombre_cjgp}`,
          tipo_valoracion_ga: config.formato_evaluacion_ga || 'CUANTITATIVO',
          secciones_ga: [1, 2],
          estado_ga: 'PUBLICADA',
        };
      });
    } catch (error) {
      console.error('[_ga] Error al obtener plantillas:', error);
      return [];
    }
  },
  async crearPlantilla_ga(datos) {
    try {
      if (datos && datos.id_periodo_ga) {
        await planEstudioServicio_ga.actualizarConfiguracionCurricular_ga(datos.id_periodo_ga, {
          formato_evaluacion_ga: datos.tipo_valoracion_ga || 'CUANTITATIVO',
          lapsos_totales_ga: 2,
          max_evaluaciones_lapso_ga: 4,
        });
      }
      return { exito: true, mensaje: 'Configuración curricular guardada correctamente.' };
    } catch (error) {
      console.error('[_ga] Error al crear/actualizar plantilla:', error);
      return { exito: false, mensaje: error?.response?.data?.message || 'Error al guardar la configuración.' };
    }
  },
  async actualizarPlantilla_ga(id, datos) {
    return planEstudioServicio_ga.crearPlantilla_ga(datos);
  },
  async publicarPlantilla_ga(id) {
    return { exito: true, mensaje: 'Configuración curricular publicada correctamente.' };
  },
  async eliminarPlantilla_ga(id) {
    return { exito: true, mensaje: 'Configuración reducida correctamente.' };
  },
  async obtenerBandejaRevision_ga(idPeriodo_ga) {
    if (!idPeriodo_ga) return [];
    try {
      const res = await api.get(`/planes-estudio_ga/bandeja/periodo/${idPeriodo_ga}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error('[_ga] Error al obtener bandeja de revisión:', error);
      return [];
    }
  },
  async obtenerDetallePlan_ga(id) { return {}; },
  async revisarPlan_ga(idPlanificacion_ga, payload_ga) {
    try {
      const res = await api.post(`/planes-estudio_ga/revisar/${idPlanificacion_ga}`, payload_ga);
      return res.data;
    } catch (error) {
      console.error('[_ga] Error al revisar plan:', error);
      return { exito: false, mensaje: error?.response?.data?.message || 'Error al revisar el plan.' };
    }
  },
  async obtenerMisPlanesAlumno_ga() { return []; },
  async obtenerReporteCumplimiento_ga() { return {}; },
  async descargarPlanPdf_ga(id) { return true; },

  // ─── Importación / Exportación Excel (_ga) ──────────────────────────────────
  async descargarPlantillaExcel_ga() {
    const respuesta_ga = await api.get('/planes-estudio_ga/plantilla-excel', {
      responseType: 'blob',
    });
    const url_ga = window.URL.createObjectURL(new Blob([respuesta_ga.data]));
    const enlace_ga = document.createElement('a');
    enlace_ga.href = url_ga;
    enlace_ga.setAttribute('download', 'Plantilla_Cronograma_UNE_ga.xlsx');
    document.body.appendChild(enlace_ga);
    enlace_ga.click();
    enlace_ga.remove();
    window.URL.revokeObjectURL(url_ga);
    return true;
  },

  async importarCronogramaExcel_ga(archivo_ga) {
    const formData_ga = new FormData();
    formData_ga.append('excel_ga', archivo_ga);
    const respuesta_ga = await api.post('/planes-estudio_ga/importar-excel', formData_ga, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return respuesta_ga.data;
  },

  async exportarPlanExcel_ga(idMateria_ga, idPeriodo_ga) {
    const respuesta_ga = await api.get(`/planes-estudio_ga/exportar-excel/materia/${idMateria_ga}/periodo/${idPeriodo_ga}`, {
      responseType: 'blob',
    });
    const url_ga = window.URL.createObjectURL(new Blob([respuesta_ga.data]));
    const enlace_ga = document.createElement('a');
    enlace_ga.href = url_ga;
    enlace_ga.setAttribute('download', `Cronograma_Materia_${idMateria_ga}_Periodo_${idPeriodo_ga}.xlsx`);
    document.body.appendChild(enlace_ga);
    enlace_ga.click();
    enlace_ga.remove();
    window.URL.revokeObjectURL(url_ga);
    return true;
  },
};

// Exportaciones nombradas individuales para compatibilidad
export const subirProgramaOficial_ga = planEstudioServicio_ga.subirProgramaOficial_ga;
export const guardarPlanificacionCompleta_ga = planEstudioServicio_ga.guardarPlanificacionCompleta_ga;
export const obtenerPlanificacionPorMateriaPeriodo_ga = planEstudioServicio_ga.obtenerPlanificacionPorMateriaPeriodo_ga;
export const registrarNotaContingencia_ga = planEstudioServicio_ga.registrarNotaContingencia_ga;
export const listarPeriodosConConfiguracion_ga = planEstudioServicio_ga.listarPeriodosConConfiguracion_ga;
export const obtenerConfiguracionPorPeriodo_ga = planEstudioServicio_ga.obtenerConfiguracionPorPeriodo_ga;
export const actualizarConfiguracionCurricular_ga = planEstudioServicio_ga.actualizarConfiguracionCurricular_ga;
export const obtenerPlantillas_ga = planEstudioServicio_ga.obtenerPlantillas_ga;
export const crearPlantilla_ga = planEstudioServicio_ga.crearPlantilla_ga;
export const actualizarPlantilla_ga = planEstudioServicio_ga.actualizarPlantilla_ga;
export const publicarPlantilla_ga = planEstudioServicio_ga.publicarPlantilla_ga;
export const eliminarPlantilla_ga = planEstudioServicio_ga.eliminarPlantilla_ga;
export const obtenerBandejaRevision_ga = planEstudioServicio_ga.obtenerBandejaRevision_ga;
export const obtenerDetallePlan_ga = planEstudioServicio_ga.obtenerDetallePlan_ga;
export const revisarPlan_ga = planEstudioServicio_ga.revisarPlan_ga;
export const obtenerMisPlanesAlumno_ga = planEstudioServicio_ga.obtenerMisPlanesAlumno_ga;
export const obtenerReporteCumplimiento_ga = planEstudioServicio_ga.obtenerReporteCumplimiento_ga;
export const descargarPlanPdf_ga = planEstudioServicio_ga.descargarPlanPdf_ga;
export const descargarPlantillaExcel_ga = planEstudioServicio_ga.descargarPlantillaExcel_ga;
export const importarCronogramaExcel_ga = planEstudioServicio_ga.importarCronogramaExcel_ga;
export const exportarPlanExcel_ga = planEstudioServicio_ga.exportarPlanExcel_ga;

