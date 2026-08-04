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
          Parametrización del formato de evaluación por período académico — Módulo Planificación (_ga)
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
          Elige el período sobre el cual vas a definir el formato de evaluación curricular.
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
          <q-chip
            :color="formatoEsCuantitativo_ga ? 'cyan-8' : 'purple-8'"
            text-color="white"
            class="text-weight-bold"
          >
            FORMATO ACTUAL: {{ formatoEsCuantitativo_ga ? 'CUANTITATIVO' : 'CUALITATIVO' }}
          </q-chip>
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
                  <div>
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
                  <div class="q-pa-sm rounded-borders text-center" :class="formatoEsCuantitativo_ga ? 'bg-primary text-white text-weight-bold' : 'bg-grey-3 text-grey-7'">
                    <q-icon name="pin" size="16px" /> CUANTITATIVO
                  </div>
                </div>
                <div class="col-6">
                  <div class="q-pa-sm rounded-borders text-center" :class="!formatoEsCuantitativo_ga ? 'bg-purple-9 text-white text-weight-bold' : 'bg-grey-3 text-grey-7'">
                    <q-icon name="star" size="16px" /> CUALITATIVO
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna 2: Restricciones inamovibles (Product Owner) -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 text-weight-bold text-primary q-mb-xs flex items-center gap-2">
                <q-icon name="lock" color="primary" />
                Restricciones Inamovibles del Sistema (PO)
              </div>
              <div class="text-caption text-grey-7 q-mb-md">
                Parámetros estructurales fijados por la normativa académica.
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-card flat bordered class="bg-amber-1 border-amber q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-grey-8">Estructura del Trimestre</div>
                        <div class="text-h6 text-weight-bolder text-amber-10">2 LAPSOS</div>
                        <div class="text-caption text-amber-9">Dividido obligatoriamente en Lapso 1 y Lapso 2</div>
                      </div>
                      <q-icon name="lock" size="32px" color="amber-8" />
                    </div>
                  </q-card>
                </div>
                <div class="col-12">
                  <q-card flat bordered class="bg-red-1 border-red q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-grey-8">Límite por Lapso</div>
                        <div class="text-h6 text-weight-bolder text-red-10">MÁXIMO 4 EVALUACIONES</div>
                        <div class="text-caption text-red-9">Hasta 4 actividades evaluables por lapso</div>
                      </div>
                      <q-icon name="lock" size="32px" color="red-8" />
                    </div>
                  </q-card>
                </div>
              </div>
            </div>

          </div>

          <!-- Banner aviso cambio no guardado -->
          <q-banner v-if="hayCambiosPendientes_ga" rounded dense class="bg-orange-2 text-orange-10 q-mt-md">
            <template #avatar>
              <q-icon name="warning" color="orange-9" />
            </template>
            Tiene cambios pendientes. Haga clic en <strong>Guardar Configuración</strong> para aplicarlos en la base de datos.
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

const hayCambiosPendientes_ga = computed(() => {
  if (!configuracion_ga.value) return false;
  const formatoActual_ga = formatoEsCuantitativo_ga.value ? 'CUANTITATIVO' : 'CUALITATIVO';
  return formatoActual_ga !== formatoOriginal_ga.value;
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
        lapsos_totales_ga: 2,
        max_evaluaciones_lapso_ga: 4,
      }
    );

    configuracion_ga.value = respuesta_ga.configuracion_ga;
    formatoOriginal_ga.value = formatoNuevo_ga;

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
.border-red {
  border: 1px solid #e53935 !important;
}
.gap-2 {
  gap: 8px;
}
</style>
