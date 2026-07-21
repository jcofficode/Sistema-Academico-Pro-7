<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h5 q-my-none text-primary text-weight-bold">
        Revisión de Planes de Estudio
      </h4>
    </div>

    <!-- Pestañas -->
    <q-tabs
      v-model="tab_ga"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="bandeja" label="Bandeja de Revisión" icon="inbox" />
      <q-tab name="reporte" label="Reporte de Cumplimiento" icon="bar_chart" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab_ga" animated>
      <!-- TAB: Bandeja -->
      <q-tab-panel name="bandeja" class="q-pa-none q-pt-md">
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
                @update:model-value="cargarBandeja_ga"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="filtro_ga.estado_ga"
                :options="['TODOS', 'ENTREGADO', 'APROBADO', 'DEVUELTO', 'BORRADOR']"
                label="Estado"
                outlined
                dense
              />
            </div>
          </div>
        </q-card>

        <q-table
          :rows="planesFiltrados_ga"
          :columns="columnas_ga"
          row-key="id_plan_estudio_ga"
          :loading="cargando_ga"
          flat
          bordered
        >
          <template v-slot:body-cell-profesor="props">
            <q-td :props="props">
              {{ props.row.profesor_ga.nombre_ahbb }} {{ props.row.profesor_ga.apellido_ahbb }}
              <div class="text-caption text-grey">C.I: {{ props.row.profesor_ga.cedula_ahbb }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-materia="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.materia_ga.codigo_cjgp }}</div>
              <div>{{ props.row.materia_ga.nombre_cjgp }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-chip
                :color="colorEstado_ga(props.row.estado_ga)"
                text-color="white"
                size="sm"
                class="text-weight-bold"
              >
                {{ props.row.estado_ga }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="props.row.estado_ga === 'ENTREGADO'"
                color="secondary"
                icon="fact_check"
                label="Revisar"
                size="sm"
                unelevated
                @click="abrirRevision_ga(props.row)"
              />
              <q-btn
                v-else
                color="info"
                icon="visibility"
                label="Ver"
                size="sm"
                flat
                @click="abrirRevision_ga(props.row)"
              />
              <q-btn
                v-if="props.row.estado_ga === 'APROBADO'"
                color="primary"
                icon="print"
                size="sm"
                flat
                round
                class="q-ml-sm"
                @click="descargarPdf_ga(props.row.id_plan_estudio_ga)"
              />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- TAB: Reporte -->
      <q-tab-panel name="reporte" class="q-pa-none q-pt-md">
        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="filtro_ga.id_periodo_reporte_ga"
                :options="periodos_ga"
                option-value="id_periodo_cjgp"
                option-label="nombre_cjgp"
                label="Período Académico"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="cargarReporte_ga"
              />
            </div>
            <div class="col-12 col-md-4 flex items-center">
              <q-btn icon="refresh" round flat color="primary" @click="cargarReporte_ga" :loading="cargandoReporte_ga" />
            </div>
          </div>
        </q-card>

        <q-table
          :rows="reporteData_ga"
          :columns="columnasReporte_ga"
          row-key="id_carrera"
          :loading="cargandoReporte_ga"
          flat
          bordered
          hide-bottom
          :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:body-cell-progreso="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-linear-progress
                  :value="props.row.porcentaje_aprobados / 100"
                  color="positive"
                  class="col q-mr-sm"
                  size="10px"
                  rounded
                />
                <div class="text-caption text-weight-bold" style="width: 40px;">
                  {{ props.row.porcentaje_aprobados }}%
                </div>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Modal Revisión (Solo lectura + acciones) -->
    <q-dialog v-model="dialogo_ga" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column">
        <q-card-section class="row items-center q-pb-none bg-white text-primary shadow-2 z-top">
          <div class="text-h6 text-weight-bold">
            Plan de Estudio: {{ planEnRevision_ga?.materia_ga.nombre_cjgp }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pt-md scroll" v-if="planEnRevision_ga">
          <div class="row q-col-gutter-md">
            
            <div class="col-12 col-md-8">
              <!-- Secciones -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-subtitle1 text-weight-bold text-primary">Información General</div>
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <div v-for="seccion in planEnRevision_ga.plantilla_ga.secciones_ga" :key="seccion.id_seccion_ga" class="q-mb-md">
                    <div class="text-weight-bold text-secondary">{{ seccion.nombre_ga }}</div>
                    <div class="text-body2 bg-grey-2 q-pa-sm rounded-borders q-mt-xs" style="white-space: pre-wrap;">
                      {{ obtenerContenido_ga(seccion.id_seccion_ga).texto_ga || '(Sección vacía)' }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Cronograma -->
              <q-card flat bordered>
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-subtitle1 text-weight-bold text-primary">Unidades y Cronograma</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                  <q-list separator>
                    <q-expansion-item
                      v-for="(unidad, indexU) in planEnRevision_ga.unidades_ga"
                      :key="indexU"
                      icon="view_timeline"
                      :label="`Unidad ${unidad.orden_ga}: ${unidad.nombre_ga}`"
                      :caption="`${unidad.fecha_inicio_ga.slice(0,10)} a ${unidad.fecha_fin_ga.slice(0,10)}`"
                      default-opened
                    >
                      <div class="q-pa-md bg-grey-1">
                        <div class="text-weight-bold q-mb-sm">Indicadores:</div>
                        <ul class="q-pl-md q-my-none">
                          <li v-for="(ind, indexI) in unidad.indicadores_ga" :key="indexI" class="q-mb-xs">
                            {{ ind.descripcion_ga }}
                            <strong v-if="ind.valor_ga != null" class="text-primary"> (Valor: {{ ind.valor_ga }})</strong>
                            <strong v-if="ind.nivel_ga" class="text-primary"> [{{ ind.nivel_ga.etiqueta_ga }}]</strong>
                          </li>
                        </ul>
                      </div>
                    </q-expansion-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <!-- Panel de Decisión -->
            <div class="col-12 col-md-4">
              <q-card flat bordered class="sticky-top" style="top: 16px;">
                <q-card-section class="bg-indigo-1">
                  <div class="text-subtitle1 text-weight-bold text-indigo-9">Dictamen de Coordinación</div>
                </q-card-section>
                <q-separator />
                
                <q-card-section v-if="planEnRevision_ga.estado_ga === 'ENTREGADO'">
                  <div class="q-mb-md text-body2">
                    Revise detalladamente el plan propuesto. Si no cumple con los lineamientos, devuélvalo con observaciones para que el profesor lo corrija.
                  </div>
                  
                  <q-input
                    v-model="formularioRevision_ga.observacion_ga"
                    type="textarea"
                    label="Observaciones (Obligatorio para devolver)"
                    outlined
                    dense
                    rows="4"
                    class="q-mb-md"
                  />

                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <q-btn
                        color="negative"
                        icon="undo"
                        label="Devolver"
                        class="full-width"
                        @click="revisar_ga('DEVUELTO')"
                        :loading="guardando_ga"
                        unelevated
                      />
                    </div>
                    <div class="col-6">
                      <q-btn
                        color="positive"
                        icon="check_circle"
                        label="Aprobar"
                        class="full-width"
                        @click="revisar_ga('APROBADO')"
                        :loading="guardando_ga"
                        unelevated
                      />
                    </div>
                  </div>
                </q-card-section>

                <q-card-section v-else class="text-center">
                  <q-icon
                    :name="planEnRevision_ga.estado_ga === 'APROBADO' ? 'check_circle' : 'error'"
                    :color="planEnRevision_ga.estado_ga === 'APROBADO' ? 'positive' : 'negative'"
                    size="4xl"
                    class="q-mb-md"
                  />
                  <div class="text-h6">
                    Plan {{ planEnRevision_ga.estado_ga }}
                  </div>
                  
                  <!-- Mostrar última revisión si la hay -->
                  <div v-if="planEnRevision_ga.revisiones_ga?.length > 0" class="q-mt-md text-left bg-grey-2 q-pa-sm rounded-borders">
                    <div class="text-caption text-grey">Última acción por: {{ planEnRevision_ga.revisiones_ga[0].revisor_ga.nombre_ahbb }}</div>
                    <div class="text-caption text-grey">{{ new Date(planEnRevision_ga.revisiones_ga[0].creadoEn_ga).toLocaleString() }}</div>
                    <div v-if="planEnRevision_ga.revisiones_ga[0].observacion_ga" class="q-mt-sm text-body2 text-italic">
                      "{{ planEnRevision_ga.revisiones_ga[0].observacion_ga }}"
                    </div>
                  </div>
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
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';
import {
  obtenerBandejaRevision_ga,
  revisarPlan_ga,
  obtenerReporteCumplimiento_ga,
  descargarPlanPdf_ga
} from '../../servicios/planEstudioServicio_ga';

const $q = useQuasar();

const tab_ga = ref('bandeja');
const periodos_ga = ref([]);
const planesBandeja_ga = ref([]);
const reporteData_ga = ref([]);

const cargando_ga = ref(false);
const cargandoReporte_ga = ref(false);
const guardando_ga = ref(false);
const dialogo_ga = ref(false);
const planEnRevision_ga = ref(null);

const filtro_ga = ref({
  id_periodo_ga: null,
  id_periodo_reporte_ga: null,
  estado_ga: 'ENTREGADO',
});

const formularioRevision_ga = ref({
  observacion_ga: '',
});

const columnas_ga = [
  { name: 'materia', label: 'Materia', align: 'left' },
  { name: 'carrera', label: 'Carrera', field: row => row.materia_ga.carrera_cjgp.nombre_cjgp, align: 'left', sortable: true },
  { name: 'profesor', label: 'Profesor', align: 'left', sortable: true },
  { name: 'fecha', label: 'Actualizado', field: row => new Date(row.actualizadoEn_ga).toLocaleDateString(), align: 'center', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado_ga', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' },
];

const columnasReporte_ga = [
  { name: 'carrera', label: 'Carrera', field: 'carrera', align: 'left', sortable: true },
  { name: 'total_materias', label: 'Materias Asignadas', field: 'total_materias', align: 'center' },
  { name: 'aprobados', label: 'Planes Aprobados', field: 'aprobados', align: 'center' },
  { name: 'entregados', label: 'En Revisión', field: 'entregados', align: 'center' },
  { name: 'devueltos', label: 'Devueltos', field: 'devueltos', align: 'center' },
  { name: 'sin_plan', label: 'Sin Entregar / Borrador', field: 'sin_plan', align: 'center' },
  { name: 'progreso', label: '% Aprobación', field: 'porcentaje_aprobados', align: 'left', sortable: true },
];

const planesFiltrados_ga = computed(() => {
  if (filtro_ga.value.estado_ga === 'TODOS') return planesBandeja_ga.value;
  return planesBandeja_ga.value.filter(p => p.estado_ga === filtro_ga.value.estado_ga);
});

const colorEstado_ga = (estado) => {
  switch (estado) {
    case 'APROBADO': return 'positive';
    case 'ENTREGADO': return 'info';
    case 'DEVUELTO': return 'negative';
    default: return 'grey';
  }
};

const cargarInicial_ga = async () => {
  try {
    periodos_ga.value = await obtenerPeriodos_cjgp();
    
    // Seleccionar período activo por defecto
    const activo = periodos_ga.value.find(p => p.estado_cjgp === 'ACTIVO');
    if (activo) {
      filtro_ga.value.id_periodo_ga = activo.id_periodo_cjgp;
      filtro_ga.value.id_periodo_reporte_ga = activo.id_periodo_cjgp;
      await cargarBandeja_ga();
      await cargarReporte_ga();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Error cargando períodos.' });
  }
};

const cargarBandeja_ga = async () => {
  if (!filtro_ga.value.id_periodo_ga) return;
  cargando_ga.value = true;
  try {
    planesBandeja_ga.value = await obtenerBandejaRevision_ga(filtro_ga.value.id_periodo_ga);
  } catch (error) {
    console.error(error);
  } finally {
    cargando_ga.value = false;
  }
};

const cargarReporte_ga = async () => {
  if (!filtro_ga.value.id_periodo_reporte_ga) return;
  cargandoReporte_ga.value = true;
  try {
    const res = await obtenerReporteCumplimiento_ga(filtro_ga.value.id_periodo_reporte_ga);
    reporteData_ga.value = res.filas;
  } catch (error) {
    console.error(error);
  } finally {
    cargandoReporte_ga.value = false;
  }
};

const abrirRevision_ga = (plan) => {
  planEnRevision_ga.value = plan;
  formularioRevision_ga.value.observacion_ga = '';
  dialogo_ga.value = true;
};

const obtenerContenido_ga = (idSeccion) => {
  return planEnRevision_ga.value.contenidos_ga.find(c => c.id_seccion_contenido_ga === idSeccion) || {};
};

const revisar_ga = async (accion) => {
  if (accion === 'DEVUELTO' && !formularioRevision_ga.value.observacion_ga.trim()) {
    return $q.notify({ type: 'warning', message: 'Debe indicar una observación para devolver el plan.' });
  }

  guardando_ga.value = true;
  const res = await revisarPlan_ga(planEnRevision_ga.value.id_plan_estudio_ga, {
    accion_ga: accion,
    observacion_ga: formularioRevision_ga.value.observacion_ga
  });
  guardando_ga.value = false;

  if (res.exito) {
    $q.notify({ type: 'positive', message: res.mensaje });
    dialogo_ga.value = false;
    await cargarBandeja_ga();
    await cargarReporte_ga(); // Actualiza progreso
  } else {
    $q.notify({ type: 'negative', message: res.mensaje });
  }
};

const descargarPdf_ga = async (id) => {
  $q.notify({ type: 'info', message: 'Generando PDF...' });
  await descargarPlanPdf_ga(id);
};

onMounted(cargarInicial_ga);
</script>
