<!--
  MisRecibosView_ap.vue — Vista de contratos y recibos del profesor.
  Muestra el contrato activo del profesor y su historial de nóminas con PDF.
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerMiContrato_ap,
  obtenerMisRecibosNomina_ap,
  descargarReciboNomina_ap,
} from '../../servicios/pagosServicio_ap';

const $q = useQuasar();
const contrato_ap = ref(null);
const nominas_ap = ref([]);
const cargando_ap = ref(false);
const descargando_ap = ref(null);

const columnas_ap = [
  { name: 'periodo', label: 'Período', field: (r) => r.periodo_ap?.nombre_cjgp, align: 'left' },
  { name: 'horas_ap', label: 'Horas', field: 'horas_ap', align: 'right', format: (v) => v ? Number(v).toFixed(1) : '—' },
  { name: 'monto_calculado_ap', label: 'Monto (Bs.)', field: 'monto_calculado_ap', align: 'right', format: (v) => Number(v).toFixed(2) },
  { name: 'estado_ap', label: 'Estado', field: 'estado_ap', align: 'center' },
  { name: 'creadoEn_ap', label: 'Generado', field: 'creadoEn_ap', align: 'left', format: (v) => v ? new Date(v).toLocaleDateString('es-VE') : '—' },
  { name: 'acciones_ap', label: 'Recibo', field: 'acciones_ap', align: 'center' },
];

const cargar_ap = async () => {
  cargando_ap.value = true;
  try {
    const [contratoData_ap, nominasData_ap] = await Promise.allSettled([
      obtenerMiContrato_ap(),
      obtenerMisRecibosNomina_ap(),
    ]);
    contrato_ap.value = contratoData_ap.status === 'fulfilled' ? contratoData_ap.value : null;
    nominas_ap.value = nominasData_ap.status === 'fulfilled' ? nominasData_ap.value : [];
  } finally {
    cargando_ap.value = false;
  }
};

const descargar_ap = async (id_nomina_ap) => {
  descargando_ap.value = id_nomina_ap;
  const ok_ap = await descargarReciboNomina_ap(id_nomina_ap);
  descargando_ap.value = null;
  if (!ok_ap) $q.notify({ type: 'negative', message: 'Error al descargar el recibo.' });
};

onMounted(cargar_ap);
</script>

<template>
  <q-page padding>
    <div class="page-header-ap q-mb-lg">
      <div class="text-h5 text-weight-bold q-mb-xs">
        <q-icon name="receipt_long" size="28px" class="q-mr-sm" color="primary" />
        Mi Contrato y Recibos de Nómina
      </div>
      <div class="text-caption text-grey-7">
        Consulta tu contrato activo y descarga tus recibos de pago
      </div>
    </div>

    <!-- Card contrato -->
    <q-card flat bordered class="rounded-xl q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          <q-icon name="badge" class="q-mr-sm" color="primary" />
          Mi Contrato
        </div>
        <div v-if="cargando_ap" class="text-center q-pa-md">
          <q-spinner color="primary" size="md" />
        </div>
        <div v-else-if="!contrato_ap" class="text-center q-pa-md">
          <q-icon name="warning" color="warning" size="48px" />
          <div class="text-body1 text-grey-8 q-mt-sm">
            No tienes un contrato registrado.<br />Contacta al administrador.
          </div>
        </div>
        <div v-else class="row q-gutter-lg">
          <div class="stat-chip-ap">
            <div class="text-caption text-grey-7">Tipo de Contrato</div>
            <q-chip
              dense
              :color="contrato_ap.tipo_ap === 'FIJO' ? 'indigo-6' : 'teal-6'"
              text-color="white"
              :label="contrato_ap.tipo_ap === 'FIJO' ? 'Sueldo Fijo' : 'Por Hora'"
              size="lg"
            />
          </div>
          <div class="stat-chip-ap">
            <div class="text-caption text-grey-7">
              {{ contrato_ap.tipo_ap === 'FIJO' ? 'Sueldo Mensual' : 'Tarifa / Hora' }}
            </div>
            <div class="text-h5 text-primary text-weight-bold">
              Bs. {{ Number(contrato_ap.monto_ap).toFixed(2) }}
            </div>
          </div>
          <div class="stat-chip-ap">
            <div class="text-caption text-grey-7">Estado</div>
            <q-badge :color="contrato_ap.activo_ap ? 'positive' : 'grey-5'" :label="contrato_ap.activo_ap ? 'Activo' : 'Inactivo'" style="font-size: 1rem; padding: 6px 12px" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla de nóminas -->
    <q-card flat bordered class="rounded-xl">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          <q-icon name="history" class="q-mr-sm" color="primary" />
          Historial de Nóminas
        </div>
        <q-table
          flat
          :rows="nominas_ap"
          :columns="columnas_ap"
          row-key="id_nomina_ap"
          :loading="cargando_ap"
          no-data-label="No hay nóminas registradas para tu contrato."
        >
          <template #body-cell-estado_ap="props">
            <q-td :props="props" class="text-center">
              <q-badge :color="props.row.estado_ap === 'PAGADO' ? 'positive' : 'amber-7'" :label="props.row.estado_ap" />
            </q-td>
          </template>
          <template #body-cell-acciones_ap="props">
            <q-td :props="props" class="text-center">
              <q-btn
                :id="`btn-descargar-nomina-${props.row.id_nomina_ap}`"
                flat dense round size="sm" icon="picture_as_pdf" color="red-4"
                title="Descargar Recibo PDF"
                :loading="descargando_ap === props.row.id_nomina_ap"
                @click="descargar_ap(props.row.id_nomina_ap)"
              />
            </q-td>
          </template>
          <template #loading><q-inner-loading showing color="primary" /></template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.rounded-xl { border-radius: 20px; }
.stat-chip-ap { background: #f1f3f5; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }
</style>
