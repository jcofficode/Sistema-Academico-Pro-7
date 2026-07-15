<!--
  PlanesEvaluacionView_jc.vue — Admin UI del Esquema de Evaluación Parametrizado.

  La coordinación define aquí cuántas evaluaciones hay, sus nombres, pesos y
  condiciones (ej. "Reparación"). El resto del sistema (matriz del docente,
  cálculo de definitivas y actas) se genera a partir de esta configuración,
  sin intervención del programador (Desarrollo Basado en Metadatos).
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerPlanes_jc,
  crearPlan_jc,
  actualizarPlan_jc,
  publicarPlan_jc,
  eliminarPlan_jc,
} from '../../servicios/controlEstudiosServicio_jc';
import {
  obtenerPeriodos_cjgp,
  obtenerCarreras_cjgp,
} from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();

const planes_jc = ref([]);
const periodos_jc = ref([]);
const carreras_jc = ref([]);
const cargando_jc = ref(true);
const dialogoPlan_jc = ref(false);
const guardando_jc = ref(false);
const planEnEdicion_jc = ref(null); // null = creación

const formulario_jc = ref({
  nombre_jc: '',
  id_periodo_jc: null,
  id_carrera_jc: null,
  notaMaxima_jc: 20,
  notaAprobatoria_jc: 10,
  items_jc: [],
});

// La suma de pesos regulares debe dar 100% (validación en vivo)
const sumaPesos_jc = computed(() =>
  formulario_jc.value.items_jc
    .filter((item_jc) => !item_jc.esRecuperacion_jc)
    .reduce((suma_jc, item_jc) => suma_jc + Number(item_jc.peso_jc || 0), 0),
);
const pesosValidos_jc = computed(() => Math.abs(sumaPesos_jc.value - 100) < 0.01);

const abrirCreacion_jc = () => {
  planEnEdicion_jc.value = null;
  formulario_jc.value = {
    nombre_jc: '',
    id_periodo_jc: null,
    id_carrera_jc: null,
    notaMaxima_jc: 20,
    notaAprobatoria_jc: 10,
    items_jc: [
      { nombre_jc: 'Corte 1', orden_jc: 1, peso_jc: 25, esRecuperacion_jc: false },
      { nombre_jc: 'Corte 2', orden_jc: 2, peso_jc: 25, esRecuperacion_jc: false },
      { nombre_jc: 'Corte 3', orden_jc: 3, peso_jc: 25, esRecuperacion_jc: false },
      { nombre_jc: 'Corte 4', orden_jc: 4, peso_jc: 25, esRecuperacion_jc: false },
    ],
  };
  dialogoPlan_jc.value = true;
};

const abrirEdicion_jc = (plan_jc) => {
  planEnEdicion_jc.value = plan_jc;
  formulario_jc.value = {
    nombre_jc: plan_jc.nombre_jc,
    id_periodo_jc: plan_jc.id_periodo_plan_jc,
    id_carrera_jc: plan_jc.id_carrera_plan_jc,
    notaMaxima_jc: Number(plan_jc.notaMaxima_jc),
    notaAprobatoria_jc: Number(plan_jc.notaAprobatoria_jc),
    items_jc: plan_jc.items_jc.map((item_jc) => ({
      nombre_jc: item_jc.nombre_jc,
      orden_jc: item_jc.orden_jc,
      peso_jc: Number(item_jc.peso_jc),
      esRecuperacion_jc: item_jc.esRecuperacion_jc,
    })),
  };
  dialogoPlan_jc.value = true;
};

const agregarItem_jc = () => {
  formulario_jc.value.items_jc.push({
    nombre_jc: '',
    orden_jc: formulario_jc.value.items_jc.length + 1,
    peso_jc: 0,
    esRecuperacion_jc: false,
  });
};

const quitarItem_jc = (indice_jc) => {
  formulario_jc.value.items_jc.splice(indice_jc, 1);
  formulario_jc.value.items_jc.forEach((item_jc, posicion_jc) => {
    item_jc.orden_jc = posicion_jc + 1;
  });
};

const cargar_jc = async () => {
  cargando_jc.value = true;
  try {
    [planes_jc.value, periodos_jc.value, carreras_jc.value] = await Promise.all([
      obtenerPlanes_jc(),
      obtenerPeriodos_cjgp(),
      obtenerCarreras_cjgp(),
    ]);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los planes.' });
  } finally {
    cargando_jc.value = false;
  }
};

const guardar_jc = async () => {
  if (!formulario_jc.value.nombre_jc.trim() || !formulario_jc.value.id_periodo_jc) {
    $q.notify({ type: 'warning', message: 'Indica el nombre y el período del plan.' });
    return;
  }
  if (!pesosValidos_jc.value) {
    $q.notify({
      type: 'warning',
      message: `Los pesos regulares suman ${sumaPesos_jc.value}%: deben sumar exactamente 100%.`,
    });
    return;
  }

  guardando_jc.value = true;
  const carga_jc = {
    ...formulario_jc.value,
    id_carrera_jc: formulario_jc.value.id_carrera_jc ?? undefined,
    notaMaxima_jc: Number(formulario_jc.value.notaMaxima_jc),
    notaAprobatoria_jc: Number(formulario_jc.value.notaAprobatoria_jc),
    items_jc: formulario_jc.value.items_jc.map((item_jc) => ({
      ...item_jc,
      peso_jc: Number(item_jc.peso_jc),
      orden_jc: Number(item_jc.orden_jc),
    })),
  };
  const resultado_jc = planEnEdicion_jc.value
    ? await actualizarPlan_jc(planEnEdicion_jc.value.id_plan_jc, carga_jc)
    : await crearPlan_jc(carga_jc);
  guardando_jc.value = false;

  $q.notify({ type: resultado_jc.exito ? 'positive' : 'negative', message: resultado_jc.mensaje });
  if (resultado_jc.exito) {
    dialogoPlan_jc.value = false;
    cargar_jc();
  }
};

const publicar_jc = async (plan_jc) => {
  const resultado_jc = await publicarPlan_jc(plan_jc.id_plan_jc);
  $q.notify({ type: resultado_jc.exito ? 'positive' : 'negative', message: resultado_jc.mensaje });
  if (resultado_jc.exito) cargar_jc();
};

const eliminar_jc = (plan_jc) => {
  $q.dialog({
    title: 'Eliminar plan',
    message: `¿Eliminar el plan "${plan_jc.nombre_jc}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    const resultado_jc = await eliminarPlan_jc(plan_jc.id_plan_jc);
    $q.notify({ type: resultado_jc.exito ? 'positive' : 'negative', message: resultado_jc.mensaje });
    if (resultado_jc.exito) cargar_jc();
  });
};

onMounted(cargar_jc);
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Planes de Evaluación</div>
        <div class="text-caption text-grey-7">
          Estructura institucional de notas por período — módulo Control de Estudios (JC)
        </div>
      </div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nuevo plan" @click="abrirCreacion_jc" />
    </div>

    <q-inner-loading :showing="cargando_jc" />

    <div class="row q-col-gutter-md">
      <div v-for="plan_jc in planes_jc" :key="plan_jc.id_plan_jc" class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered>
          <q-card-section class="q-pb-none">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-subtitle1 text-weight-bold">{{ plan_jc.nombre_jc }}</div>
                <div class="text-caption text-grey-7">
                  {{ plan_jc.periodo_jc?.nombre_cjgp }} ·
                  {{ plan_jc.carrera_jc?.nombre_cjgp ?? 'Institucional (todas las carreras)' }}
                </div>
              </div>
              <q-chip
                dense
                :color="plan_jc.estado_jc === 'PUBLICADO' ? 'green-1' : 'orange-1'"
                :text-color="plan_jc.estado_jc === 'PUBLICADO' ? 'green-9' : 'orange-9'"
              >
                {{ plan_jc.estado_jc }}
              </q-chip>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-caption q-mb-xs">
              Escala 0–{{ Number(plan_jc.notaMaxima_jc) }} · Aprobatoria
              {{ Number(plan_jc.notaAprobatoria_jc) }}
            </div>
            <q-chip
              v-for="item_jc in plan_jc.items_jc"
              :key="item_jc.id_item_jc"
              dense
              size="sm"
              :color="item_jc.esRecuperacion_jc ? 'deep-orange-1' : 'blue-1'"
              :text-color="item_jc.esRecuperacion_jc ? 'deep-orange-9' : 'blue-9'"
            >
              {{ item_jc.nombre_jc }}
              {{ item_jc.esRecuperacion_jc ? '(condición)' : `${Number(item_jc.peso_jc)}%` }}
            </q-chip>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              v-if="plan_jc.estado_jc !== 'PUBLICADO'"
              flat
              dense
              color="positive"
              icon="publish"
              label="Publicar"
              @click="publicar_jc(plan_jc)"
            />
            <q-btn flat round dense color="primary" icon="edit" @click="abrirEdicion_jc(plan_jc)" />
            <q-btn flat round dense color="negative" icon="delete" @click="eliminar_jc(plan_jc)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-if="!planes_jc.length && !cargando_jc" class="text-center text-grey-6 q-pa-xl">
      No hay planes configurados. Crea el primero para habilitar la carga de notas.
    </div>

    <!-- Diálogo de creación/edición con ítems dinámicos -->
    <q-dialog v-model="dialogoPlan_jc" persistent>
      <q-card style="min-width: 640px; max-width: 90vw">
        <q-card-section class="text-h6">
          {{ planEnEdicion_jc ? 'Editar plan de evaluación' : 'Nuevo plan de evaluación' }}
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input v-model="formulario_jc.nombre_jc" label="Nombre del plan *" outlined dense />
            </div>
            <div class="col-6 col-md-3">
              <q-select
                v-model="formulario_jc.id_periodo_jc"
                :options="periodos_jc"
                option-label="nombre_cjgp"
                option-value="id_periodo_cjgp"
                emit-value
                map-options
                label="Período *"
                outlined
                dense
                :disable="!!planEnEdicion_jc"
              />
            </div>
            <div class="col-6 col-md-3">
              <q-select
                v-model="formulario_jc.id_carrera_jc"
                :options="carreras_jc"
                option-label="nombre_cjgp"
                option-value="id_carrera_cjgp"
                emit-value
                map-options
                clearable
                label="Carrera (vacío = institucional)"
                outlined
                dense
                :disable="!!planEnEdicion_jc"
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model.number="formulario_jc.notaMaxima_jc" type="number" label="Nota máxima" outlined dense />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model.number="formulario_jc.notaAprobatoria_jc" type="number" label="Nota aprobatoria" outlined dense />
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row items-center">
            <div class="text-subtitle2 text-weight-bold">Evaluaciones del plan</div>
            <q-space />
            <q-chip dense :color="pesosValidos_jc ? 'green-1' : 'red-1'" :text-color="pesosValidos_jc ? 'green-9' : 'red-9'">
              Σ pesos regulares: {{ sumaPesos_jc }}%
            </q-chip>
            <q-btn flat dense color="primary" icon="add" label="Agregar" @click="agregarItem_jc" />
          </div>

          <div
            v-for="(item_jc, indice_jc) in formulario_jc.items_jc"
            :key="indice_jc"
            class="row q-col-gutter-xs items-center q-mb-xs"
          >
            <div class="col-1"><q-input v-model.number="item_jc.orden_jc" type="number" dense outlined label="#" /></div>
            <div class="col-5"><q-input v-model="item_jc.nombre_jc" dense outlined label="Nombre (ej. Corte 1, Módulo A)" /></div>
            <div class="col-2">
              <q-input v-model.number="item_jc.peso_jc" type="number" dense outlined label="Peso %" :disable="item_jc.esRecuperacion_jc" />
            </div>
            <div class="col-3">
              <q-toggle v-model="item_jc.esRecuperacion_jc" dense label="Reparación" @update:model-value="item_jc.esRecuperacion_jc && (item_jc.peso_jc = 0)" />
            </div>
            <div class="col-1">
              <q-btn flat round dense size="sm" color="negative" icon="close" @click="quitarItem_jc(indice_jc)" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" :loading="guardando_jc" @click="guardar_jc" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
