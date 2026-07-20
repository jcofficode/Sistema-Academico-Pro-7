<!--
  ConfirmarPagosView_ap.vue — Panel de gestión de pagos para el administrador.
  Lista todos los pagos con filtros. Admin confirma o rechaza con observación.
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { obtenerTodosLosPagos_ap, confirmarPago_ap } from '../../servicios/pagosServicio_ap';

const $q = useQuasar();
const pagos_ap = ref([]);
const cargando_ap = ref(false);
const filtroEstado_ap = ref('PENDIENTE');
const dialogoAbierto_ap = ref(false);
const procesando_ap = ref(false);
const pagoSeleccionado_ap = ref(null);
const formAccion_ap = ref({ estado_ap: 'CONFIRMADO', observacion_ap: '' });

const ESTADOS_AP = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'PENDIENTE' },
  { label: 'Confirmados', value: 'CONFIRMADO' },
  { label: 'Rechazados', value: 'RECHAZADO' },
];

const colorEstado_ap = (estado_ap) => ({
  PENDIENTE: 'amber-7',
  CONFIRMADO: 'positive',
  RECHAZADO: 'negative',
}[estado_ap] ?? 'grey');

const columnas_ap = [
  { name: 'alumno', label: 'Alumno', field: (row) => `${row.alumno_ap?.apellido_ahbb}, ${row.alumno_ap?.nombre_ahbb}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: (row) => row.alumno_ap?.cedula_ahbb, align: 'left' },
  { name: 'concepto_ap', label: 'Concepto', field: 'concepto_ap', align: 'left' },
  { name: 'periodo', label: 'Período', field: (row) => row.periodo_ap?.nombre_cjgp ?? row.curso_ap?.nombre_ahbb ?? '—', align: 'left' },
  { name: 'monto_ap', label: 'Monto (Bs.)', field: 'monto_ap', align: 'right', format: (v) => Number(v).toFixed(2) },
  { name: 'referencia_ap', label: 'Referencia', field: 'referencia_ap', align: 'left' },
  { name: 'estado_ap', label: 'Estado', field: 'estado_ap', align: 'center' },
  { name: 'creadoEn_ap', label: 'Fecha', field: 'creadoEn_ap', align: 'left', format: (v) => v ? new Date(v).toLocaleDateString('es-VE') : '—' },
  { name: 'acciones_ap', label: 'Acciones', field: 'acciones_ap', align: 'center' },
];

const cargar_ap = async () => {
  cargando_ap.value = true;
  try {
    pagos_ap.value = await obtenerTodosLosPagos_ap(filtroEstado_ap.value || undefined);
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar los pagos.' });
  } finally {
    cargando_ap.value = false;
  }
};

const abrirAccion_ap = (pago_ap, accion_ap) => {
  pagoSeleccionado_ap.value = pago_ap;
  formAccion_ap.value = { estado_ap: accion_ap, observacion_ap: '' };
  dialogoAbierto_ap.value = true;
};

const ejecutarAccion_ap = async () => {
  procesando_ap.value = true;
  const res_ap = await confirmarPago_ap(
    pagoSeleccionado_ap.value.id_pago_ap,
    formAccion_ap.value,
  );
  procesando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    $q.notify({
      type: 'positive',
      message: `Pago ${formAccion_ap.value.estado_ap === 'CONFIRMADO' ? 'confirmado' : 'rechazado'} correctamente.`,
    });
    dialogoAbierto_ap.value = false;
    await cargar_ap();
  }
};

onMounted(cargar_ap);
</script>

<template>
  <q-page padding>
    <div class="page-header-ap q-mb-lg">
      <div class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="task_alt" size="28px" class="q-mr-sm" color="primary" />
        Confirmar Pagos
      </div>
      <div class="text-caption text-grey-7">
        Revisa las referencias de pago y confirma o rechaza cada solicitud
      </div>
    </div>

    <!-- Filtros -->
    <div class="row q-gutter-sm q-mb-md items-center">
      <q-btn-toggle
        v-model="filtroEstado_ap"
        :options="ESTADOS_AP"
        unelevated
        rounded
        toggle-color="primary"
        color="grey-3"
        text-color="grey-9"
        @update:model-value="cargar_ap"
      />
      <q-btn flat round icon="refresh" color="grey-7" @click="cargar_ap" title="Actualizar" />
    </div>

    <q-card flat bordered class="rounded-xl hover-elevate">
      <q-table
        flat
        :rows="pagos_ap"
        :columns="columnas_ap"
        row-key="id_pago_ap"
        :loading="cargando_ap"
        no-data-label="No hay pagos con este filtro."
      >
        <template #body-cell-estado_ap="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="colorEstado_ap(props.row.estado_ap)" :label="props.row.estado_ap" />
          </q-td>
        </template>
        <template #body-cell-acciones_ap="props">
          <q-td :props="props" class="text-center q-gutter-x-sm">
            <template v-if="props.row.estado_ap === 'PENDIENTE'">
              <q-btn
                :id="`btn-confirmar-pago-${props.row.id_pago_ap}`"
                flat dense round size="sm" icon="check_circle" color="positive"
                title="Confirmar" @click="abrirAccion_ap(props.row, 'CONFIRMADO')"
              />
              <q-btn
                :id="`btn-rechazar-pago-${props.row.id_pago_ap}`"
                flat dense round size="sm" icon="cancel" color="negative"
                title="Rechazar" @click="abrirAccion_ap(props.row, 'RECHAZADO')"
              />
            </template>
            <template v-else>
              <span class="text-caption text-grey-5">—</span>
            </template>
          </q-td>
        </template>
        <template #loading><q-inner-loading showing color="primary" /></template>
      </q-table>
    </q-card>

    <!-- Diálogo de confirmación/rechazo -->
    <q-dialog v-model="dialogoAbierto_ap" persistent>
      <q-card style="width: 440px; border-radius: 16px">
        <q-card-section
          class="text-white row items-center"
          :class="formAccion_ap.estado_ap === 'CONFIRMADO' ? 'bg-positive' : 'bg-negative'"
        >
          <div class="text-h6 row items-center">
            <q-icon :name="formAccion_ap.estado_ap === 'CONFIRMADO' ? 'check_circle' : 'cancel'" class="q-mr-sm" />
            {{ formAccion_ap.estado_ap === 'CONFIRMADO' ? 'Confirmar Pago' : 'Rechazar Pago' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section v-if="pagoSeleccionado_ap" class="q-pt-md">
          <div class="info-pago-ap q-pa-md q-mb-md">
            <div><strong>Alumno:</strong> {{ pagoSeleccionado_ap.alumno_ap?.apellido_ahbb }}, {{ pagoSeleccionado_ap.alumno_ap?.nombre_ahbb }}</div>
            <div><strong>Cédula:</strong> {{ pagoSeleccionado_ap.alumno_ap?.cedula_ahbb }}</div>
            <div><strong>Concepto:</strong> {{ pagoSeleccionado_ap.concepto_ap }}</div>
            <div><strong>Monto:</strong> Bs. {{ Number(pagoSeleccionado_ap.monto_ap).toFixed(2) }}</div>
            <div><strong>Referencia:</strong> {{ pagoSeleccionado_ap.referencia_ap }}</div>
          </div>
          <q-input
            v-model="formAccion_ap.observacion_ap"
            :label="formAccion_ap.estado_ap === 'RECHAZADO' ? 'Motivo del rechazo (requerido)' : 'Observación (opcional)'"
            type="textarea"
            rows="3"
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            id="btn-ejecutar-accion-pago-ap"
            unelevated
            rounded
            :color="formAccion_ap.estado_ap === 'CONFIRMADO' ? 'positive' : 'negative'"
            :label="formAccion_ap.estado_ap === 'CONFIRMADO' ? 'Confirmar' : 'Rechazar'"
            :loading="procesando_ap"
            @click="ejecutarAccion_ap"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.rounded-xl { border-radius: 20px; }
.hover-elevate:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
.info-pago-ap { background: #f1f3f5; border-radius: 8px; font-size: 0.9rem; line-height: 1.8; color: #333; }
</style>
