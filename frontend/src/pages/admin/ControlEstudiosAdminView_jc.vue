<!--
  ControlEstudiosAdminView_jc.vue — Consola administrativa de Control de Estudios.

  Pestañas:
   1. Carga Masiva CSV (ETL en dos fases: validar → confirmar, con plantillas).
   2. Reporte de Rendimiento (calculado con TABLA TEMPORAL en PostgreSQL).
   3. Registro de Actas emitidas (auditoría con hash SHA-256).
   4. Diccionario de Datos (metadatos vía information_schema).
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  validarCsv_jc,
  confirmarCsv_jc,
  obtenerReporteRendimiento_jc,
  obtenerRegistroActas_jc,
  obtenerMetadatos_jc,
} from '../../servicios/controlEstudiosServicio_jc';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const pestana_jc = ref('csv');

// ─── Pestaña 1: Carga masiva CSV ──────────────────────────────
const ENTIDADES_JC = [
  { valor: 'carreras', etiqueta: 'Carreras', plantilla: '/plantillas/plantilla_carreras_jc.csv' },
  { valor: 'materias', etiqueta: 'Materias (con prelaciones)', plantilla: '/plantillas/plantilla_materias_jc.csv' },
  { valor: 'planes-evaluacion', etiqueta: 'Planes de evaluación', plantilla: '/plantillas/plantilla_planes_evaluacion_jc.csv' },
  { valor: 'calificaciones', etiqueta: 'Calificaciones (volcado de notas)', plantilla: '/plantillas/plantilla_calificaciones_jc.csv' },
];

const entidadSeleccionada_jc = ref(ENTIDADES_JC[0]);
const archivoCsv_jc = ref(null);
const resultadoEtl_jc = ref(null);
const procesandoCsv_jc = ref(false);
const faseValidada_jc = ref(false);

const ejecutarEtl_jc = async (fase_jc) => {
  if (!archivoCsv_jc.value) {
    $q.notify({ type: 'warning', message: 'Selecciona un archivo CSV primero.' });
    return;
  }
  procesandoCsv_jc.value = true;
  const servicio_jc = fase_jc === 'validar' ? validarCsv_jc : confirmarCsv_jc;
  resultadoEtl_jc.value = await servicio_jc(
    entidadSeleccionada_jc.value.valor,
    archivoCsv_jc.value,
  );
  procesandoCsv_jc.value = false;

  if (fase_jc === 'validar') {
    faseValidada_jc.value = resultadoEtl_jc.value.exito;
    $q.notify({
      type: resultadoEtl_jc.value.exito ? 'positive' : 'warning',
      message: resultadoEtl_jc.value.exito
        ? `Validación exitosa: ${resultadoEtl_jc.value.totalFilas} filas listas para confirmar.`
        : `La validación encontró ${resultadoEtl_jc.value.errores.length} error(es).`,
    });
  } else {
    $q.notify({
      type: resultadoEtl_jc.value.exito ? 'positive' : 'negative',
      message: resultadoEtl_jc.value.exito
        ? `✅ Carga confirmada: ${resultadoEtl_jc.value.procesadas} registro(s) procesados.`
        : 'La carga no pudo completarse. Revisa los errores.',
    });
    if (resultadoEtl_jc.value.exito) {
      archivoCsv_jc.value = null;
      faseValidada_jc.value = false;
    }
  }
};

// ─── Pestaña 2: Reporte de rendimiento (tabla temporal) ───────
const periodos_jc = ref([]);
const periodoReporte_jc = ref(null);
const reporte_jc = ref(null);
const cargandoReporte_jc = ref(false);

const columnasReporte_jc = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'materia', label: 'Materia', field: 'materia', align: 'left', sortable: true },
  { name: 'carrera', label: 'Carrera', field: 'carrera', align: 'left' },
  { name: 'inscritos', label: 'Inscritos', field: 'inscritos', align: 'center' },
  { name: 'aprobados', label: 'Aprobados', field: 'aprobados', align: 'center' },
  { name: 'reprobados', label: 'Reprobados', field: 'reprobados', align: 'center' },
  { name: 'en_curso', label: 'En curso', field: 'en_curso', align: 'center' },
  { name: 'promedio', label: 'Promedio', field: 'promedio', align: 'center' },
  { name: 'porcentaje', label: '% Aprobación', field: 'porcentaje_aprobacion', align: 'center' },
];

// Petición asíncrona (Axios): genera el reporte sin recargar la página
const generarReporte_jc = async () => {
  if (!periodoReporte_jc.value) return;
  cargandoReporte_jc.value = true;
  try {
    reporte_jc.value = await obtenerReporteRendimiento_jc(
      periodoReporte_jc.value.id_periodo_cjgp,
    );
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo generar el reporte.' });
  } finally {
    cargandoReporte_jc.value = false;
  }
};

// ─── Pestaña 3: Registro de actas ─────────────────────────────
const actas_jc = ref([]);
const cargandoActas_jc = ref(false);

const cargarActas_jc = async () => {
  cargandoActas_jc.value = true;
  try {
    actas_jc.value = await obtenerRegistroActas_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el registro de actas.' });
  } finally {
    cargandoActas_jc.value = false;
  }
};

// ─── Pestaña 4: Diccionario de datos (information_schema) ─────
const metadatos_jc = ref(null);
const cargandoMetadatos_jc = ref(false);

const cargarMetadatos_jc = async () => {
  cargandoMetadatos_jc.value = true;
  try {
    metadatos_jc.value = await obtenerMetadatos_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron consultar los metadatos.' });
  } finally {
    cargandoMetadatos_jc.value = false;
  }
};

onMounted(async () => {
  try {
    periodos_jc.value = await obtenerPeriodos_cjgp();
    periodoReporte_jc.value =
      periodos_jc.value.find((periodo_jc) => periodo_jc.activo_cjgp) ?? periodos_jc.value[0] ?? null;
  } catch {
    // El selector simplemente quedará vacío
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Control de Estudios — Consola</div>
    <div class="text-caption text-grey-7 q-mb-md">
      ETL/CSV, reportes con tablas temporales, actas y metadatos (módulo JC)
    </div>

    <q-tabs v-model="pestana_jc" dense align="left" class="text-grey-7" active-color="primary" indicator-color="primary">
      <q-tab name="csv" icon="upload_file" label="Carga Masiva CSV" />
      <q-tab name="reporte" icon="query_stats" label="Reporte de Rendimiento" @click="generarReporte_jc" />
      <q-tab name="actas" icon="history_edu" label="Registro de Actas" @click="cargarActas_jc" />
      <q-tab name="metadatos" icon="schema" label="Diccionario de Datos" @click="cargarMetadatos_jc" />
    </q-tabs>
    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="pestana_jc" animated>
      <!-- ════════ Carga Masiva CSV ════════ -->
      <q-tab-panel name="csv" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-5">
            <q-card flat bordered class="q-pa-md">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">1. Selecciona entidad y archivo</div>
              <q-select
                v-model="entidadSeleccionada_jc"
                :options="ENTIDADES_JC"
                option-label="etiqueta"
                label="Entidad a poblar"
                outlined
                dense
                class="q-mb-sm"
                @update:model-value="resultadoEtl_jc = null; faseValidada_jc = false"
              />
              <q-file v-model="archivoCsv_jc" label="Archivo CSV" outlined dense accept=".csv,.txt" clearable @update:model-value="faseValidada_jc = false">
                <template #prepend><q-icon name="attach_file" /></template>
              </q-file>
              <a :href="entidadSeleccionada_jc.plantilla" download class="text-primary text-caption">
                <q-icon name="download" size="xs" /> Descargar plantilla de ejemplo
              </a>

              <q-separator class="q-my-md" />

              <div class="text-subtitle2 text-weight-bold q-mb-sm">2. Valida y confirma</div>
              <div class="row q-gutter-sm">
                <q-btn
                  color="secondary"
                  icon="fact_check"
                  label="Validar (sin escribir)"
                  :loading="procesandoCsv_jc"
                  @click="ejecutarEtl_jc('validar')"
                />
                <q-btn
                  color="positive"
                  icon="cloud_upload"
                  label="Confirmar carga"
                  :disable="!faseValidada_jc"
                  :loading="procesandoCsv_jc"
                  @click="ejecutarEtl_jc('confirmar')"
                />
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                El botón de confirmación se habilita cuando la validación pasa sin errores.
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-7">
            <q-card v-if="resultadoEtl_jc" flat bordered class="q-pa-md">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Resultado del proceso ETL</div>
              <div class="row q-gutter-md q-mb-sm text-center">
                <div>
                  <div class="text-h6">{{ resultadoEtl_jc.totalFilas }}</div>
                  <div class="text-caption">Filas leídas</div>
                </div>
                <div>
                  <div class="text-h6 text-positive">{{ resultadoEtl_jc.procesadas }}</div>
                  <div class="text-caption">Procesadas</div>
                </div>
                <div>
                  <div class="text-h6 text-negative">{{ resultadoEtl_jc.errores.length }}</div>
                  <div class="text-caption">Errores</div>
                </div>
                <div>
                  <div class="text-h6 text-warning">{{ resultadoEtl_jc.advertencias.length }}</div>
                  <div class="text-caption">Advertencias</div>
                </div>
              </div>
              <q-list v-if="resultadoEtl_jc.errores.length" dense bordered class="bg-red-1 rounded-borders q-mb-sm">
                <q-item v-for="(error_jc, indice_jc) in resultadoEtl_jc.errores" :key="indice_jc">
                  <q-item-section avatar><q-icon name="error" color="negative" size="xs" /></q-item-section>
                  <q-item-section class="text-caption">{{ error_jc }}</q-item-section>
                </q-item>
              </q-list>
              <q-list v-if="resultadoEtl_jc.advertencias.length" dense bordered class="bg-amber-1 rounded-borders">
                <q-item v-for="(advertencia_jc, indice_jc) in resultadoEtl_jc.advertencias" :key="indice_jc">
                  <q-item-section avatar><q-icon name="warning" color="warning" size="xs" /></q-item-section>
                  <q-item-section class="text-caption">{{ advertencia_jc }}</q-item-section>
                </q-item>
              </q-list>
            </q-card>
            <div v-else class="text-grey-6 text-center q-pa-xl">
              Los resultados de la validación aparecerán aquí.
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- ════════ Reporte de Rendimiento (tabla temporal) ════════ -->
      <q-tab-panel name="reporte" class="q-pa-none">
        <div class="row items-center q-mb-md q-gutter-sm">
          <q-select
            v-model="periodoReporte_jc"
            :options="periodos_jc"
            option-label="nombre_cjgp"
            label="Período"
            outlined
            dense
            style="min-width: 200px"
          />
          <q-btn color="primary" icon="refresh" label="Generar reporte" :loading="cargandoReporte_jc" @click="generarReporte_jc" />
          <q-chip dense color="deep-purple-1" text-color="deep-purple-9" icon="dns">
            Calculado con tabla temporal en PostgreSQL
          </q-chip>
        </div>
        <q-table
          v-if="reporte_jc"
          :rows="reporte_jc.filas"
          :columns="columnasReporte_jc"
          row-key="id_materia"
          :loading="cargandoReporte_jc"
          flat
          bordered
          dense
          no-data-label="Sin inscripciones en el período seleccionado."
        >
          <template #body-cell-promedio="props">
            <q-td :props="props">{{ props.row.promedio ?? '—' }}</q-td>
          </template>
          <template #body-cell-porcentaje="props">
            <q-td :props="props">
              <q-chip
                v-if="props.row.porcentaje_aprobacion !== null"
                dense
                :color="props.row.porcentaje_aprobacion >= 50 ? 'green-1' : 'red-1'"
                :text-color="props.row.porcentaje_aprobacion >= 50 ? 'green-9' : 'red-9'"
              >
                {{ props.row.porcentaje_aprobacion }}%
              </q-chip>
              <span v-else class="text-grey-6">Acta abierta</span>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- ════════ Registro de Actas ════════ -->
      <q-tab-panel name="actas" class="q-pa-none">
        <q-list bordered separator v-if="actas_jc.length">
          <q-item v-for="acta_jc in actas_jc" :key="acta_jc.id_acta_jc">
            <q-item-section avatar>
              <q-avatar
                :icon="acta_jc.tipo_jc === 'VERDE' ? 'verified_user' : 'description'"
                :color="acta_jc.tipo_jc === 'VERDE' ? 'green-2' : 'blue-grey-2'"
                :text-color="acta_jc.tipo_jc === 'VERDE' ? 'green-9' : 'blue-grey-9'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ acta_jc.codigo_jc }}</q-item-label>
              <q-item-label caption>
                {{ acta_jc.materia_jc.codigo_cjgp }} — {{ acta_jc.materia_jc.nombre_cjgp }}
                · {{ acta_jc.periodo_jc.nombre_cjgp }}
                · Emitida por {{ acta_jc.generadaPor_jc.nombre_ahbb }} {{ acta_jc.generadaPor_jc.apellido_ahbb }}
                el {{ new Date(acta_jc.creadoEn_jc).toLocaleString('es-VE') }}
              </q-item-label>
              <q-item-label caption class="text-grey-6" style="font-family: monospace">
                SHA-256: {{ acta_jc.hashVerificacion_jc }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else-if="!cargandoActas_jc" class="text-grey-6 text-center q-pa-xl">
          Aún no se han emitido actas.
        </div>
        <q-inner-loading :showing="cargandoActas_jc" />
      </q-tab-panel>

      <!-- ════════ Diccionario de Datos (information_schema) ════════ -->
      <q-tab-panel name="metadatos" class="q-pa-none">
        <q-banner class="bg-cyan-1 text-cyan-9 q-mb-md" rounded dense>
          <template #avatar><q-icon name="schema" /></template>
          Estructura real de las tablas de los módulos nuevos, consultada en vivo a
          <code>information_schema.columns</code> de PostgreSQL.
        </q-banner>
        <template v-if="metadatos_jc">
          <q-expansion-item
            v-for="(columnas_jc, tabla_jc) in metadatos_jc.tablas"
            :key="tabla_jc"
            :label="tabla_jc"
            icon="table_chart"
            header-class="text-weight-medium"
            bordered
            class="q-mb-xs"
          >
            <q-markup-table flat dense>
              <thead>
                <tr class="bg-grey-2">
                  <th class="text-left">#</th>
                  <th class="text-left">Columna</th>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">Admite nulos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="columna_jc in columnas_jc" :key="columna_jc.columna">
                  <td>{{ columna_jc.posicion }}</td>
                  <td style="font-family: monospace">{{ columna_jc.columna }}</td>
                  <td>{{ columna_jc.tipo }}</td>
                  <td>{{ columna_jc.admiteNulos ? 'Sí' : 'No' }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-expansion-item>
        </template>
        <q-inner-loading :showing="cargandoMetadatos_jc" />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
