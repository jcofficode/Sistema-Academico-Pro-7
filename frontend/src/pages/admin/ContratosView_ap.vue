<!--
  ContratosView_ap.vue — Gestión de contratos de profesores (Admin).
  CRUD: crear/actualizar contrato por profesor, desactivar.
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerContratos_ap,
  crearContrato_ap,
  desactivarContrato_ap,
} from '../../servicios/pagosServicio_ap';
import { obtenerProfesoresParaSelect_ahbb } from '../../servicios/usuariosServicio_ahbb';

const $q = useQuasar();
const contratos_ap = ref([]);
const profesores_ap = ref([]);
const cargando_ap = ref(false);
const dialogoAbierto_ap = ref(false);
const guardando_ap = ref(false);

const formulario_ap = ref({
  id_profesor_ap: null,
  tipo_ap: 'FIJO',
  monto_ap: null,
});

const columnas_ap = [
  { name: 'profesor', label: 'Docente', field: (r) => `${r.profesor_ap?.apellido_ahbb}, ${r.profesor_ap?.nombre_ahbb}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: (r) => r.profesor_ap?.cedula_ahbb, align: 'left' },
  { name: 'tipo_ap', label: 'Tipo', field: 'tipo_ap', align: 'center' },
  { name: 'monto_ap', label: 'Monto (Bs.)', field: 'monto_ap', align: 'right', format: (v) => `${Number(v).toFixed(2)}` },
  { name: 'activo_ap', label: 'Estado', field: 'activo_ap', align: 'center' },
  { name: 'creadoEn_ap', label: 'Creado', field: 'creadoEn_ap', align: 'left', format: (v) => v ? new Date(v).toLocaleDateString('es-VE') : '—' },
  { name: 'acciones_ap', label: 'Acciones', field: 'acciones_ap', align: 'center' },
];

const cargar_ap = async () => {
  cargando_ap.value = true;
  try {
    const [contratosData_ap, usuariosData_ap] = await Promise.all([
      obtenerContratos_ap(),
      obtenerProfesoresParaSelect_ahbb(),
    ]);
    contratos_ap.value = contratosData_ap;
    profesores_ap.value = (usuariosData_ap ?? [])
      .map((u_ap) => ({
        label: `${u_ap.apellido_ahbb}, ${u_ap.nombre_ahbb} (${u_ap.cedula_ahbb})`,
        value: u_ap.id_usuario_ahbb,
      }));
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar los contratos.' });
  } finally {
    cargando_ap.value = false;
  }
};


const abrirDialogo_ap = () => {
  formulario_ap.value = { id_profesor_ap: null, tipo_ap: 'FIJO', monto_ap: null };
  dialogoAbierto_ap.value = true;
};

const guardar_ap = async () => {
  if (!formulario_ap.value.id_profesor_ap) {
    $q.notify({ type: 'warning', message: 'Selecciona un docente.' });
    return;
  }
  if (!formulario_ap.value.monto_ap || formulario_ap.value.monto_ap <= 0) {
    $q.notify({ type: 'warning', message: 'El monto debe ser mayor a cero.' });
    return;
  }
  guardando_ap.value = true;
  const res_ap = await crearContrato_ap({
    id_profesor_ap: formulario_ap.value.id_profesor_ap,
    tipo_ap: formulario_ap.value.tipo_ap,
    monto_ap: formulario_ap.value.monto_ap,
  });
  guardando_ap.value = false;
  if (res_ap?.exito === false) {
    $q.notify({ type: 'negative', message: res_ap.mensaje });
  } else {
    $q.notify({ type: 'positive', message: 'Contrato guardado correctamente.' });
    dialogoAbierto_ap.value = false;
    await cargar_ap();
  }
};

const desactivar_ap = (contrato_ap) => {
  $q.dialog({
    title: 'Desactivar Contrato',
    message: `¿Desactivar el contrato de ${contrato_ap.profesor_ap?.nombre_ahbb}?`,
    cancel: true,
    ok: { label: 'Desactivar', color: 'negative' },
  }).onOk(async () => {
    const res_ap = await desactivarContrato_ap(contrato_ap.id_contrato_ap);
    if (res_ap?.exito === false) {
      $q.notify({ type: 'negative', message: res_ap.mensaje });
    } else {
      $q.notify({ type: 'positive', message: 'Contrato desactivado.' });
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
            <q-icon name="badge" size="28px" class="q-mr-sm" color="primary" />
            Contratos de Docentes
          </div>
          <div class="text-caption text-grey-7">
            Define si un docente cobra sueldo fijo o por hora dictada
          </div>
        </div>
        <q-btn id="btn-nuevo-contrato-ap" unelevated rounded color="primary" icon="add" label="Nuevo Contrato" @click="abrirDialogo_ap" />
      </div>
    </div>

    <q-card flat bordered class="rounded-xl hover-elevate">
      <q-table
        flat
        :rows="contratos_ap"
        :columns="columnas_ap"
        row-key="id_contrato_ap"
        :loading="cargando_ap"
        no-data-label="No hay contratos registrados."
      >
        <template #body-cell-tipo_ap="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              :color="props.row.tipo_ap === 'FIJO' ? 'indigo-6' : 'teal-6'"
              text-color="white"
              :label="props.row.tipo_ap === 'FIJO' ? 'Fijo' : 'Por Hora'"
            />
          </q-td>
        </template>
        <template #body-cell-activo_ap="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.row.activo_ap ? 'positive' : 'grey-5'" :label="props.row.activo_ap ? 'Activo' : 'Inactivo'" />
          </q-td>
        </template>
        <template #body-cell-acciones_ap="props">
          <q-td :props="props" class="text-center">
            <q-btn
              v-if="props.row.activo_ap"
              :id="`btn-desactivar-contrato-${props.row.id_contrato_ap}`"
              flat dense round size="sm" icon="block" color="negative"
              title="Desactivar" @click="desactivar_ap(props.row)"
            />
          </q-td>
        </template>
        <template #loading><q-inner-loading showing color="primary" /></template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogoAbierto_ap" persistent>
      <q-card style="width: 440px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Registrar / Actualizar Contrato</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-y-md q-mt-xs">
          <q-select
            v-model="formulario_ap.id_profesor_ap"
            :options="profesores_ap"
            label="Docente"
            outlined dense
            emit-value map-options
            no-data-label="No se encontraron docentes"
          />
          <q-select
            v-model="formulario_ap.tipo_ap"
            :options="[{ label: 'Sueldo Fijo (mensual)', value: 'FIJO' }, { label: 'Por Hora dictada', value: 'POR_HORA' }]"
            label="Tipo de Contrato"
            outlined dense
            emit-value map-options
          />
          <q-input
            v-model.number="formulario_ap.monto_ap"
            :label="formulario_ap.tipo_ap === 'FIJO' ? 'Sueldo Mensual (Bs.)' : 'Tarifa por Hora (Bs./h)'"
            type="number" step="0.01" min="0.01"
            outlined dense prefix="Bs."
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn id="btn-guardar-contrato-ap" unelevated rounded color="primary" label="Guardar" :loading="guardando_ap" @click="guardar_ap" />
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
