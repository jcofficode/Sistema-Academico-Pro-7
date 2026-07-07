<!-- InscripcionesView_ahbb.vue — Panel de Suscripciones de Alumnos (Administrador) -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';
import {
  obtenerAlumnosSuscripciones_ahbb,
  aprobarAlumno_ahbb,
  aprobarAlumnosMasivo_ahbb,
} from '../../servicios/usuariosServicio_ahbb';

const $q = useQuasar();

const alumnos_ahbb = ref([]);
const cargando_ahbb = ref(true);
const busqueda_ahbb = ref('');
const filtroEstado_ahbb = ref('TODOS');
const seleccionados_ahbb = ref([]);
const aprobandoMasivo_ahbb = ref(false);

const estadoOpciones_ahbb = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'En Revisión', value: 'PENDIENTE_APROBACION' },
  { label: 'Activos', value: 'ACTIVO' },
  { label: 'Inactivos', value: 'INACTIVO' },
];

const columnas_ahbb = [
  { name: 'seleccionar', label: '', field: 'seleccionar', align: 'center', style: 'width: 50px' },
  { name: 'nombre', label: 'Nombre', field: row => `${row.nombre} ${row.apellido}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: 'cedula', align: 'left', sortable: true },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'referencia', label: 'Ref. Pago Móvil', field: 'referenciaPagoMovil', align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estadoCuenta', align: 'center', sortable: true },
  { name: 'fecha', label: 'Fecha Registro', field: 'creadoEn', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

const alumnosFiltrados_ahbb = computed(() => {
  let resultado = alumnos_ahbb.value;
  if (filtroEstado_ahbb.value !== 'TODOS') {
    resultado = resultado.filter(a => a.estadoCuenta === filtroEstado_ahbb.value);
  }
  if (busqueda_ahbb.value.trim()) {
    const q = busqueda_ahbb.value.trim().toLowerCase();
    resultado = resultado.filter(a =>
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(q) ||
      a.correo?.toLowerCase().includes(q) ||
      a.cedula?.toLowerCase().includes(q)
    );
  }
  return resultado;
});

const totalPendientes_ahbb = computed(() =>
  alumnos_ahbb.value.filter(a => a.estadoCuenta === 'PENDIENTE_APROBACION').length
);

const pendientesSeleccionados_ahbb = computed(() =>
  seleccionados_ahbb.value.filter(a => a.estadoCuenta === 'PENDIENTE_APROBACION')
);

const cargarAlumnos_ahbb = async () => {
  cargando_ahbb.value = true;
  try {
    alumnos_ahbb.value = await obtenerAlumnosSuscripciones_ahbb();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los alumnos.' });
  } finally {
    cargando_ahbb.value = false;
  }
};

const aprobarUno_ahbb = async (alumno) => {
  $q.dialog({
    title: `Aprobar a ${alumno.nombre} ${alumno.apellido}`,
    message: `Ref. de Pago: <strong>${alumno.referenciaPagoMovil || 'No registrada'}</strong><br/>¿Confirmas la aprobación? Se enviará un correo con sus credenciales de acceso.`,
    html: true,
    ok: { label: 'Sí, Aprobar', color: 'positive', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(async () => {
    try {
      await aprobarAlumno_ahbb(alumno.id, alumno.referenciaPagoMovil || 'sin-referencia');
      $q.notify({ type: 'positive', message: `✅ ${alumno.nombre} aprobado. Correo enviado.` });
      await cargarAlumnos_ahbb();
      seleccionados_ahbb.value = [];
    } catch (error) {
      $q.notify({ type: 'negative', message: error?.response?.data?.message || 'Error al aprobar alumno.' });
    }
  });
};

const aprobarMasivo_ahbb = async () => {
  const pendientes = pendientesSeleccionados_ahbb.value;
  if (!pendientes.length) {
    $q.notify({ type: 'warning', message: 'Selecciona al menos un alumno en estado "En Revisión".' });
    return;
  }
  $q.dialog({
    title: 'Aprobación Masiva',
    message: `¿Aprobar a <strong>${pendientes.length}</strong> alumno(s) seleccionado(s)? Se enviará un correo a cada uno con sus credenciales.`,
    html: true,
    ok: { label: `Aprobar ${pendientes.length}`, color: 'positive', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(async () => {
    aprobandoMasivo_ahbb.value = true;
    try {
      const ids = pendientes.map(a => a.id);
      const resultado = await aprobarAlumnosMasivo_ahbb(ids);
      $q.notify({ type: 'positive', message: `✅ ${resultado.aprobados} alumno(s) aprobados exitosamente.` });
      await cargarAlumnos_ahbb();
      seleccionados_ahbb.value = [];
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error en la aprobación masiva.' });
    } finally {
      aprobandoMasivo_ahbb.value = false;
    }
  });
};

const aprobarTodosPendientes_ahbb = async () => {
  const pendientes = alumnos_ahbb.value.filter(a => a.estadoCuenta === 'PENDIENTE_APROBACION');
  if (!pendientes.length) {
    $q.notify({ type: 'info', message: 'No hay alumnos pendientes de aprobación.' });
    return;
  }
  $q.dialog({
    title: 'Aprobar TODOS los Pendientes',
    message: `¿Aprobar a los <strong>${pendientes.length}</strong> alumno(s) en revisión? Esta acción no puede deshacerse.`,
    html: true,
    ok: { label: `Aprobar los ${pendientes.length}`, color: 'positive', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(async () => {
    aprobandoMasivo_ahbb.value = true;
    try {
      const ids = pendientes.map(a => a.id);
      const resultado = await aprobarAlumnosMasivo_ahbb(ids);
      $q.notify({ type: 'positive', message: `✅ ${resultado.aprobados} alumno(s) aprobados. Correos enviados.` });
      await cargarAlumnos_ahbb();
      seleccionados_ahbb.value = [];
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al aprobar todos los pendientes.' });
    } finally {
      aprobandoMasivo_ahbb.value = false;
    }
  });
};

const colorEstado_ahbb = (estado) => {
  if (estado === 'PENDIENTE_APROBACION') return 'warning';
  if (estado === 'ACTIVO') return 'positive';
  if (estado === 'INACTIVO') return 'negative';
  return 'grey';
};

const etiquetaEstado_ahbb = (estado) => {
  if (estado === 'PENDIENTE_APROBACION') return 'En Revisión';
  if (estado === 'ACTIVO') return 'Activo';
  if (estado === 'INACTIVO') return 'Inactivo';
  return estado;
};

const formatearFecha_ahbb = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Polling: recarga la lista cada 30 segundos para detectar nuevas inscripciones
useAutoRefresh_ahbb(cargarAlumnos_ahbb, 30_000, false);

onMounted(cargarAlumnos_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center q-gutter-sm">
        <q-icon name="how_to_reg" size="2rem" color="primary" />
        <div>
          <div class="text-h5 text-weight-bold">Inscripciones y Suscripciones</div>
          <div class="text-caption text-grey-6">Gestión de membresías de alumnos</div>
        </div>
        <!-- Punto rojo si hay pendientes -->
        <q-badge v-if="totalPendientes_ahbb > 0" color="negative" rounded class="q-ml-sm" style="font-size: 0.8rem; padding: 4px 8px;">
          {{ totalPendientes_ahbb }} pendiente{{ totalPendientes_ahbb > 1 ? 's' : '' }}
        </q-badge>
      </div>

      <!-- Acciones masivas -->
      <div class="row q-gutter-sm">
        <q-btn
          v-if="pendientesSeleccionados_ahbb.length > 0"
          unelevated
          color="positive"
          icon="done_all"
          :label="`Aprobar seleccionados (${pendientesSeleccionados_ahbb.length})`"
          @click="aprobarMasivo_ahbb"
          :loading="aprobandoMasivo_ahbb"
        />
        <q-btn
          unelevated
          color="primary"
          icon="supervisor_account"
          label="Aprobar todos los pendientes"
          @click="aprobarTodosPendientes_ahbb"
          :loading="aprobandoMasivo_ahbb"
          :disable="totalPendientes_ahbb === 0"
        />
      </div>
    </div>

    <!-- Tarjetas resumen de estado -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h3 text-warning text-weight-bold">{{ totalPendientes_ahbb }}</div>
          <div class="text-body2 text-grey-7">En Revisión</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h3 text-positive text-weight-bold">
            {{ alumnos_ahbb.filter(a => a.estadoCuenta === 'ACTIVO').length }}
          </div>
          <div class="text-body2 text-grey-7">Activos</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h3 text-primary text-weight-bold">{{ alumnos_ahbb.length }}</div>
          <div class="text-body2 text-grey-7">Total Alumnos</div>
        </q-card>
      </div>
    </div>

    <!-- Filtros -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-7">
        <q-input v-model="busqueda_ahbb" outlined dense placeholder="Buscar por nombre, cédula o correo...">
          <template v-slot:prepend><q-icon name="search" /></template>
          <template v-slot:append>
            <q-icon v-if="busqueda_ahbb" name="close" class="cursor-pointer" @click="busqueda_ahbb = ''" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-5">
        <q-btn-toggle
          v-model="filtroEstado_ahbb"
          :options="estadoOpciones_ahbb"
          unelevated
          rounded
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          class="full-width"
        />
      </div>
    </div>

    <!-- Tabla de alumnos -->
    <q-card flat bordered>
      <q-table
        :rows="alumnosFiltrados_ahbb"
        :columns="columnas_ahbb"
        row-key="id"
        :loading="cargando_ahbb"
        :filter="busqueda_ahbb"
        selection="multiple"
        v-model:selected="seleccionados_ahbb"
        flat
        binary-state-sort
        :rows-per-page-options="[10, 25, 50, 0]"
        rows-per-page-label="Filas por página"
        no-data-label="No se encontraron alumnos"
        loading-label="Cargando..."
      >
        <!-- Estado con badge de color -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="colorEstado_ahbb(props.row.estadoCuenta)" :label="etiquetaEstado_ahbb(props.row.estadoCuenta)" rounded />
          </q-td>
        </template>

        <!-- Referencia de pago -->
        <template v-slot:body-cell-referencia="props">
          <q-td :props="props" class="text-center">
            <span v-if="props.row.referenciaPagoMovil" class="text-mono text-caption bg-grey-2 q-px-sm q-py-xs" style="border-radius: 4px;">
              {{ props.row.referenciaPagoMovil }}
            </span>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>

        <!-- Fecha -->
        <template v-slot:body-cell-fecha="props">
          <q-td :props="props" class="text-center text-caption">
            {{ formatearFecha_ahbb(props.row.creadoEn) }}
          </q-td>
        </template>

        <!-- Acciones -->
        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <q-btn
              v-if="props.row.estadoCuenta === 'PENDIENTE_APROBACION'"
              unelevated
              color="positive"
              icon="check_circle"
              label="Aprobar"
              size="sm"
              @click="aprobarUno_ahbb(props.row)"
            />
            <q-chip v-else-if="props.row.estadoCuenta === 'ACTIVO'" color="positive" text-color="white" icon="verified" dense>
              Membresía Activa
            </q-chip>
            <span v-else class="text-grey-5 text-caption">Sin acción</span>
          </q-td>
        </template>

        <!-- Estado de carga -->
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>

        <!-- Sin datos -->
        <template v-slot:no-data="{ message }">
          <div class="full-width flex flex-center column q-pa-xl text-grey-6">
            <q-icon name="how_to_reg" size="4rem" class="q-mb-md" />
            <div class="text-h6">{{ message }}</div>
            <div class="text-caption q-mt-xs">
              {{ filtroEstado_ahbb !== 'TODOS' ? 'Prueba con otro filtro de estado' : 'Aún no hay alumnos registrados en el sistema' }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>
  </div>
</template>
