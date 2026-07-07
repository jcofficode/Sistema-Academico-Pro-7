<!--
  TablaCursos_ahbb.vue — Tabla de cursos con:
  - Badges de estado: ACTIVO (verde), PENDIENTE (ámbar), RECHAZADO (rojo), ARCHIVADO (gris).
  - Botones Aprobar/Rechazar solo visibles para Admin en cursos PENDIENTES.
  - Banner de rechazo visible para el Profesor si su curso fue RECHAZADO.
  - Emite eventos: 'eliminar', 'aprobar', 'rechazar'.
-->
<script setup>
import { computed } from 'vue';
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';

const cursosStore_ahbb = useCursosStore_ahbb();
const authStore_ahbb = useAutenticacionStore_ahbb();

const esAdmin_ahbb = computed(() => authStore_ahbb.esAdmin_ahbb);
const esProfesor_ahbb = computed(() => authStore_ahbb.esProfesor_ahbb);

const emit = defineEmits(['eliminar', 'aprobar', 'rechazar', 'editar', 'verMotivo']);

const columnas_ahbb = [
  { name: 'nombre', label: 'Curso', field: 'nombre', align: 'left', sortable: true },
  { name: 'profesor', label: 'Profesor', field: 'profesor', align: 'left', sortable: true },
  { name: 'fechaInicio', label: 'Fecha Inicio', field: 'fechaInicio', align: 'left', sortable: true },
  {
    name: 'duracion',
    label: 'Horas',
    field: 'duracionHoras',
    align: 'center',
    sortable: true,
    format: (val) => `${val}h`,
  },
  {
    name: 'dias',
    label: 'Días',
    field: 'dias',
    align: 'left',
    format: (val) =>
      val?.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ') || '—',
  },
  {
    name: 'horario',
    label: 'Horario',
    align: 'left',
    field: (row) => `${formatearHora12h_ahbb(row.horaInicio)} - ${formatearHora12h_ahbb(row.horaFin)}`,
  },
  {
    name: 'inscritos',
    label: 'Inscritos',
    align: 'center',
    field: (row) => `${row.estudiantesInscritos ?? 0}/${row.topeEstudiantes ?? '?'}`,
  },
  { name: 'estatus', label: 'Estado', field: 'estatus', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'center', field: '' },
];

const colorEstatus_ahbb = (estatus) => {
  const mapa = {
    activo: 'positive',
    iniciado: 'blue',
    pendiente: 'warning',
    rechazado: 'negative',
    inactivo: 'grey-7',
    archivado: 'grey-8',
  };
  return mapa[estatus] || 'grey';
};

const iconEstatus_ahbb = (estatus) => {
  const mapa = {
    activo: 'check_circle',
    iniciado: 'play_circle',
    pendiente: 'hourglass_top',
    rechazado: 'cancel',
    archivado: 'archive',
    inactivo: 'block',
  };
  return mapa[estatus] || 'help';
};

const formatearFecha_ahbb = (fecha) => {
  if (!fecha) return 'Por definir';
  
  let d;
  if (typeof fecha === 'string') {
    // Si es ISO (contiene T), extraemos solo la parte de la fecha
    const fechaLimpia = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    // Forzamos mediodía para evitar saltos de día por zona horaria
    d = new Date(fechaLimpia + 'T12:00:00');
  } else {
    d = new Date(fecha);
  }
  
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatearHora12h_ahbb = (horaStr) => {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':').map(Number);
  const ampm = horas >= 12 ? 'PM' : 'AM';
  const horas12 = horas % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${ampm}`;
};
</script>

<template>
  <q-table
    :rows="cursosStore_ahbb.cursosFiltrados_ahbb"
    :columns="columnas_ahbb"
    row-key="id"
    flat
    bordered
    :rows-per-page-options="[5, 10, 20, 0]"
    no-data-label="No se encontraron cursos con los filtros actuales."
  >
    <!-- Badge de estado -->
    <template v-slot:body-cell-estatus="props">
      <q-td :props="props">
      <q-chip
        :color="colorEstatus_ahbb(props.row.estatus)"
        text-color="white"
        dense
        class="text-weight-bold text-uppercase q-px-md"
        style="font-size: 0.7rem; border-radius: 12px"
      >
        <q-icon :name="iconEstatus_ahbb(props.row.estatus)" size="14px" class="q-mr-xs" />
        {{ props.row.estatus }}
      </q-chip>
      </q-td>
    </template>

    <!-- Slot de acciones -->
    <template v-slot:body-cell-acciones="props">
      <q-td :props="props">
        <!-- Botón Ver -->
        <q-btn flat dense round icon="visibility" color="primary" size="sm" :to="`/cursos/${props.row.id}`">
          <q-tooltip>Ver detalle</q-tooltip>
        </q-btn>

        <!-- Botón Editar (Admin y Profesor sobre sus propios cursos) -->
        <q-btn flat dense round icon="edit" color="info" size="sm" @click="emit('editar', props.row)">
          <q-tooltip>Editar</q-tooltip>
        </q-btn>

        <!-- Botones Aprobar/Rechazar: solo Admin, solo en cursos PENDIENTES -->
        <template v-if="esAdmin_ahbb && props.row.estatus === 'pendiente'">
          <q-btn flat dense round icon="check_circle" color="positive" size="sm" @click="emit('aprobar', props.row)">
            <q-tooltip>Aprobar curso</q-tooltip>
          </q-btn>
          <q-btn flat dense round icon="cancel" color="negative" size="sm" @click="emit('rechazar', props.row)">
            <q-tooltip>Rechazar curso</q-tooltip>
          </q-btn>
        </template>

        <!-- Botón Ver motivo: solo Profesor, solo en cursos RECHAZADOS -->
        <q-btn
          v-if="esProfesor_ahbb && props.row.estatus === 'rechazado'"
          flat dense round icon="feedback" color="warning" size="sm"
          @click="emit('verMotivo', props.row)"
        >
          <q-tooltip>Ver motivo de rechazo</q-tooltip>
        </q-btn>

        <!-- Botón Eliminar (Admin y Profesor) -->
        <q-btn flat dense round icon="delete" color="negative" size="sm" @click="emit('eliminar', props.row)">
          <q-tooltip>Eliminar</q-tooltip>
        </q-btn>
      </q-td>
    </template>

    <!-- Banner de rechazo en fila (Profesor) -->
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td v-for="col in props.cols" :key="col.name" :props="props">
          <template v-if="col.name === 'estatus'">
            <q-chip
              :color="col.value === 'iniciado' ? 'blue' : colorEstatus_ahbb(col.value)"
              text-color="white"
              dense
              class="text-weight-bold text-uppercase q-px-md"
              style="font-size: 0.7rem; border-radius: 12px"
              :label="col.value"
            >
              <q-icon :name="iconEstatus_ahbb(col.value)" size="14px" class="q-mr-xs" />
            </q-chip>
          </template>
          <template v-else-if="col.name === 'fechaInicio'">
            <div class="row items-center no-wrap">
              <q-icon name="calendar_today" color="grey-6" class="q-mr-xs" size="xs" />
              {{ formatearFecha_ahbb(col.value) }}
            </div>
          </template>
          <template v-else-if="col.name === 'acciones'">
            <!-- Botón Ver -->
        <q-btn flat dense round icon="visibility" color="primary" size="sm" :to="`/cursos/${props.row.id}?from=cursos`">
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
            <!-- Botón Editar -->
            <q-btn flat dense round icon="edit" color="info" size="sm" @click="emit('editar', props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <!-- Aprobar/Rechazar Admin en cursos pendientes -->
            <template v-if="esAdmin_ahbb && props.row.estatus === 'pendiente'">
              <q-btn flat dense round icon="check_circle" color="positive" size="sm" @click="emit('aprobar', props.row)">
                <q-tooltip>Aprobar curso</q-tooltip>
              </q-btn>
              <q-btn flat dense round icon="cancel" color="negative" size="sm" @click="emit('rechazar', props.row)">
                <q-tooltip>Rechazar curso</q-tooltip>
              </q-btn>
            </template>
            <!-- Ver motivo rechazo (Profesor) -->
            <q-btn
              v-if="esProfesor_ahbb && props.row.estatus === 'rechazado'"
              flat dense round icon="feedback" color="warning" size="sm"
              @click="emit('verMotivo', props.row)"
            >
              <q-tooltip>Ver motivo de rechazo</q-tooltip>
            </q-btn>
            <!-- Eliminar -->
            <q-btn flat dense round icon="delete" color="negative" size="sm" @click="emit('eliminar', props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </template>
          <template v-else>
            {{ col.value }}
          </template>
        </q-td>
      </q-tr>
      <!-- Fila expandida con motivo de rechazo (Profesor) -->
      <q-tr v-if="esProfesor_ahbb && props.row.estatus === 'rechazado'" :props="props">
        <q-td colspan="100%">
          <q-banner rounded class="bg-red-1 text-red-9 q-ma-xs">
            <template v-slot:avatar>
              <q-icon name="info" color="negative" />
            </template>
            <strong>Motivo de rechazo:</strong>
            {{ props.row.motivoRechazo || 'Sin especificar. Contacta a la administración.' }}
            <template v-slot:action>
              <q-btn flat color="negative" label="Editar y reenviar" @click="emit('editar', props.row)" />
            </template>
          </q-banner>
        </q-td>
      </q-tr>
    </template>

    <!-- Estado vacío -->
    <template v-slot:no-data>
      <div class="full-width column items-center q-pa-xl text-grey-5">
        <q-icon name="inbox" size="3rem" class="q-mb-sm" />
        <div>No se encontraron cursos con los filtros actuales.</div>
      </div>
    </template>
  </q-table>
</template>
