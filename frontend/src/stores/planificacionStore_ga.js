import { defineStore } from 'pinia';

const CLAVE_LOCALSTORAGE_GA = 'planificacion_temp_ga';

/**
 * Tienda Pinia reactiva para el Módulo de Planificación Curricular (_ga)
 * Guarda temporalmente cada pulsación del usuario en localStorage para prevenir la pérdida accidental de datos.
 */
export const usePlanificacionStore_ga = defineStore('planificacion_ga', {
  state: () => ({
    idMateria_ga: null,
    idPeriodo_ga: null,
    programaUrl_ga: '',
    nombreArchivoPrograma_ga: '',
    formato_evaluacion_ga: 'CUANTITATIVO', // CUANTITATIVO | CUALITATIVO

    // Detalles didácticos (Lapso 1 y 2)
    detallesDidacticos_ga: [
      { lapso_ga: 1, unidad_tematica_ga: '', estrategia_ga: '', recursos_ga: '', orden_ga: 1 },
      { lapso_ga: 2, unidad_tematica_ga: '', estrategia_ga: '', recursos_ga: '', orden_ga: 1 },
    ],

    // Actividades de evaluación (Máximo 4 por lapso)
    actividadesEvaluacion_ga: [
      // Lapso 1 (hasta 4 actividades)
      { lapso_ga: 1, nombre_actividad_ga: 'Examen Parcial I', tipo_evaluacion_ga: 'EXAMEN', porcentaje_ga: 50, fecha_evaluacion_ga: '', orden_ga: 1, descripcion_indicador_ga: '' },
      { lapso_ga: 1, nombre_actividad_ga: 'Taller Práctico I', tipo_evaluacion_ga: 'TALLER', porcentaje_ga: 50, fecha_evaluacion_ga: '', orden_ga: 2, descripcion_indicador_ga: '' },
      // Lapso 2 (hasta 4 actividades)
      { lapso_ga: 2, nombre_actividad_ga: 'Examen Parcial II', tipo_evaluacion_ga: 'EXAMEN', porcentaje_ga: 50, fecha_evaluacion_ga: '', orden_ga: 1, descripcion_indicador_ga: '' },
      { lapso_ga: 2, nombre_actividad_ga: 'Proyecto Final', tipo_evaluacion_ga: 'PROYECTO', porcentaje_ga: 50, fecha_evaluacion_ga: '', orden_ga: 2, descripcion_indicador_ga: '' },
    ],
  }),

  getters: {
    // Actividades separadas por lapso
    actividadesLapso1_ga: (state) => state.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 1),
    actividadesLapso2_ga: (state) => state.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === 2),

    // Suma porcentual del Lapso 1
    sumaPorcentajeLapso1_ga: (state) => {
      return state.actividadesEvaluacion_ga
        .filter((a) => a.lapso_ga === 1)
        .reduce((acc, curr) => acc + (Number(curr.porcentaje_ga) || 0), 0);
    },

    // Suma porcentual del Lapso 2
    sumaPorcentajeLapso2_ga: (state) => {
      return state.actividadesEvaluacion_ga
        .filter((a) => a.lapso_ga === 2)
        .reduce((acc, curr) => acc + (Number(curr.porcentaje_ga) || 0), 0);
    },

    // Validación de 100% por lapso en modo Cuantitativo
    esValidoLapso1_ga() {
      if (this.formato_evaluacion_ga === 'CUALITATIVO') return true;
      return Math.abs(this.sumaPorcentajeLapso1_ga - 100) < 0.01;
    },

    esValidoLapso2_ga() {
      if (this.formato_evaluacion_ga === 'CUALITATIVO') return true;
      return Math.abs(this.sumaPorcentajeLapso2_ga - 100) < 0.01;
    },

    // Validación global de la planificación
    esPlanificacionValida_ga() {
      const programaValido_ga = !!this.programaUrl_ga;
      const lapsosValidos_ga = this.esValidoLapso1_ga && this.esValidoLapso2_ga;
      const limiteActividades_ga =
        this.actividadesLapso1_ga.length <= 4 && this.actividadesLapso2_ga.length <= 4;

      return programaValido_ga && lapsosValidos_ga && limiteActividades_ga;
    },
  },

  actions: {
    // Guardar estado en localStorage en cada edición (Anti-pérdida de datos)
    persistirEstadoTemp_ga() {
      try {
        localStorage.setItem(CLAVE_LOCALSTORAGE_GA, JSON.stringify(this.$state));
        console.log('[PlanificacionStore_ga] Estado temporal guardado en localStorage');
      } catch (error) {
        console.error('[PlanificacionStore_ga] Error al guardar en localStorage:', error);
      }
    },

    // Cargar estado guardado en localStorage
    cargarEstadoTemp_ga() {
      try {
        const datos_ga = localStorage.getItem(CLAVE_LOCALSTORAGE_GA);
        if (datos_ga) {
          this.$patch(JSON.parse(datos_ga));
          console.log('[PlanificacionStore_ga] Estado temporal restaurado');
        }
      } catch (error) {
        console.error('[PlanificacionStore_ga] Error al recuperar localStorage:', error);
      }
    },

    // Limpiar borrador local
    limpiarEstado_ga() {
      localStorage.removeItem(CLAVE_LOCALSTORAGE_GA);
      this.$reset();
    },

    // Agregar actividad a un lapso (Máximo 4)
    agregarActividad_ga(lapso_ga) {
      const actividadesLapso_ga = this.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === lapso_ga);
      if (actividadesLapso_ga.length >= 4) {
        return false;
      }

      this.actividadesEvaluacion_ga.push({
        lapso_ga,
        nombre_actividad_ga: `Nueva Actividad ${actividadesLapso_ga.length + 1}`,
        tipo_evaluacion_ga: 'TALLER',
        porcentaje_ga: 0,
        fecha_evaluacion_ga: '',
        orden_ga: actividadesLapso_ga.length + 1,
        descripcion_indicador_ga: '',
      });

      this.persistirEstadoTemp_ga();
      return true;
    },

    // Eliminar actividad de un lapso
    eliminarActividad_ga(indexGlobal_ga) {
      this.actividadesEvaluacion_ga.splice(indexGlobal_ga, 1);
      this.persistirEstadoTemp_ga();
    },
  },
});
