<!--
  TarifasView_ap.vue — Gestión de Tarifas de Pago (Admin).
  CRUD completo: crear, editar (toggle activo) y eliminar tarifas.
-->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerTarifas_ap,
  crearTarifa_ap,
  actualizarTarifa_ap,
  eliminarTarifa_ap,
} from '../../servicios/pagosServicio_ap';

const $q = useQuasar();
const tarifas_ap = ref([]);
const cargando_ap = ref(false);
const dialogoAbierto_ap = ref(false);
const guardando_ap = ref(false);

const formulario_ap = ref({
  concepto_ap: 'PERIODO',
  precio_uc_base: 12.00,
  total_uc: 30,
  arancel_admin: 20.00,
  seguro_estudiantil: 10.00,
  descripcion_ap: '',
  activa_ap: true,
});

// Cálculo dinámico en tiempo real basado estrictamente en UC (sin montos arbitrarios por mano)
const montoCalculadoUC = computed(() => {
  const precio = Number(formulario_ap.value.precio_uc_base ?? 12);
  const uc = Number(formulario_ap.value.total_uc ?? 30);
  const arancel = Number(formulario_ap.value.arancel_admin ?? 20);
  const seguro = Number(formulario_ap.value.seguro_estudiantil ?? 10);
  const factor = formulario_ap.value.concepto_ap === 'PERIODO' ? 0.85 : 1.0; // 15% desc. bloque por período

  return Number(((arancel + seguro) + (uc * precio * factor)).toFixed(2));
});

const columnas_ap = [
  { name: 'concepto_ap', label: 'Concepto', field: 'concepto_ap', align: 'left', sortable: true },
  { name: 'descripcion_ap', label: 'Descripción / Desglose UC', field: 'descripcion_ap', align: 'left' },
  { name: 'monto_ap', label: 'Monto Total UC ($)', field: 'monto_ap', align: 'right', sortable: true, format: (v) => `$${Number(v).toFixed(2)}` },
  { name: 'activa_ap', label: 'Activa', field: 'activa_ap', align: 'center' },
  { name: 'creadoEn_ap', label: 'Creada', field: 'creadoEn_ap', align: 'left', format: (v) => v ? new Date(v).toLocaleDateString('es-VE') : '—' },
  { name: 'acciones_ap', label: 'Acciones', field: 'acciones_ap', align: 'center' },
];

const cargar_ap = async () => {
  cargando_ap.value = true;
  try {
    tarifas_ap.value = await obtenerTarifas_ap();
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar tarifas.' });
  } finally {
    cargando_ap.value = false;
  }
};

const abrirDialogo_ap = () => {
  formulario_ap.value = {
    concepto_ap: 'PERIODO',
    precio_uc_base: 12.00,
    total_uc: 30,
    arancel_admin: 20.00,
    seguro_estudiantil: 10.00,
    descripcion_ap: '',
    activa_ap: true,
  };
  dialogoAbierto_ap.value = true;
};

const guardar_ap = async () => {
  if (!formulario_ap.value.precio_uc_base || formulario_ap.value.precio_uc_base <= 0) {
    $q.notify({ type: 'warning', message: 'El precio por UC debe ser mayor a cero.' });
    return;
  }
  if (!formulario_ap.value.total_uc || formulario_ap.value.total_uc <= 0) {
    $q.notify({ type: 'warning', message: 'Indica la cantidad total de UC del plan de estudio.' });
    return;
  }

  guardando_ap.value = true;
  const payload = {
    ...formulario_ap.value,
    monto_ap: montoCalculadoUC.value,
  };

  const res_ap = await crearTarifa_ap(payload);
  guardando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    $q.notify({ type: 'positive', message: 'Tarifa basada en UC configurada correctamente.' });
    dialogoAbierto_ap.value = false;
    await cargar_ap();
  }
};

const toggleActiva_ap = async (tarifa_ap) => {
  const res_ap = await actualizarTarifa_ap(tarifa_ap.id_tarifa_ap, { activa_ap: !tarifa_ap.activa_ap });
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    tarifa_ap.activa_ap = !tarifa_ap.activa_ap;
    $q.notify({ type: 'positive', message: `Tarifa ${tarifa_ap.activa_ap ? 'activada' : 'desactivada'}.` });
  }
};

const confirmarEliminar_ap = (tarifa_ap) => {
  $q.dialog({
    title: 'Eliminar Tarifa',
    message: `¿Eliminar la tarifa "${tarifa_ap.descripcion_ap || tarifa_ap.concepto_ap}"? Si tiene pagos asociados no se podrá borrar.`,
    cancel: true,
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    const res_ap = await eliminarTarifa_ap(tarifa_ap.id_tarifa_ap);
    if (res_ap?.exito === false) {
      $q.notify({ type: 'negative', message: res_ap.mensaje });
    } else {
      $q.notify({ type: 'positive', message: 'Tarifa eliminada.' });
      await cargar_ap();
    }
  });
};

onMounted(cargar_ap);
</script>

<template>
  <q-page padding>
    <div class="page-header-ap q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold q-mb-xs">
            <q-icon name="payments" size="28px" class="q-mr-sm" color="primary" />
            Configuración de Tarifas de Pago por UC
          </div>
          <div class="text-caption text-grey-7">
            Calcula las tarifas automáticamente basadas en el costo por UC, aranceles y seguro
          </div>
        </div>
        <q-btn
          id="btn-nueva-tarifa-ap"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Nueva Tarifa basada en UC"
          @click="abrirDialogo_ap"
        />
      </div>
    </div>

    <q-card flat bordered class="rounded-xl hover-elevate">
      <q-table
        flat
        :rows="tarifas_ap"
        :columns="columnas_ap"
        row-key="id_tarifa_ap"
        :loading="cargando_ap"
        no-data-label="No hay tarifas registradas. Crea la primera."
      >
        <template #body-cell-activa_ap="props">
          <q-td :props="props" class="text-center">
            <q-badge
              :color="props.row.activa_ap ? 'positive' : 'grey-5'"
              :label="props.row.activa_ap ? 'Activa' : 'Inactiva'"
            />
          </q-td>
        </template>
        <template #body-cell-acciones_ap="props">
          <q-td :props="props" class="text-center q-gutter-x-sm">
            <q-btn
              :id="`btn-toggle-tarifa-${props.row.id_tarifa_ap}`"
              flat
              round
              dense
              size="sm"
              :icon="props.row.activa_ap ? 'toggle_on' : 'toggle_off'"
              :color="props.row.activa_ap ? 'positive' : 'grey'"
              :title="props.row.activa_ap ? 'Desactivar' : 'Activar'"
              @click="toggleActiva_ap(props.row)"
            />
            <q-btn
              :id="`btn-eliminar-tarifa-${props.row.id_tarifa_ap}`"
              flat
              round
              dense
              size="sm"
              icon="delete"
              color="negative"
              title="Eliminar"
              @click="confirmarEliminar_ap(props.row)"
            />
          </q-td>
        </template>
        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo nueva tarifa con Calculadora de UC -->
    <q-dialog v-model="dialogoAbierto_ap" persistent>
      <q-card style="width: 480px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Configurar Tarifa por UC</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-y-md q-mt-xs">
          <q-select
            v-model="formulario_ap.concepto_ap"
            :options="[{ label: 'PERÍODO COMPLETO (Trimestre)', value: 'PERIODO' }, { label: 'CURSO / MATERIA INDIVIDUAL', value: 'CURSO' }]"
            label="Concepto de Inscripción"
            outlined dense
            emit-value map-options
          />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model.number="formulario_ap.precio_uc_base"
                label="Costo Base por UC ($)"
                type="number" step="0.5" min="0.1"
                outlined dense prefix="$"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="formulario_ap.total_uc"
                label="Total UC Plan de Estudio"
                type="number" min="1"
                outlined dense suffix="UC"
              />
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model.number="formulario_ap.arancel_admin"
                label="Arancel Admin Fijo ($)"
                type="number" step="1" min="0"
                outlined dense prefix="$"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="formulario_ap.seguro_estudiantil"
                label="Seguro Estudiantil ($)"
                type="number" step="1" min="0"
                outlined dense prefix="$"
              />
            </div>
          </div>

          <!-- Banner Informativo del Cálculo Automático -->
          <q-banner rounded class="bg-indigo-1 text-indigo-10">
            <template #avatar><q-icon name="calculate" color="primary" size="28px" /></template>
            <div>
              <strong>Fórmula Aplicada:</strong> (Arancel ${{ formulario_ap.arancel_admin }} + Seguro ${{ formulario_ap.seguro_estudiantil }}) + ({{ formulario_ap.total_uc }} UC × ${{ formulario_ap.precio_uc_base }}/UC {{ formulario_ap.concepto_ap === 'PERIODO' ? '- 15% Bloque' : '' }})<br/>
              <span class="text-h6 text-weight-bold text-primary">Total Tarifa: ${{ montoCalculadoUC.toFixed(2) }} USD</span>
            </div>
          </q-banner>

          <q-input
            v-model="formulario_ap.descripcion_ap"
            label="Descripción / Nota (opcional)"
            outlined dense
            placeholder="Ej: Tarifa Regular Trimestre 2026-I"
          />
          <q-toggle
            v-model="formulario_ap.activa_ap"
            label="Tarifa activa"
            color="positive"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            id="btn-guardar-tarifa-ap"
            unelevated
            rounded
            color="primary"
            label="Guardar Tarifa"
            :loading="guardando_ap"
            @click="guardar_ap"
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
