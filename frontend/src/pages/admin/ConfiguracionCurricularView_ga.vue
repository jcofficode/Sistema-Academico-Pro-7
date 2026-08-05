<template>
  <!--
    ConfiguracionCurricularView_ga.vue
    Vista de Configuración Curricular Global del Período — solo ADMINISTRADOR.
    Integrada al MainLayout principal de la aplicación.
  -->
  <q-page padding class="bg-grey-1">

    <!-- Encabezado de la página -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h4 class="text-h5 q-my-none text-primary text-weight-bold flex items-center gap-2">
          <q-icon name="settings_suggest" color="primary" />
          Configuración Curricular Global
        </h4>
        <div class="text-caption text-grey-7">
          Parametrización del formato de evaluación y estructura de lapsos por período académico — Módulo Planificación (_ga)
        </div>
      </div>
    </div>

    <!-- PASO 1: Selector de Período Académico -->
    <q-card flat bordered class="q-mb-md bg-white shadow-1">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-primary q-mb-xs flex items-center gap-2">
          <q-icon name="event" color="primary" />
          1. Seleccionar Período Académico
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Elige el período sobre el cual vas a definir el formato de evaluación y la estructura académica.
        </div>

        <q-select
          id="select-periodo-ga"
          v-model="periodoSeleccionado_ga"
          :options="opcionesPeriodos_ga"
          option-value="id_periodo_cjgp"
          option-label="nombre_cjgp"
          label="Período Académico *"
          outlined
          dense
          emit-value
          map-options
          :loading="cargandoPeriodos_ga"
          color="primary"
          style="max-width: 420px;"
          @update:model-value="cargarConfiguracionDelPeriodo_ga"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ scope.opt.nombre_cjgp }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  :color="scope.opt.activo_cjgp ? 'positive' : 'grey-6'"
                  text-color="white"
                  size="sm"
                  class="text-weight-bold"
                >
                  {{ scope.opt.activo_cjgp ? 'ACTIVO' : 'CERRADO' }}
                </q-chip>
              </q-item-section>
            </q-item>
          </template>
          <template #prepend>
            <q-icon name="date_range" color="primary" />
          </template>
        </q-select>
      </q-card-section>
    </q-card>

    <!-- PASO 2: Panel de Parámetros Curriculares -->
    <transition name="fade">
      <q-card v-if="periodoSeleccionado_ga && configuracion_ga" flat bordered class="bg-white shadow-2">

        <!-- Card Header -->
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold flex items-center gap-2">
            <q-icon name="tune" size="22px" />
            Parámetros Curriculares — Período {{ nombrePeriodoActual_ga }}
          </div>
          <div class="row items-center gap-2">
            <q-chip
              :color="formatoEsCuantitativo_ga ? 'cyan-8' : 'purple-8'"
              text-color="white"
              class="text-weight-bold"
            >
              {{ formatoEsCuantitativo_ga ? 'CUANTITATIVO' : 'CUALITATIVO' }}
            </q-chip>
            <q-chip color="amber-9" text-color="white" class="text-weight-bold">
              {{ lapsosTotales_ga }} {{ lapsosTotales_ga === 1 ? 'LAPSO' : 'LAPSOS' }}
            </q-chip>
            <q-chip color="teal-8" text-color="white" class="text-weight-bold">
              MÁX {{ maxEvaluacionesLapso_ga }} EVAL/LAPSO
            </q-chip>
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <div class="row q-col-gutter-lg">

            <!-- Columna 1: Formato de Evaluación (Toggle) -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 text-weight-bold text-primary q-mb-xs flex items-center gap-2">
                <q-icon name="display_settings" color="primary" />
                2. Formato de Evaluación Global
              </div>
              <div class="text-caption text-grey-7 q-mb-md">
                Alterna el interruptor para cambiar el sistema de calificación docente del período.
              </div>

              <!-- Tarjeta interactiva del toggle -->
              <q-card flat bordered :class="formatoEsCuantitativo_ga ? 'bg-blue-1 border-primary' : 'bg-purple-1 border-purple'" class="q-pa-md q-mb-md">
                <div class="row items-center justify-between">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-bold" :class="formatoEsCuantitativo_ga ? 'text-primary' : 'text-purple-9'">
                      <q-icon :name="formatoEsCuantitativo_ga ? 'pin' : 'star'" class="q-mr-xs" />
                      {{ formatoEsCuantitativo_ga ? 'Cuantitativo (Escala 0 - 20 pts)' : 'Cualitativo (Niveles Descriptivos)' }}
                    </div>
                    <div class="text-caption text-grey-8 q-mt-xs">
                      {{ formatoEsCuantitativo_ga
                        ? 'Los profesores ingresan notas de 0 a 20 pts con porcentajes por evaluación.'
                        : 'Los profesores evalúan con escalas conceptuales (Excelente, Bueno, Regular, Deficiente).' }}
                    </div>
                  </div>
                  <q-toggle
                    id="toggle-formato-ga"
                    v-model="formatoEsCuantitativo_ga"
                    :color="formatoEsCuantitativo_ga ? 'primary' : 'purple-8'"
                    size="lg"
                  />
                </div>
              </q-card>

              <div class="row q-col-gutter-xs">
                <div class="col-6">
                  <div class="q-pa-sm rounded-borders text-center cursor-pointer" :class="formatoEsCuantitativo_ga ? 'bg-primary text-white text-weight-bold' : 'bg-grey-3 text-grey-7'" @click="formatoEsCuantitativo_ga = true">
                    <q-icon name="pin" size="16px" /> CUANTITATIVO
                  </div>
                </div>
                <div class="col-6">
                  <div class="q-pa-sm rounded-borders text-center cursor-pointer" :class="!formatoEsCuantitativo_ga ? 'bg-purple-9 text-white text-weight-bold' : 'bg-grey-3 text-grey-7'" @click="formatoEsCuantitativo_ga = false">
                    <q-icon name="star" size="16px" /> CUALITATIVO
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna 2: Parámetros Dinámicos Configurables (Lapsos y Evaluaciones) -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 text-weight-bold text-primary q-mb-xs flex items-center gap-2">
                <q-icon name="tune" color="primary" />
                3. Estructura de Lapsos y Límites de Evaluación
              </div>
              <div class="text-caption text-grey-7 q-mb-md">
                Ajusta los parámetros de distribución curricular para los docentes en este período.
              </div>

              <div class="row q-col-gutter-md">
                <!-- Control de Lapsos Totales -->
                <div class="col-12">
                  <q-card flat bordered class="bg-amber-1 border-amber q-pa-md">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-weight-bold text-amber-10 flex items-center gap-1">
                        <q-icon name="view_week" color="amber-10" />
                        Número de Lapsos Totales
                      </div>
                      <q-badge color="amber-9" class="text-weight-bold text-subtitle2 q-px-sm">
                        {{ lapsosTotales_ga }} {{ lapsosTotales_ga === 1 ? 'Lapso' : 'Lapsos' }}
                      </q-badge>
                    </div>
                    <div class="text-caption text-grey-8 q-mb-sm">
                      Define en cuántas etapas de corte se dividirá la planificación docente.
                    </div>

                    <q-select
                      v-model="lapsosTotales_ga"
                      :options="opcionesLapsos_ga"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      color="amber-10"
                    >
                      <template #prepend>
                        <q-icon name="layers" color="amber-9" />
                      </template>
                    </q-select>
                  </q-card>
                </div>

                <!-- Control de Máximo de Evaluaciones por Lapso -->
                <div class="col-12">
                  <q-card flat bordered class="bg-blue-1 border-blue q-pa-md">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-weight-bold text-blue-10 flex items-center gap-1">
                        <q-icon name="assignment" color="blue-10" />
                        Máximo de Evaluaciones por Lapso
                      </div>
                      <q-badge color="blue-9" class="text-weight-bold text-subtitle2 q-px-sm">
                        Máx {{ maxEvaluacionesLapso_ga }} Evaluaciones
                      </q-badge>
                    </div>
                    <div class="text-caption text-grey-8 q-mb-sm">
                      Límite de actividades evaluables que un profesor puede registrar en cada lapso.
                    </div>

                    <div class="row items-center q-col-gutter-sm">
                      <div class="col">
                        <q-slider
                          v-model="maxEvaluacionesLapso_ga"
                          :min="1"
                          :max="10"
                          :step="1"
                          markers
                          snap
                          label
                          color="blue-9"
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="maxEvaluacionesLapso_ga"
                          type="number"
                          min="1"
                          max="10"
                          outlined
                          dense
                          bg-color="white"
                          style="width: 75px;"
                          class="text-weight-bold text-center"
                        />
                      </div>
                    </div>
                  </q-card>
                </div>
              </div>

              <!-- Resumen dinámico -->
              <div class="q-mt-md q-pa-sm bg-grey-2 rounded-borders row items-center justify-between text-caption text-grey-8">
                <span class="flex items-center gap-1">
                  <q-icon name="info" color="primary" /> Capacidad Total del Período:
                </span>
                <span class="text-weight-bold text-primary">
                  Hasta {{ capacidadTotalEvaluaciones_ga }} actividades evaluables en total por materia
                </span>
              </div>
            </div>

          </div>

          <!-- Banner aviso cambio no guardado -->
          <q-banner v-if="hayCambiosPendientes_ga" rounded dense class="bg-orange-2 text-orange-10 q-mt-md">
            <template #avatar>
              <q-icon name="warning" color="orange-9" />
            </template>
            Tiene cambios pendientes de guardar. Haga clic en <strong>Guardar Configuración</strong> para aplicarlos en la base de datos.
          </q-banner>
        </q-card-section>

        <!-- Acciones del Card -->
        <q-card-actions align="between" class="q-pa-md bg-grey-2">
          <div class="text-caption text-grey-7">
            Última actualización: {{ ultimaActualizacion_ga }}
          </div>
          <div>
            <q-btn
              flat
              label="Restablecer"
              icon="undo"
              color="grey-8"
              :disable="!hayCambiosPendientes_ga || guardando_ga"
              class="q-mr-sm"
              @click="restablecerCambios_ga"
            />
            <q-btn
              id="btn-guardar-config-ga"
              unelevated
              label="Guardar Configuración"
              icon="save"
              color="primary"
              :loading="guardando_ga"
              :disable="!hayCambiosPendientes_ga"
              class="text-weight-bold q-px-lg"
              @click="guardarConfiguracion_ga"
            />
          </div>
        </q-card-actions>
      </q-card>
    </transition>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { planEstudioServicio_ga } from 'src/servicios/planEstudioServicio_ga';

const $q = useQuasar();

const opcionesPeriodos_ga = ref([]);
const periodoSeleccionado_ga = ref(null);
const cargandoPeriodos_ga = ref(false);

const configuracion_ga = ref(null);
const cargandoConfig_ga = ref(false);
const guardando_ga = ref(false);

const formatoOriginal_ga = ref('CUANTITATIVO');
const formatoEsCuantitativo_ga = ref(true);

const lapsosTotales_ga = ref(2);
const lapsosTotalesOriginal_ga = ref(2);

const maxEvaluacionesLapso_ga = ref(4);
const maxEvaluacionesOriginal_ga = ref(4);

const opcionesLapsos_ga = [
  { label: '1 Lapso (Curso Intensivo / Taller Único)', value: 1 },
  { label: '2 Lapsos (Estructura Semestral Tradicional)', value: 2 },
  { label: '3 Lapsos (Estructura Trimestral)', value: 3 },
  { label: '4 Lapsos (Estructura de 4 Cortes)', value: 4 },
  { label: '5 Lapsos (Estructura Modular Ampliada)', value: 5 },
  { label: '6 Lapsos (Estructura de 6 Cortes)', value: 6 },
];

const capacidadTotalEvaluaciones_ga = computed(() => {
  return (Number(lapsosTotales_ga.value) || 0) * (Number(maxEvaluacionesLapso_ga.value) || 0);
});

const hayCambiosPendientes_ga = computed(() => {
  if (!configuracion_ga.value) return false;
  const formatoActual_ga = formatoEsCuantitativo_ga.value ? 'CUANTITATIVO' : 'CUALITATIVO';
  return (
    formatoActual_ga !== formatoOriginal_ga.value ||
    Number(lapsosTotales_ga.value) !== Number(lapsosTotalesOriginal_ga.value) ||
    Number(maxEvaluacionesLapso_ga.value) !== Number(maxEvaluacionesOriginal_ga.value)
  );
});

const nombrePeriodoActual_ga = computed(() => {
  const per_ga = opcionesPeriodos_ga.value.find(p => p.id_periodo_cjgp === periodoSeleccionado_ga.value);
  return per_ga?.nombre_cjgp ?? '';
});

const ultimaActualizacion_ga = computed(() => {
  if (!configuracion_ga.value?.actualizadoEn_ga) return 'Sin guardar previamente';
  return new Date(configuracion_ga.value.actualizadoEn_ga).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
});

const cargarPeriodos_ga = async () => {
  cargandoPeriodos_ga.value = true;
  try {
    const datos_ga = await planEstudioServicio_ga.listarPeriodosConConfiguracion_ga();
    opcionesPeriodos_ga.value = Array.isArray(datos_ga) ? datos_ga : [];

    const activo_ga = opcionesPeriodos_ga.value.find(p => p.activo_cjgp) || opcionesPeriodos_ga.value[0];
    if (activo_ga) {
      periodoSeleccionado_ga.value = activo_ga.id_periodo_cjgp;
      await cargarConfiguracionDelPeriodo_ga(activo_ga.id_periodo_cjgp);
    }
  } catch (error_ga) {
    console.error('[_ga] Error al cargar períodos:', error_ga);
    $q.notify({
      type: 'negative',
      message: 'No se pudo cargar la lista de períodos académicos.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    cargandoPeriodos_ga.value = false;
  }
};

const cargarConfiguracionDelPeriodo_ga = async (idPeriodo_ga) => {
  if (!idPeriodo_ga) return;
  cargandoConfig_ga.value = true;
  try {
    const respuesta_ga = await planEstudioServicio_ga.obtenerConfiguracionPorPeriodo_ga(idPeriodo_ga);
    configuracion_ga.value = respuesta_ga.configuracion_ga;

    formatoOriginal_ga.value = respuesta_ga.configuracion_ga?.formato_evaluacion_ga || 'CUANTITATIVO';
    formatoEsCuantitativo_ga.value = formatoOriginal_ga.value === 'CUANTITATIVO';

    lapsosTotalesOriginal_ga.value = respuesta_ga.configuracion_ga?.lapsos_totales_ga || 2;
    lapsosTotales_ga.value = lapsosTotalesOriginal_ga.value;

    maxEvaluacionesOriginal_ga.value = respuesta_ga.configuracion_ga?.max_evaluaciones_lapso_ga || 4;
    maxEvaluacionesLapso_ga.value = maxEvaluacionesOriginal_ga.value;
  } catch (error_ga) {
    console.error('[_ga] Error al cargar configuración:', error_ga);
    $q.notify({
      type: 'negative',
      message: 'Error al obtener la configuración del período.',
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    cargandoConfig_ga.value = false;
  }
};

const guardarConfiguracion_ga = async () => {
  if (!periodoSeleccionado_ga.value) return;

  const formatoNuevo_ga = formatoEsCuantitativo_ga.value ? 'CUANTITATIVO' : 'CUALITATIVO';
  guardando_ga.value = true;

  try {
    const respuesta_ga = await planEstudioServicio_ga.actualizarConfiguracionCurricular_ga(
      periodoSeleccionado_ga.value,
      {
        formato_evaluacion_ga: formatoNuevo_ga,
        lapsos_totales_ga: Number(lapsosTotales_ga.value),
        max_evaluaciones_lapso_ga: Number(maxEvaluacionesLapso_ga.value),
      }
    );

    configuracion_ga.value = respuesta_ga.configuracion_ga;
    formatoOriginal_ga.value = formatoNuevo_ga;
    lapsosTotalesOriginal_ga.value = Number(lapsosTotales_ga.value);
    maxEvaluacionesOriginal_ga.value = Number(maxEvaluacionesLapso_ga.value);

    $q.notify({
      type: 'positive',
      message: respuesta_ga.mensaje_ga ?? 'Configuración curricular guardada correctamente.',
      icon: 'check_circle',
      position: 'top-right',
      timeout: 3000,
    });
  } catch (error_ga) {
    const msg_ga = error_ga?.response?.data?.message ?? 'Error al guardar la configuración.';
    $q.notify({
      type: 'negative',
      message: msg_ga,
      icon: 'error',
      position: 'top-right',
    });
  } finally {
    guardando_ga.value = false;
  }
};

const restablecerCambios_ga = () => {
  formatoEsCuantitativo_ga.value = formatoOriginal_ga.value === 'CUANTITATIVO';
  lapsosTotales_ga.value = lapsosTotalesOriginal_ga.value;
  maxEvaluacionesLapso_ga.value = maxEvaluacionesOriginal_ga.value;
};

onMounted(async () => {
  await cargarPeriodos_ga();
});
</script>

<style scoped>
.border-primary {
  border: 2px solid var(--q-primary) !important;
}
.border-purple {
  border: 2px solid #8e24aa !important;
}
.border-amber {
  border: 1px solid #ffb300 !important;
}
.border-blue {
  border: 1px solid #1e88e5 !important;
}
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
</style>
