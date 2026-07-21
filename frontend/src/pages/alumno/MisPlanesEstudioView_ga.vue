<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h5 q-my-none text-primary text-weight-bold">
        Planes de Estudio de mi Carrera
      </h4>
    </div>

    <!-- Selección de Período -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-select
            v-model="filtro_ga.id_periodo_ga"
            :options="periodos_ga"
            option-value="id_periodo_cjgp"
            option-label="nombre_cjgp"
            label="Período Académico"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="cargarPlanes_ga"
          />
        </div>
      </div>
    </q-card>

    <div v-if="cargando_ga" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
    </div>

    <div v-else-if="planes_ga.length === 0" class="text-center q-pa-xl">
      <q-icon name="menu_book" size="4xl" color="grey" class="q-mb-md" />
      <div class="text-h6 text-grey">Sin planes de estudio</div>
      <div class="text-caption text-grey">
        No se encontraron planes de estudio aprobados para las materias en las que estás inscrito este período.
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-md-6 col-lg-4" v-for="plan in planes_ga" :key="plan.id_plan_estudio_ga">
        <q-card flat bordered class="h-100 column">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">{{ plan.materia_ga.codigo_cjgp }}</div>
            <div class="text-subtitle2">{{ plan.materia_ga.nombre_cjgp }}</div>
          </q-card-section>
          
          <q-card-section class="col">
            <div class="row items-center q-mb-sm">
              <q-icon name="person" class="q-mr-sm" color="grey" />
              <span>Profesor: {{ plan.profesor_ga.nombre_ahbb }} {{ plan.profesor_ga.apellido_ahbb }}</span>
            </div>
            <div class="row items-center q-mb-sm">
              <q-icon name="event_note" class="q-mr-sm" color="grey" />
              <span>Unidades: {{ plan.unidades_ga.length }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="verified" class="q-mr-sm" color="positive" />
              <span class="text-positive text-weight-bold">Aprobado por Coordinación</span>
            </div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-actions align="right" class="bg-grey-1">
            <q-btn flat color="primary" icon="visibility" label="Ver Detalles" @click="abrirDetalle_ga(plan)" />
            <q-btn flat round color="secondary" icon="print" @click="descargarPdf_ga(plan.id_plan_estudio_ga)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Modal Detalles -->
    <q-dialog v-model="dialogo_ga" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column">
        <q-card-section class="row items-center q-pb-none bg-white text-primary shadow-2 z-top">
          <div class="text-h6 text-weight-bold">
            Plan de Estudio: {{ planSeleccionado_ga?.materia_ga.nombre_cjgp }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pt-md scroll" v-if="planSeleccionado_ga">
          <div class="row q-col-gutter-md">
            <!-- Secciones -->
            <div class="col-12 col-md-6">
              <q-card flat bordered class="h-100">
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-subtitle1 text-weight-bold text-primary">Información General</div>
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <div v-for="seccion in planSeleccionado_ga.plantilla_ga.secciones_ga" :key="seccion.id_seccion_ga" class="q-mb-md">
                    <div class="text-weight-bold text-secondary">{{ seccion.nombre_ga }}</div>
                    <div class="text-body2 bg-grey-2 q-pa-sm rounded-borders q-mt-xs" style="white-space: pre-wrap;">
                      {{ obtenerContenido_ga(seccion.id_seccion_ga).texto_ga || '(Sección vacía)' }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Cronograma -->
            <div class="col-12 col-md-6">
              <q-card flat bordered class="h-100">
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-subtitle1 text-weight-bold text-primary">Unidades y Cronograma</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                  <q-list separator>
                    <q-expansion-item
                      v-for="(unidad, indexU) in planSeleccionado_ga.unidades_ga"
                      :key="indexU"
                      icon="view_timeline"
                      :label="`Unidad ${unidad.orden_ga}: ${unidad.nombre_ga}`"
                      :caption="`${unidad.fecha_inicio_ga.slice(0,10)} a ${unidad.fecha_fin_ga.slice(0,10)}`"
                    >
                      <div class="q-pa-md bg-grey-1">
                        <div class="text-weight-bold q-mb-sm">Indicadores:</div>
                        <ul class="q-pl-md q-my-none">
                          <li v-for="(ind, indexI) in unidad.indicadores_ga" :key="indexI" class="q-mb-xs">
                            {{ ind.descripcion_ga }}
                          </li>
                        </ul>
                      </div>
                    </q-expansion-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';
import {
  obtenerMisPlanesAlumno_ga,
  descargarPlanPdf_ga
} from '../../servicios/planEstudioServicio_ga';

const $q = useQuasar();

const periodos_ga = ref([]);
const planes_ga = ref([]);
const cargando_ga = ref(false);
const dialogo_ga = ref(false);
const planSeleccionado_ga = ref(null);

const filtro_ga = ref({
  id_periodo_ga: null,
});

const cargarInicial_ga = async () => {
  try {
    periodos_ga.value = await obtenerPeriodos_cjgp();
    
    // Seleccionar período activo por defecto
    const activo = periodos_ga.value.find(p => p.estado_cjgp === 'ACTIVO');
    if (activo) {
      filtro_ga.value.id_periodo_ga = activo.id_periodo_cjgp;
      await cargarPlanes_ga();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Error cargando períodos.' });
  }
};

const cargarPlanes_ga = async () => {
  if (!filtro_ga.value.id_periodo_ga) return;
  cargando_ga.value = true;
  try {
    planes_ga.value = await obtenerMisPlanesAlumno_ga(filtro_ga.value.id_periodo_ga);
  } catch (error) {
    console.error(error);
  } finally {
    cargando_ga.value = false;
  }
};

const abrirDetalle_ga = (plan) => {
  planSeleccionado_ga.value = plan;
  dialogo_ga.value = true;
};

const obtenerContenido_ga = (idSeccion) => {
  return planSeleccionado_ga.value.contenidos_ga.find(c => c.id_seccion_contenido_ga === idSeccion) || {};
};

const descargarPdf_ga = async (id) => {
  $q.notify({ type: 'info', message: 'Generando PDF...' });
  await descargarPlanPdf_ga(id);
};

onMounted(cargarInicial_ga);
</script>
