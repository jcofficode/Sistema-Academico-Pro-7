<!--
  ConsultaNotasView_jc.vue — Consulta de notas por carrera y materia.

  Es la vista del ADMINISTRADOR sobre Control de Estudios: puede ver cómo van
  las notas de todos los alumnos, pero **no puede modificarlas ni cerrar actas**.
  Toda la pantalla es de solo lectura; las acciones de escritura corresponden al
  profesor de la materia y al personal de Control de Estudios.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { consultarNotas_jc } from '../../servicios/controlEstudiosServicio_jc';
import {
  obtenerPeriodos_cjgp,
  obtenerCarreras_cjgp,
} from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();

const periodos_jc = ref([]);
const carreras_jc = ref([]);
const periodoSeleccionado_jc = ref(null);
const carreraSeleccionada_jc = ref(null);
const datos_jc = ref(null);
const cargando_jc = ref(false);
const materiaExpandida_jc = ref(null);

/** Totales agregados de lo que se está consultando. */
const totales_jc = computed(() => {
  const materias_jc = datos_jc.value?.materias ?? [];
  return {
    materias: materias_jc.length,
    alumnos: materias_jc.reduce((suma_jc, materia_jc) => suma_jc + materia_jc.totalAlumnos_jc, 0),
    aprobando: materias_jc.reduce((suma_jc, materia_jc) => suma_jc + materia_jc.aprobando_jc, 0),
    enRiesgo: materias_jc.reduce((suma_jc, materia_jc) => suma_jc + materia_jc.enRiesgo_jc, 0),
    sobresalientes: materias_jc.reduce(
      (suma_jc, materia_jc) => suma_jc + materia_jc.sobresalientes_jc,
      0,
    ),
  };
});

const consultar_jc = async () => {
  if (!periodoSeleccionado_jc.value) return;
  cargando_jc.value = true;
  materiaExpandida_jc.value = null;
  try {
    datos_jc.value = await consultarNotas_jc(
      periodoSeleccionado_jc.value.id_periodo_cjgp,
      carreraSeleccionada_jc.value
        ? { idCarrera: carreraSeleccionada_jc.value.id_carrera_cjgp }
        : {},
    );
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo consultar la información de notas.' });
  } finally {
    cargando_jc.value = false;
  }
};

onMounted(async () => {
  try {
    [periodos_jc.value, carreras_jc.value] = await Promise.all([
      obtenerPeriodos_cjgp(),
      obtenerCarreras_cjgp(),
    ]);
    periodoSeleccionado_jc.value =
      periodos_jc.value.find((periodo_jc) => periodo_jc.activo_cjgp) ??
      periodos_jc.value[0] ??
      null;
    consultar_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los períodos y carreras.' });
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Consulta de Notas</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Cómo van las notas de todos los alumnos, por carrera y materia — Control de Estudios (JC)
    </div>

    <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md">
      <template #avatar><q-icon name="visibility" /></template>
      Vista de <strong>solo lectura</strong>. La carga de notas, las reparaciones y el cierre de
      actas corresponden al profesor de la materia y al personal de Control de Estudios.
    </q-banner>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="periodoSeleccionado_jc"
          :options="periodos_jc"
          option-label="nombre_cjgp"
          label="Período académico"
          outlined
          dense
          @update:model-value="consultar_jc"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="carreraSeleccionada_jc"
          :options="carreras_jc"
          option-label="nombre_cjgp"
          label="Carrera (todas si se deja vacío)"
          outlined
          dense
          clearable
          @update:model-value="consultar_jc"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-btn
          color="primary"
          icon="search"
          label="Consultar"
          :loading="cargando_jc"
          @click="consultar_jc"
        />
      </div>
    </div>

    <!-- Totales -->
    <div v-if="datos_jc" class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="q-py-sm text-center">
            <div class="text-h6 text-weight-bold">{{ totales_jc.materias }}</div>
            <div class="text-caption text-grey-7">materias</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="q-py-sm text-center">
            <div class="text-h6 text-weight-bold">{{ totales_jc.alumnos }}</div>
            <div class="text-caption text-grey-7">alumnos cursando</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="bg-green-1">
          <q-card-section class="q-py-sm text-center">
            <div class="text-h6 text-weight-bold text-green-9">{{ totales_jc.aprobando }}</div>
            <div class="text-caption text-green-9">aprobando</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section class="q-py-sm text-center">
            <div class="text-h6 text-weight-bold text-orange-9">{{ totales_jc.enRiesgo }}</div>
            <div class="text-caption text-orange-9">en riesgo</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-inner-loading :showing="cargando_jc" label="Consultando notas..." />

    <!-- Una tarjeta expandible por materia -->
    <q-card
      v-for="materia_jc in datos_jc?.materias ?? []"
      :key="materia_jc.materia_jc.id_materia_cjgp"
      flat
      bordered
      class="q-mb-sm"
    >
      <q-expansion-item
        :model-value="materiaExpandida_jc === materia_jc.materia_jc.id_materia_cjgp"
        @update:model-value="
          (abierto_jc) =>
            (materiaExpandida_jc = abierto_jc ? materia_jc.materia_jc.id_materia_cjgp : null)
        "
      >
        <template #header>
          <q-item-section avatar>
            <q-avatar color="blue-grey-2" text-color="blue-grey-9" icon="menu_book" size="36px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">
              {{ materia_jc.materia_jc.codigo_cjgp }} — {{ materia_jc.materia_jc.nombre_cjgp }}
            </q-item-label>
            <q-item-label caption>
              {{ materia_jc.materia_jc.carrera_cjgp.nombre_cjgp }} ·
              {{
                materia_jc.materia_jc.profesor_cjgp
                  ? `Prof. ${materia_jc.materia_jc.profesor_cjgp.nombre_ahbb} ${materia_jc.materia_jc.profesor_cjgp.apellido_ahbb}`
                  : 'sin profesor asignado'
              }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-chip dense size="sm" color="grey-3" text-color="grey-9">
                {{ materia_jc.totalAlumnos_jc }} alumnos
              </q-chip>
              <q-chip dense size="sm" color="green-1" text-color="green-9">
                {{ materia_jc.aprobando_jc }} aprobando
              </q-chip>
              <q-chip dense size="sm" color="orange-1" text-color="orange-9">
                {{ materia_jc.enRiesgo_jc }} en riesgo
              </q-chip>
              <q-chip
                v-if="materia_jc.sobresalientes_jc"
                dense
                size="sm"
                color="amber-1"
                text-color="brown-9"
                icon="military_tech"
              >
                {{ materia_jc.sobresalientes_jc }}
              </q-chip>
              <q-chip v-if="materia_jc.promedio_jc !== null" dense size="sm" color="blue-1" text-color="blue-9">
                Prom. {{ materia_jc.promedio_jc }}
              </q-chip>
            </div>
          </q-item-section>
        </template>

        <q-card-section v-if="materia_jc.sinPlan_jc" class="text-caption text-orange-9">
          Esta materia no tiene un plan de evaluación publicado para el período, por lo que
          todavía no hay notas que consultar.
        </q-card-section>

        <q-card-section v-else class="q-pt-none">
          <q-markup-table flat dense>
            <thead>
              <tr class="bg-grey-2">
                <th class="text-left">Cédula</th>
                <th class="text-left">Apellidos y Nombres</th>
                <th
                  v-for="item_jc in materia_jc.plan_jc.items_jc"
                  :key="item_jc.id_item_jc"
                  class="text-center"
                >
                  {{ item_jc.nombre_jc }}<br />
                  <span class="text-caption text-grey-7">{{ Number(item_jc.peso_jc) }}%</span>
                </th>
                <th class="text-center">Definitiva</th>
                <th class="text-center">Condición</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila_jc in materia_jc.filas_jc" :key="fila_jc.id_inscripcion_materia_jc">
                <td>{{ fila_jc.alumno_jc.cedula_ahbb }}</td>
                <td>{{ fila_jc.alumno_jc.apellido_ahbb }}, {{ fila_jc.alumno_jc.nombre_ahbb }}</td>
                <td
                  v-for="item_jc in materia_jc.plan_jc.items_jc"
                  :key="item_jc.id_item_jc"
                  class="text-center"
                >
                  {{ fila_jc.notas_jc[item_jc.id_item_jc] ?? '—' }}
                  <q-chip
                    v-if="fila_jc.reparaciones_jc.some((r_jc) => r_jc.id_item_jc === item_jc.id_item_jc)"
                    dense
                    size="sm"
                    color="blue-1"
                    text-color="blue-9"
                  >
                    R:
                    {{
                      fila_jc.reparaciones_jc.find((r_jc) => r_jc.id_item_jc === item_jc.id_item_jc)
                        .valor_jc
                    }}
                  </q-chip>
                </td>
                <td class="text-center text-weight-bold">
                  {{ fila_jc.definitiva_jc }}
                  <q-icon v-if="fila_jc.sobresaliente_jc" name="military_tech" color="amber-8" size="16px" />
                </td>
                <td class="text-center">
                  <q-chip
                    dense
                    size="sm"
                    :color="fila_jc.aprobado_jc ? 'green-1' : 'orange-1'"
                    :text-color="fila_jc.aprobado_jc ? 'green-9' : 'orange-9'"
                  >
                    {{
                      fila_jc.estatus_jc === 'INSCRITO'
                        ? fila_jc.aprobado_jc
                          ? 'Aprobando'
                          : 'En riesgo'
                        : fila_jc.estatus_jc
                    }}
                  </q-chip>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-expansion-item>
    </q-card>

    <div
      v-if="datos_jc && !datos_jc.materias.length && !cargando_jc"
      class="text-center text-grey-6 q-pa-xl"
    >
      No hay materias con alumnos inscritos para ese período y carrera.
    </div>
  </q-page>
</template>
