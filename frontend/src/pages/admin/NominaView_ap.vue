<!--
  NominaView_ap.vue — Panel de Nómina Docente (Admin).
  Selecciona el período, genera la simulación, revisa y marca como pagada.
  Permite descargar el recibo PDF de cada nómina.
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  generarNomina_ap,
  obtenerNominas_ap,
  marcarNominaPagada_ap,
  descargarReciboNomina_ap,
  obtenerReporteIngresos_ap,
} from '../../servicios/pagosServicio_ap';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const periodos_ap = ref([]);
const periodoSeleccionado_ap = ref(null);
const nominas_ap = ref([]);
const generando_ap = ref(false);
const cargando_ap = ref(false);
const reporte_ap = ref(null);

const columnas_ap = [
  { name: 'docente', label: 'Docente', field: (r) => `${r.contrato_ap?.profesor_ap?.apellido_ahbb}, ${r.contrato_ap?.profesor_ap?.nombre_ahbb}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: (r) => r.contrato_ap?.profesor_ap?.cedula_ahbb, align: 'left' },
  { name: 'tipo_ap', label: 'Tipo', field: (r) => r.contrato_ap?.tipo_ap, align: 'center' },
  { name: 'horas_ap', label: 'Horas', field: 'horas_ap', align: 'right', format: (v) => v ? Number(v).toFixed(1) : '—' },
  { name: 'monto_calculado_ap', label: 'Total (Bs.)', field: 'monto_calculado_ap', align: 'right', format: (v) => Number(v).toFixed(2) },
  { name: 'estado_ap', label: 'Estado', field: 'estado_ap', align: 'center' },
  { name: 'acciones_ap', label: 'Acciones', field: 'acciones_ap', align: 'center' },
];

const cargarPeriodos_ap = async () => {
  try {
    const datos_ap = await obtenerPeriodos_cjgp();
    periodos_ap.value = (datos_ap ?? []).map((p_ap) => ({
      label: `${p_ap.nombre_cjgp}${p_ap.activo_cjgp ? ' ✓ ACTIVO' : ''}`,
      value: p_ap.id_periodo_cjgp,
    }));
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar períodos.' });
  }
};

const cargarNominas_ap = async () => {
  if (!periodoSeleccionado_ap.value) return;
  cargando_ap.value = true;
  try {
    nominas_ap.value = await obtenerNominas_ap(periodoSeleccionado_ap.value);
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar la nómina.' });
  } finally {
    cargando_ap.value = false;
  }
};

const generar_ap = async () => {
  if (!periodoSeleccionado_ap.value) {
    $q.notify({ type: 'warning', message: 'Selecciona un período primero.' });
    return;
  }
  generando_ap.value = true;
  const res_ap = await generarNomina_ap(periodoSeleccionado_ap.value);
  generando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    $q.notify({
      type: 'positive',
      message: `Nómina generada: ${res_ap.totalProfesores} docentes, total Bs. ${Number(res_ap.totalMonto).toFixed(2)}`,
    });
    await cargarNominas_ap();
  }
};

const marcarPagada_ap = async (nomina_ap) => {
  $q.dialog({
    title: 'Marcar como Pagada',
    message: `¿Confirmas que se ha efectuado el pago a ${nomina_ap.contrato_ap?.profesor_ap?.nombre_ahbb}?`,
    cancel: true,
    ok: { label: 'Confirmar', color: 'positive' },
  }).onOk(async () => {
    const res_ap = await marcarNominaPagada_ap(nomina_ap.id_nomina_ap);
    if (res_ap?.exito === false) {
      $q.notify({ type: 'negative', message: res_ap.mensaje });
    } else {
      $q.notify({ type: 'positive', message: 'Nómina marcada como pagada.' });
      await cargarNominas_ap();
    }
  });
};

const descargarRecibo_ap = async (id_nomina_ap) => {
  const ok_ap = await descargarReciboNomina_ap(id_nomina_ap);
  if (!ok_ap) $q.notify({ type: 'negative', message: 'Error al descargar el recibo.' });
};

const verReporte_ap = async () => {
  if (!periodoSeleccionado_ap.value) return;
  try {
    reporte_ap.value = await obtenerReporteIngresos_ap(periodoSeleccionado_ap.value);
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar el reporte de ingresos.' });
  }
};

onMounted(cargarPeriodos_ap);
</script>

<template>
  <q-page padding>
    <div class="page-header-ap q-mb-lg">
      <div class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="receipt_long" size="28px" class="q-mr-sm" color="primary" />
        Nómina Docente
      </div>
      <div class="text-caption text-grey-7">
        Genera y administra la nómina de profesores por período
      </div>
    </div>

    <!-- Selector de período + acciones -->
    <div class="row items-center q-gutter-md q-mb-lg">
      <q-select
        v-model="periodoSeleccionado_ap"
        :options="periodos_ap"
        label="Período Académico"
        outlined dense
        style="min-width: 280px"
        emit-value map-options
        @update:model-value="cargarNominas_ap"
      />
      <q-btn
        id="btn-generar-nomina-ap"
        unelevated rounded color="primary" icon="calculate"
        label="Generar / Recalcular"
        :loading="generando_ap"
        :disable="!periodoSeleccionado_ap"
        @click="generar_ap"
      />
      <q-btn
        flat rounded icon="bar_chart" color="primary"
        label="Ver Reporte Ingresos"
        :disable="!periodoSeleccionado_ap"
        @click="verReporte_ap"
      />
    </div>

    <!-- Tabla de nóminas -->
    <q-card flat bordered class="rounded-xl hover-elevate q-mb-md">
      <q-table
        flat
        :rows="nominas_ap"
        :columns="columnas_ap"
        row-key="id_nomina_ap"
        :loading="cargando_ap"
        no-data-label="Genera la nómina del período seleccionado."
      >
        <template #body-cell-tipo_ap="props">
          <q-td :props="props" class="text-center">
            <q-chip dense :color="props.value === 'FIJO' ? 'indigo-6' : 'teal-6'" text-color="white" :label="props.value === 'FIJO' ? 'Fijo' : 'Por Hora'" />
          </q-td>
        </template>
        <template #body-cell-estado_ap="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.row.estado_ap === 'PAGADO' ? 'positive' : 'amber-7'" :label="props.row.estado_ap" />
          </q-td>
        </template>
        <template #body-cell-acciones_ap="props">
          <q-td :props="props" class="text-center q-gutter-x-sm">
            <q-btn
              v-if="props.row.estado_ap === 'SIMULADO'"
              :id="`btn-pagar-nomina-${props.row.id_nomina_ap}`"
              flat dense round size="sm" icon="payments" color="positive"
              title="Marcar como Pagada" @click="marcarPagada_ap(props.row)"
            />
            <q-btn
              :id="`btn-recibo-nomina-${props.row.id_nomina_ap}`"
              flat dense round size="sm" icon="picture_as_pdf" color="red-4"
              title="Descargar Recibo PDF" @click="descargarRecibo_ap(props.row.id_nomina_ap)"
            />
          </q-td>
        </template>
        <template #loading><q-inner-loading showing color="primary" /></template>
      </q-table>
    </q-card>

    <!-- Reporte de ingresos -->
    <q-card v-if="reporte_ap" flat bordered class="rounded-xl q-pa-md">
      <div class="text-subtitle1 text-weight-bold q-mb-md">
        <q-icon name="bar_chart" class="q-mr-sm" color="primary" />
        Reporte de Ingresos — {{ reporte_ap.periodo?.nombre_cjgp }}
      </div>
      <div class="row q-gutter-md q-mb-md">
        <q-card flat class="stat-chip-ap">
          <div class="text-caption text-grey-7">Total Confirmado</div>
          <div class="text-h5 text-positive text-weight-bold">Bs. {{ Number(reporte_ap.totalConfirmado).toFixed(2) }}</div>
        </q-card>
      </div>
      <q-table
        flat dense
        :rows="reporte_ap.filas"
        :columns="[
          { name: 'concepto', label: 'Concepto', field: 'concepto', align: 'left' },
          { name: 'confirmados', label: 'Confirmados', field: 'confirmados', align: 'right' },
          { name: 'pendientes', label: 'Pendientes', field: 'pendientes', align: 'right' },
          { name: 'rechazados', label: 'Rechazados', field: 'rechazados', align: 'right' },
          { name: 'monto_confirmado', label: 'Monto Confirmado (Bs.)', field: 'monto_confirmado', align: 'right', format: (v) => Number(v).toFixed(2) },
        ]"
        hide-pagination
      />
    </q-card>
  </q-page>
</template>

<style scoped>
.rounded-xl { border-radius: 20px; }
.hover-elevate:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
.stat-chip-ap { background: #f1f3f5; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; min-width: 200px; }
</style>
