<!-- PeriodosView_cjgp.vue — Gestión de Períodos Académicos (Administrador) -->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerPeriodos_cjgp,
  crearPeriodo_cjgp,
  activarPeriodo_cjgp,
  eliminarPeriodo_cjgp,
} from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();

const periodos_cjgp = ref([]);
const cargando_cjgp = ref(true);
const dialogoNuevo_cjgp = ref(false);
const guardando_cjgp = ref(false);
const nuevoPeriodo_cjgp = ref({
  nombre_cjgp: '',
  fechaInicio_cjgp: '',
  fechaFin_cjgp: '',
  activo_cjgp: false,
});

const columnas_cjgp = [
  { name: 'nombre', label: 'Período', field: 'nombre_cjgp', align: 'left', sortable: true },
  { name: 'inicio', label: 'Inicio', field: 'fechaInicio_cjgp', align: 'center' },
  { name: 'fin', label: 'Fin', field: 'fechaFin_cjgp', align: 'center' },
  { name: 'inscripciones', label: 'Inscripciones', field: (fila) => fila._count?.inscripciones_cjgp ?? 0, align: 'center' },
  { name: 'estado', label: 'Estado', field: 'activo_cjgp', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

const formatearFecha_cjgp = (fecha_cjgp) =>
  fecha_cjgp ? new Date(fecha_cjgp).toLocaleDateString('es-VE', { timeZone: 'UTC' }) : '—';

const cargar_cjgp = async () => {
  cargando_cjgp.value = true;
  try {
    periodos_cjgp.value = await obtenerPeriodos_cjgp();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los períodos.' });
  } finally {
    cargando_cjgp.value = false;
  }
};

const guardar_cjgp = async () => {
  if (!nuevoPeriodo_cjgp.value.nombre_cjgp.trim() || !nuevoPeriodo_cjgp.value.fechaInicio_cjgp || !nuevoPeriodo_cjgp.value.fechaFin_cjgp) {
    $q.notify({ type: 'warning', message: 'Completa el nombre y las fechas del período.' });
    return;
  }
  guardando_cjgp.value = true;
  const resultado_cjgp = await crearPeriodo_cjgp(nuevoPeriodo_cjgp.value);
  guardando_cjgp.value = false;

  $q.notify({ type: resultado_cjgp.exito ? 'positive' : 'negative', message: resultado_cjgp.mensaje });
  if (resultado_cjgp.exito) {
    dialogoNuevo_cjgp.value = false;
    nuevoPeriodo_cjgp.value = { nombre_cjgp: '', fechaInicio_cjgp: '', fechaFin_cjgp: '', activo_cjgp: false };
    cargar_cjgp();
  }
};

const activar_cjgp = async (periodo_cjgp) => {
  const resultado_cjgp = await activarPeriodo_cjgp(periodo_cjgp.id_periodo_cjgp);
  $q.notify({ type: resultado_cjgp.exito ? 'positive' : 'negative', message: resultado_cjgp.mensaje });
  if (resultado_cjgp.exito) cargar_cjgp();
};

const eliminar_cjgp = (periodo_cjgp) => {
  $q.dialog({
    title: 'Eliminar período',
    message: `¿Eliminar el período "${periodo_cjgp.nombre_cjgp}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    const resultado_cjgp = await eliminarPeriodo_cjgp(periodo_cjgp.id_periodo_cjgp);
    $q.notify({ type: resultado_cjgp.exito ? 'positive' : 'negative', message: resultado_cjgp.mensaje });
    if (resultado_cjgp.exito) cargar_cjgp();
  });
};

onMounted(cargar_cjgp);
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Períodos Académicos</div>
        <div class="text-caption text-grey-7">
          El período activo rige inscripciones y carga de notas.
        </div>
      </div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nuevo período" @click="dialogoNuevo_cjgp = true" />
    </div>

    <q-table
      :rows="periodos_cjgp"
      :columns="columnas_cjgp"
      row-key="id_periodo_cjgp"
      :loading="cargando_cjgp"
      flat
      bordered
      no-data-label="No hay períodos registrados."
    >
      <template #body-cell-inicio="props">
        <q-td :props="props">{{ formatearFecha_cjgp(props.row.fechaInicio_cjgp) }}</q-td>
      </template>
      <template #body-cell-fin="props">
        <q-td :props="props">{{ formatearFecha_cjgp(props.row.fechaFin_cjgp) }}</q-td>
      </template>
      <template #body-cell-estado="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="props.row.activo_cjgp ? 'green-1' : 'grey-3'"
            :text-color="props.row.activo_cjgp ? 'green-9' : 'grey-8'"
            :icon="props.row.activo_cjgp ? 'radio_button_checked' : 'radio_button_unchecked'"
          >
            {{ props.row.activo_cjgp ? 'ACTIVO' : 'Cerrado' }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            v-if="!props.row.activo_cjgp"
            flat
            dense
            color="positive"
            icon="play_circle"
            label="Activar"
            @click="activar_cjgp(props.row)"
          />
          <q-btn flat round dense color="negative" icon="delete" @click="eliminar_cjgp(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogoNuevo_cjgp">
      <q-card style="min-width: 380px">
        <q-card-section class="text-h6">Nuevo período académico</q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="nuevoPeriodo_cjgp.nombre_cjgp" label="Nombre (ej. 2027-I)" outlined dense maxlength="30" />
          <q-input v-model="nuevoPeriodo_cjgp.fechaInicio_cjgp" label="Fecha de inicio" outlined dense type="date" stack-label />
          <q-input v-model="nuevoPeriodo_cjgp.fechaFin_cjgp" label="Fecha de fin" outlined dense type="date" stack-label />
          <q-toggle v-model="nuevoPeriodo_cjgp.activo_cjgp" label="Activar inmediatamente (desactiva el actual)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" :loading="guardando_cjgp" @click="guardar_cjgp" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
