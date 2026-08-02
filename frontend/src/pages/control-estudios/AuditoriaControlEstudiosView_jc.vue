<!--
  AuditoriaControlEstudiosView_jc.vue — Auditoría académica del módulo.

  Es la vista propia del rol Control de Estudios: muestra la trazabilidad de lo
  que ocurre con las notas. Por ejemplo: "el profesor Juan Pérez cargó 3 notas
  del Corte 1 a María García en MAT1" o "emitió el acta ACTA-2026-II-MAT1-XXXX".

  Consume la misma bitácora que la auditoría general, pero acotada al módulo de
  Control de Estudios y con el detalle académico desplegable (alumno, corte y
  nota registrada).
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerAuditoriaControlEstudios_jc,
  obtenerResumenAuditoriaControlEstudios_jc,
} from '../../servicios/controlEstudiosServicio_jc';

const $q = useQuasar();

const resumen_jc = ref(null);
const resultado_jc = ref({ registros: [], total: 0, pagina: 1, totalPaginas: 1 });
const cargando_jc = ref(false);
const detalleAbierto_jc = ref(null);

const filtros_jc = ref({
  accion_jc: null,
  busqueda_jc: '',
  desde_jc: null,
  hasta_jc: null,
  pagina_jc: 1,
  limite_jc: 25,
});

/** Acciones académicas que tiene sentido filtrar en esta pantalla. */
const ACCIONES_JC = [
  { label: 'Carga de notas', value: 'NOTAS_CARGADAS' },
  { label: 'Reparación registrada', value: 'REPARACION_REGISTRADA' },
  { label: 'Reparación eliminada', value: 'REPARACION_ELIMINADA' },
  { label: 'Acta emitida', value: 'ACTA_EMITIDA' },
  { label: 'Acta cerrada', value: 'ACTA_CERRADA' },
  { label: 'Certificado de sobresaliente', value: 'CERTIFICADO_SOBRESALIENTE' },
  { label: 'Plan creado', value: 'PLAN_CREADO' },
  { label: 'Plan publicado', value: 'PLAN_PUBLICADO' },
  { label: 'CSV confirmado', value: 'CSV_CONFIRMADO' },
];

const PRESENTACION_ACCION_JC = {
  NOTAS_CARGADAS: { color: 'primary', icono: 'edit_note' },
  REPARACION_REGISTRADA: { color: 'blue', icono: 'autorenew' },
  REPARACION_ELIMINADA: { color: 'grey', icono: 'undo' },
  ACTA_EMITIDA: { color: 'indigo', icono: 'description' },
  ACTA_CERRADA: { color: 'positive', icono: 'task_alt' },
  CERTIFICADO_SOBRESALIENTE: { color: 'amber-8', icono: 'military_tech' },
  PLAN_CREADO: { color: 'teal', icono: 'rule' },
  PLAN_PUBLICADO: { color: 'teal', icono: 'publish' },
  CSV_VALIDADO: { color: 'blue-grey', icono: 'fact_check' },
  CSV_CONFIRMADO: { color: 'blue-grey', icono: 'upload_file' },
};

const presentacion_jc = (accion_jc) =>
  PRESENTACION_ACCION_JC[accion_jc] ?? { color: 'grey', icono: 'history' };

const formatearFecha_jc = (fecha_jc) =>
  fecha_jc
    ? new Date(fecha_jc).toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const consultar_jc = async () => {
  cargando_jc.value = true;
  try {
    const filtrosLimpios_jc = Object.fromEntries(
      Object.entries(filtros_jc.value).filter(
        ([, valor_jc]) => valor_jc !== null && valor_jc !== '',
      ),
    );
    resultado_jc.value = await obtenerAuditoriaControlEstudios_jc(filtrosLimpios_jc);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo consultar la auditoría.' });
  } finally {
    cargando_jc.value = false;
  }
};

const cargarResumen_jc = async () => {
  try {
    resumen_jc.value = await obtenerResumenAuditoriaControlEstudios_jc();
  } catch {
    resumen_jc.value = null;
  }
};

const aplicarFiltros_jc = () => {
  filtros_jc.value.pagina_jc = 1;
  consultar_jc();
};

const cambiarPagina_jc = (pagina_jc) => {
  filtros_jc.value.pagina_jc = pagina_jc;
  consultar_jc();
};

onMounted(() => {
  consultar_jc();
  cargarResumen_jc();
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Auditoría Académica</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Trazabilidad de las notas y las actas: quién cargó qué, a qué alumno y cuándo —
      Control de Estudios (JC)
    </div>

    <!-- Indicadores -->
    <div v-if="resumen_jc" class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="teal" text-color="white" icon="fact_check" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.total }}</div>
              <div class="text-caption text-grey-7">movimientos académicos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="primary" text-color="white" icon="today" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.hoy }}</div>
              <div class="text-caption text-grey-7">registrados hoy</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-py-sm">
            <div class="text-caption text-grey-7 q-mb-xs">Quién registra más movimientos</div>
            <q-chip
              v-for="usuario_jc in resumen_jc.porUsuario.slice(0, 5)"
              :key="usuario_jc.usuario"
              dense
              size="sm"
              color="teal-1"
              text-color="teal-9"
              icon="person"
            >
              {{ usuario_jc.usuario }} · {{ usuario_jc.total }}
            </q-chip>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-pa-sm q-mb-sm">
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-md-4">
          <q-input
            v-model="filtros_jc.busqueda_jc"
            label="Buscar por alumno, materia o responsable"
            outlined
            dense
            clearable
            debounce="500"
            @update:model-value="aplicarFiltros_jc"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="filtros_jc.accion_jc"
            :options="ACCIONES_JC"
            emit-value
            map-options
            clearable
            label="Tipo de movimiento"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            v-model="filtros_jc.desde_jc"
            type="date"
            label="Desde"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            v-model="filtros_jc.hasta_jc"
            type="date"
            label="Hasta"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_jc" />

    <!-- Línea de tiempo de movimientos -->
    <q-timeline color="teal" layout="dense">
      <q-timeline-entry
        v-for="registro_jc in resultado_jc.registros"
        :key="registro_jc.id_auditoria_jc"
        :icon="presentacion_jc(registro_jc.accion_jc).icono"
        :color="presentacion_jc(registro_jc.accion_jc).color"
        :subtitle="formatearFecha_jc(registro_jc.creadoEn_jc)"
      >
        <template #title>
          <span class="text-weight-bold">{{ registro_jc.nombreUsuario_jc ?? 'Sistema' }}</span>
          <span class="text-body2"> {{ registro_jc.descripcion_jc }}</span>
        </template>

        <div class="text-caption text-grey-7">
          <q-chip dense size="sm" outline :color="presentacion_jc(registro_jc.accion_jc).color">
            {{ registro_jc.etiquetaAccion_jc }}
          </q-chip>
          <q-chip v-if="registro_jc.rolUsuario_jc" dense size="sm" color="grey-3" text-color="grey-9">
            {{ registro_jc.rolUsuario_jc }}
          </q-chip>
          <q-chip v-if="registro_jc.afectado_jc" dense size="sm" color="orange-1" text-color="orange-9" icon="person">
            {{ registro_jc.afectado_jc.apellido_ahbb }}, {{ registro_jc.afectado_jc.nombre_ahbb }}
          </q-chip>
          <q-btn
            v-if="registro_jc.detalle_jc"
            flat
            dense
            size="sm"
            color="primary"
            icon="unfold_more"
            label="Ver notas registradas"
            @click="detalleAbierto_jc = registro_jc"
          />
        </div>
      </q-timeline-entry>
    </q-timeline>

    <div
      v-if="!resultado_jc.registros.length && !cargando_jc"
      class="text-center text-grey-6 q-pa-xl"
    >
      No hay movimientos académicos registrados con esos filtros.
    </div>

    <div class="row items-center justify-between q-mt-sm">
      <div class="text-caption text-grey-7">
        {{ resultado_jc.total }} movimiento(s) · página {{ resultado_jc.pagina }} de
        {{ resultado_jc.totalPaginas }}
      </div>
      <q-pagination
        v-if="resultado_jc.totalPaginas > 1"
        :model-value="resultado_jc.pagina"
        :max="resultado_jc.totalPaginas"
        :max-pages="7"
        boundary-numbers
        direction-links
        @update:model-value="cambiarPagina_jc"
      />
    </div>

    <!-- Detalle académico: alumno, corte y nota -->
    <q-dialog :model-value="!!detalleAbierto_jc" @hide="detalleAbierto_jc = null">
      <q-card style="min-width: 560px; max-width: 92vw">
        <q-card-section class="text-subtitle1 text-weight-bold">
          Detalle del movimiento
        </q-card-section>

        <q-card-section v-if="detalleAbierto_jc" class="text-caption">
          <div><strong>Responsable:</strong> {{ detalleAbierto_jc.nombreUsuario_jc ?? 'Sistema' }}</div>
          <div><strong>Cuándo:</strong> {{ formatearFecha_jc(detalleAbierto_jc.creadoEn_jc) }}</div>
          <div><strong>Movimiento:</strong> {{ detalleAbierto_jc.descripcion_jc }}</div>

          <!-- Notas cargadas: tabla legible en vez de JSON crudo -->
          <template v-if="detalleAbierto_jc.detalle_jc?.notas">
            <q-separator class="q-my-sm" />
            <q-markup-table flat dense>
              <thead>
                <tr class="bg-grey-2">
                  <th class="text-left">Alumno</th>
                  <th class="text-left">Evaluación</th>
                  <th class="text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(nota_jc, indice_jc) in detalleAbierto_jc.detalle_jc.notas" :key="indice_jc">
                  <td>{{ nota_jc.alumno }}</td>
                  <td>{{ nota_jc.evaluacion ?? '—' }}</td>
                  <td class="text-center text-weight-bold">
                    {{ nota_jc.nota ?? nota_jc.definitiva ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </template>

          <template v-else>
            <q-separator class="q-my-sm" />
            <pre class="bg-grey-2 q-pa-sm rounded-borders" style="white-space: pre-wrap; overflow-x: auto">{{
              JSON.stringify(detalleAbierto_jc.detalle_jc, null, 2)
            }}</pre>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
