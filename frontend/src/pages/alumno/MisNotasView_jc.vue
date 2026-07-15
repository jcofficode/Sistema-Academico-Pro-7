<!--
  MisNotasView_jc.vue — Notas de las materias EN CURSO (Control de Estudios).

  El alumno consulta las calificaciones de las materias que está cursando
  ACTUALMENTE, con el desglose exacto del plan de evaluación vigente
  (metadatos): cada corte con su peso, la nota obtenida, la definitiva parcial
  y si va aprobando o no. Se refresca AUTOMÁTICAMENTE cada pocos segundos:
  cuando el profesor sube una nota, el alumno la ve sin recargar la página.
  Las materias ya culminadas se consultan en "Historial de Carrera".
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';
import { obtenerMisNotas_jc } from '../../servicios/controlEstudiosServicio_jc';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();

const periodos_jc = ref([]);
const periodoSeleccionado_jc = ref(null);
const datos_jc = ref(null);
const cargando_jc = ref(false);
const ultimaActualizacion_jc = ref(null);

/**
 * Carga las notas. En modo silencioso (auto-refresh) no muestra el spinner:
 * la tabla simplemente se actualiza con lo último que cargó el profesor.
 */
const cargarNotas_jc = async (silencioso_jc = false) => {
  if (!periodoSeleccionado_jc.value) return;
  if (!silencioso_jc) cargando_jc.value = true;
  try {
    datos_jc.value = await obtenerMisNotas_jc(
      periodoSeleccionado_jc.value.id_periodo_cjgp,
    );
    ultimaActualizacion_jc.value = new Date();
  } catch {
    if (!silencioso_jc) {
      datos_jc.value = null;
      $q.notify({ type: 'negative', message: 'No se pudieron cargar tus notas.' });
    }
  } finally {
    if (!silencioso_jc) cargando_jc.value = false;
  }
};

// ⏱ Tiempo real: polling cada 10 segundos con el composable del proyecto.
// Cuando el profesor guarda una nota, el alumno la ve aparecer sola.
useAutoRefresh_ahbb(() => cargarNotas_jc(true), 10_000, false);

onMounted(async () => {
  try {
    periodos_jc.value = await obtenerPeriodos_cjgp();
    periodoSeleccionado_jc.value =
      periodos_jc.value.find((periodo_jc) => periodo_jc.activo_cjgp) ??
      periodos_jc.value[0] ??
      null;
    cargarNotas_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los períodos.' });
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Mis Notas — Materias en Curso</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Calificaciones de lo que cursas actualmente, según el plan de evaluación de cada materia.
      Las materias culminadas están en <strong>Historial de Carrera</strong>.
    </div>

    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="periodoSeleccionado_jc"
          :options="periodos_jc"
          option-label="nombre_cjgp"
          label="Período académico"
          outlined
          dense
          @update:model-value="cargarNotas_jc()"
        />
      </div>
      <div class="col-auto">
        <q-chip dense color="teal-1" text-color="teal-9" icon="autorenew">
          Actualización automática cada 10 s
          <template v-if="ultimaActualizacion_jc">
            · última: {{ ultimaActualizacion_jc.toLocaleTimeString('es-VE') }}
          </template>
        </q-chip>
      </div>
    </div>

    <!-- Identidad del alumno (viene del servidor vía JWT: nadie puede ver notas ajenas) -->
    <q-card v-if="datos_jc" flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" icon="grading" />
        </div>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            {{ datos_jc.alumno.apellido_ahbb }}, {{ datos_jc.alumno.nombre_ahbb }}
          </div>
          <div class="text-caption text-grey-8">
            Cédula: {{ datos_jc.alumno.cedula_ahbb }} · Alumno ·
            Período consultado: <strong>{{ datos_jc.periodo.nombre_cjgp }}</strong>
            <q-chip v-if="datos_jc.periodo.activo_cjgp" dense size="sm" color="green" text-color="white">ACTIVO</q-chip>
          </div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-primary">{{ datos_jc.materias.length }}</div>
          <div class="text-caption">materias en curso</div>
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_jc" />

    <div v-if="datos_jc && !cargando_jc" class="row q-col-gutter-md">
      <div
        v-for="materia_jc in datos_jc.materias"
        :key="materia_jc.id_inscripcion_materia_jc"
        class="col-12 col-md-6"
      >
        <q-card flat bordered>
          <q-card-section class="q-pb-sm">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-subtitle2 text-weight-bold">
                  {{ materia_jc.materia_jc.codigo_cjgp }} — {{ materia_jc.materia_jc.nombre_cjgp }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ materia_jc.materia_jc.carrera_cjgp.nombre_cjgp }} ·
                  {{ materia_jc.materia_jc.carrera_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
                  {{ materia_jc.materia_jc.nroBloque_cjgp }} ·
                  {{ materia_jc.materia_jc.creditos_cjgp }} créditos
                </div>
                <div class="text-caption text-grey-7">
                  👨‍🏫
                  {{
                    materia_jc.materia_jc.profesor_cjgp
                      ? `Prof. ${materia_jc.materia_jc.profesor_cjgp.nombre_ahbb} ${materia_jc.materia_jc.profesor_cjgp.apellido_ahbb}`
                      : 'Profesor por asignar'
                  }}
                </div>
              </div>
              <!-- ¿Va aprobando con lo cargado hasta ahora? -->
              <q-chip
                v-if="materia_jc.plan_jc"
                dense
                :color="materia_jc.definitivaParcial_jc >= Number(materia_jc.plan_jc.notaAprobatoria_jc) ? 'green-1' : 'orange-1'"
                :text-color="materia_jc.definitivaParcial_jc >= Number(materia_jc.plan_jc.notaAprobatoria_jc) ? 'green-9' : 'orange-9'"
                :icon="materia_jc.definitivaParcial_jc >= Number(materia_jc.plan_jc.notaAprobatoria_jc) ? 'trending_up' : 'trending_down'"
              >
                {{ materia_jc.definitivaParcial_jc >= Number(materia_jc.plan_jc.notaAprobatoria_jc) ? 'VAS APROBANDO' : 'EN RIESGO' }}
              </q-chip>
            </div>
          </q-card-section>

          <template v-if="materia_jc.plan_jc">
            <q-separator />
            <q-card-section class="q-pt-sm">
              <div class="text-caption text-grey-7 q-mb-xs">
                Plan: {{ materia_jc.plan_jc.nombre_jc }} · Escala 0–{{ Number(materia_jc.plan_jc.notaMaxima_jc) }} ·
                Aprobatoria {{ Number(materia_jc.plan_jc.notaAprobatoria_jc) }}
              </div>
              <q-markup-table flat dense>
                <thead>
                  <tr class="bg-grey-2">
                    <th class="text-left">Evaluación</th>
                    <th class="text-center">Peso</th>
                    <th class="text-center">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item_jc in materia_jc.plan_jc.items_jc" :key="item_jc.id_item_jc">
                    <td>{{ item_jc.nombre_jc }}</td>
                    <td class="text-center text-caption">
                      {{ item_jc.esRecuperacion_jc ? 'Condición' : `${Number(item_jc.peso_jc)}%` }}
                    </td>
                    <td class="text-center text-weight-bold">
                      {{ item_jc.valor_jc !== null ? item_jc.valor_jc : '—' }}
                    </td>
                  </tr>
                  <tr class="bg-blue-grey-1">
                    <td class="text-weight-bold">Definitiva parcial</td>
                    <td></td>
                    <td class="text-center text-weight-bold text-primary">
                      {{ materia_jc.definitivaParcial_jc ?? '—' }}
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </template>

          <q-card-section v-else class="text-caption text-grey-6">
            La coordinación aún no ha publicado el plan de evaluación de este período.
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div
      v-if="datos_jc && !datos_jc.materias.length && !cargando_jc"
      class="text-center text-grey-6 q-pa-xl"
    >
      No estás cursando materias en el período seleccionado.<br />
      Ve a <strong>Inscripción de Materias</strong> para inscribir las de este período,
      o revisa tu <strong>Historial de Carrera</strong> para ver las culminadas.
    </div>
  </q-page>
</template>
