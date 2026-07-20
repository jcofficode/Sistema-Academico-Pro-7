<!--
  MisPagosView_ap.vue — Vista de pagos del alumno.
  Muestra el estado de solvencia (banner), historial y formulario para pagar.
-->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerMisPagos_ap,
  crearPago_ap,
  obtenerTarifaPeriodoActiva_ap,
  descargarReciboPago_ap,
} from '../../servicios/pagosServicio_ap';
import { obtenerPeriodoActivo_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const pagos_ap = ref([]);
const periodoActivo_ap = ref(null);
const tarifaPeriodo_ap = ref(null);
const cargando_ap = ref(false);
const dialogoAbierto_ap = ref(false);
const enviando_ap = ref(false);

const formulario_ap = ref({
  concepto_ap: 'PERIODO',
  id_tarifa_ap: null,
  id_periodo_ap: null,
  referencia_ap: '',
});

const esSolvente_ap = computed(() => {
  if (!periodoActivo_ap.value) return false;
  return pagos_ap.value.some(
    (p_ap) =>
      p_ap.concepto_ap === 'PERIODO' &&
      p_ap.estado_ap === 'CONFIRMADO' &&
      p_ap.id_periodo_ap === periodoActivo_ap.value?.id_periodo_cjgp,
  );
});

const colorEstado_ap = (estado_ap) => ({
  PENDIENTE: 'amber-7',
  CONFIRMADO: 'positive',
  RECHAZADO: 'negative',
}[estado_ap] ?? 'grey');

const columnas_ap = [
  { name: 'concepto_ap', label: 'Concepto', field: 'concepto_ap', align: 'left' },
  { name: 'periodo', label: 'Período / Curso', field: (r) => r.periodo_ap?.nombre_cjgp ?? r.curso_ap?.nombre_ahbb ?? '—', align: 'left' },
  { name: 'monto_ap', label: 'Monto (Bs.)', field: 'monto_ap', align: 'right', format: (v) => Number(v).toFixed(2) },
  { name: 'referencia_ap', label: 'Referencia', field: 'referencia_ap', align: 'left' },
  { name: 'estado_ap', label: 'Estado', field: 'estado_ap', align: 'center' },
  { name: 'creadoEn_ap', label: 'Fecha', field: 'creadoEn_ap', align: 'left', format: (v) => v ? new Date(v).toLocaleDateString('es-VE') : '—' },
  { name: 'acciones_ap', label: 'Acciones', field: 'acciones_ap', align: 'center' },
];

const cargar_ap = async () => {
  cargando_ap.value = true;
  try {
    const [pagosData_ap, periodoData_ap, tarifaData_ap] = await Promise.allSettled([
      obtenerMisPagos_ap(),
      obtenerPeriodoActivo_cjgp(),
      obtenerTarifaPeriodoActiva_ap(),
    ]);
    pagos_ap.value = pagosData_ap.status === 'fulfilled' ? pagosData_ap.value : [];
    periodoActivo_ap.value = periodoData_ap.status === 'fulfilled' ? periodoData_ap.value : null;
    tarifaPeriodo_ap.value = tarifaData_ap.status === 'fulfilled' ? tarifaData_ap.value : null;
  } finally {
    cargando_ap.value = false;
  }
};

const abrirPagarPeriodo_ap = () => {
  if (!tarifaPeriodo_ap.value) {
    $q.notify({ type: 'warning', message: 'No hay tarifa activa de período. Contacta a la coordinación.' });
    return;
  }
  formulario_ap.value = {
    concepto_ap: 'PERIODO',
    id_tarifa_ap: tarifaPeriodo_ap.value.id_tarifa_ap,
    id_periodo_ap: periodoActivo_ap.value?.id_periodo_cjgp ?? null,
    referencia_ap: '',
  };
  dialogoAbierto_ap.value = true;
};

const enviarPago_ap = async () => {
  if (!formulario_ap.value.referencia_ap.trim()) {
    $q.notify({ type: 'warning', message: 'Ingresa la referencia del pago móvil o transferencia.' });
    return;
  }
  enviando_ap.value = true;
  const res_ap = await crearPago_ap(formulario_ap.value);
  enviando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje ?? 'Error al registrar el pago.' });
    if (res_ap.violaciones?.length) {
      res_ap.violaciones.forEach((v_ap) => $q.notify({ type: 'warning', message: v_ap }));
    }
  } else {
    $q.notify({ type: 'positive', message: res_ap.mensaje ?? 'Pago registrado. Espera la confirmación del administrador.' });
    dialogoAbierto_ap.value = false;
    await cargar_ap();
  }
};

const descargar_ap = async (id_pago_ap) => {
  const ok_ap = await descargarReciboPago_ap(id_pago_ap);
  if (!ok_ap) $q.notify({ type: 'negative', message: 'Error al descargar el recibo.' });
};

onMounted(cargar_ap);
</script>

<template>
  <q-page padding>
    <div class="page-header-ap q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold q-mb-xs">
            <q-icon name="account_balance_wallet" size="28px" class="q-mr-sm" color="primary" />
            Mis Pagos
          </div>
          <div class="text-caption text-grey-7">
            Gestiona tus aranceles y consulta tu estado de solvencia
          </div>
        </div>
        <q-btn
          v-if="periodoActivo_ap && !esSolvente_ap"
          id="btn-pagar-periodo-ap"
          unelevated
          rounded
          color="primary"
          icon="payment"
          :label="tarifaPeriodo_ap ? `Pagar Período (Bs. ${Number(tarifaPeriodo_ap.monto_ap).toFixed(2)})` : 'Pagar Período'"
          @click="abrirPagarPeriodo_ap"
        />
      </div>
    </div>

    <!-- Banner de solvencia -->
    <q-banner
      v-if="periodoActivo_ap"
      rounded
      :class="esSolvente_ap ? 'bg-green-1 text-green-9' : 'bg-orange-1 text-orange-9'"
      class="q-mb-lg"
      style="border: 1px solid"
    >
      <template #avatar>
        <q-icon :name="esSolvente_ap ? 'verified' : 'warning'" :color="esSolvente_ap ? 'positive' : 'warning'" size="32px" />
      </template>
      <div class="text-weight-bold text-h6">
        {{ esSolvente_ap ? '¡Estás solvente!' : 'Tienes un arancel pendiente' }}
      </div>
      <div>
        {{ esSolvente_ap
          ? `Tu pago para ${periodoActivo_ap?.nombre_cjgp} está confirmado. Puedes inscribir materias.`
          : `Debes cancelar el arancel del período ${periodoActivo_ap?.nombre_cjgp} para inscribir materias. Usa el botón "Pagar Período".`
        }}
      </div>
    </q-banner>

    <!-- Tabla de pagos -->
    <q-card flat bordered class="rounded-xl hover-elevate">
      <q-table
        flat
        :rows="pagos_ap"
        :columns="columnas_ap"
        row-key="id_pago_ap"
        :loading="cargando_ap"
        no-data-label="No tienes pagos registrados aún."
      >
        <template #body-cell-estado_ap="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="colorEstado_ap(props.row.estado_ap)" :label="props.row.estado_ap" />
          </q-td>
        </template>
        <template #body-cell-acciones_ap="props">
          <q-td :props="props" class="text-center">
            <q-btn
              v-if="props.row.estado_ap === 'CONFIRMADO'"
              :id="`btn-descargar-recibo-${props.row.id_pago_ap}`"
              flat dense round size="sm" icon="picture_as_pdf" color="red-4"
              title="Descargar Recibo PDF" @click="descargar_ap(props.row.id_pago_ap)"
            />
            <span v-else class="text-caption text-grey-5">—</span>
          </q-td>
        </template>
        <template #loading><q-inner-loading showing color="primary" /></template>
      </q-table>
    </q-card>

    <!-- Diálogo de pago -->
    <q-dialog v-model="dialogoAbierto_ap" persistent>
      <q-card style="width: 440px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Registrar Pago</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-md q-gutter-y-md">
          <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-sm">
            <template #avatar><q-icon name="info" color="primary" /></template>
            <div v-if="tarifaPeriodo_ap">
              <strong>Monto a cancelar:</strong> Bs. {{ Number(tarifaPeriodo_ap.monto_ap).toFixed(2) }}<br/>
              <strong>Concepto:</strong> Inscripción del Período {{ periodoActivo_ap?.nombre_cjgp }}
            </div>
          </q-banner>
          <q-input
            v-model="formulario_ap.referencia_ap"
            label="Referencia de pago (número de operación)"
            outlined dense autofocus
            hint="Ej: número de pago móvil, transferencia o voucher"
            :rules="[(v) => !!v || 'La referencia es requerida']"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            id="btn-enviar-pago-ap"
            unelevated rounded color="primary" icon="send"
            label="Enviar Pago"
            :loading="enviando_ap"
            @click="enviarPago_ap"
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
</style>
