<!--
  TarifasView_ap.vue — Gestión de Tarifas de Pago (Admin).
  CRUD completo: crear, editar (toggle activo) y eliminar tarifas.
-->
<script setup>
import { ref, onMounted } from 'vue';
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
  monto_ap: null,
  descripcion_ap: '',
  activa_ap: true,
});

const columnas_ap = [
  { name: 'concepto_ap', label: 'Concepto', field: 'concepto_ap', align: 'left', sortable: true },
  { name: 'descripcion_ap', label: 'Descripción', field: 'descripcion_ap', align: 'left' },
  { name: 'monto_ap', label: 'Monto (Bs.)', field: 'monto_ap', align: 'right', sortable: true, format: (v) => Number(v).toFixed(2) },
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
  formulario_ap.value = { concepto_ap: 'PERIODO', monto_ap: null, descripcion_ap: '', activa_ap: true };
  dialogoAbierto_ap.value = true;
};

const guardar_ap = async () => {
  if (!formulario_ap.value.monto_ap || formulario_ap.value.monto_ap <= 0) {
    $q.notify({ type: 'warning', message: 'El monto debe ser mayor a cero.' });
    return;
  }
  guardando_ap.value = true;
  const res_ap = await crearTarifa_ap(formulario_ap.value);
  guardando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    $q.notify({ type: 'positive', message: 'Tarifa creada correctamente.' });
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
            Tarifas de Pago
          </div>
          <div class="text-caption text-grey-7">
            Configura los montos que pagan los alumnos por período o curso
          </div>
        </div>
        <q-btn
          id="btn-nueva-tarifa-ap"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Nueva Tarifa"
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

    <!-- Diálogo nueva tarifa -->
    <q-dialog v-model="dialogoAbierto_ap" persistent>
      <q-card style="width: 440px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Nueva Tarifa</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-y-md q-mt-xs">
          <q-select
            v-model="formulario_ap.concepto_ap"
            :options="['PERIODO', 'CURSO']"
            label="Concepto"
            outlined
            dense
          />
          <q-input
            v-model.number="formulario_ap.monto_ap"
            label="Monto (Bs.)"
            type="number"
            step="0.01"
            min="0.01"
            outlined
            dense
            prefix="Bs."
          />
          <q-input
            v-model="formulario_ap.descripcion_ap"
            label="Descripción (opcional)"
            outlined
            dense
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
            label="Guardar"
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
