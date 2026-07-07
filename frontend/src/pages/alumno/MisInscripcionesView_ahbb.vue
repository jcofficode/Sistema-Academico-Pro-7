<!-- MisInscripcionesView_ahbb.vue — Vista de inscripciones para el Alumno -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerInscripcionesPorAlumno_ahbb } from '../../servicios/inscripcionesServicio_ahbb';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';

const $q = useQuasar();
const authStore_ahbb = useAutenticacionStore_ahbb();

const inscripciones_ahbb = ref([]);
const cargando_ahbb = ref(false);
const filtroEstado_ahbb = ref('TODOS');

const opcionesFiltro_ahbb = [
  { label: 'Todas', value: 'TODOS' },
  { label: 'Inscrito', value: 'INSCRITO' },
  { label: 'Oyente', value: 'OYENTE' },
  { label: 'Aprobado', value: 'APROBADO' },
  { label: 'Reprobado', value: 'REPROBADO' },
];

const cargarInscripciones_ahbb = async () => {
  const idUsuario_ahbb = authStore_ahbb.usuarioActivo_ahbb?.id;
  if (!idUsuario_ahbb) return;

  cargando_ahbb.value = true;
  try {
    const data = await obtenerInscripcionesPorAlumno_ahbb(idUsuario_ahbb);
    // data viene como array de inscripciones con curso incluido
    inscripciones_ahbb.value = data;
  } catch (error) {
    console.error('Error cargando inscripciones:', error);
    $q.notify({ type: 'negative', message: 'Error al cargar tus inscripciones.' });
  } finally {
    cargando_ahbb.value = false;
  }
};

const inscripcionesFiltradas_ahbb = computed(() => {
  if (filtroEstado_ahbb.value === 'TODOS') return inscripciones_ahbb.value;
  return inscripciones_ahbb.value.filter(ins => ins.estatus_ahbb === filtroEstado_ahbb.value);
});

const obtenerColorEstado_ahbb = (estado) => {
  const m = {
    INSCRITO: 'blue',
    OYENTE: 'orange',
    APROBADO: 'positive',
    REPROBADO: 'negative'
  };
  return m[estado] || 'grey';
};

const obtenerIconoEstado_ahbb = (estado) => {
  const m = {
    INSCRITO: 'bookmark_border',
    OYENTE: 'play_circle_outline',
    APROBADO: 'check_circle',
    REPROBADO: 'cancel'
  };
  return m[estado] || 'help';
};

const formatearFecha_ahbb = (fecha) => {
  if (!fecha) return 'Por definir';
  return new Date(fecha).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatearHora12h_ahbb = (horaStr) => {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':').map(Number);
  const ampm = (horas ?? 0) >= 12 ? 'PM' : 'AM';
  const horas12 = (horas ?? 0) % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${String(minutos ?? 0).padStart(2, '0')} ${ampm}`;
};

// Polling cada 60s
useAutoRefresh_ahbb(cargarInscripciones_ahbb, 60_000);

onMounted(cargarInscripciones_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="text-h4 text-weight-bold q-mb-lg flex items-center text-primary">
      <q-icon name="assignment" class="q-mr-md" />
      Mis Inscripciones
    </div>

    <!-- Filtros -->
    <div class="row q-mb-md q-col-gutter-sm items-center">
      <div class="col-12 col-sm-auto">
        <span class="text-subtitle2 q-mr-sm">Filtrar por estado:</span>
        <q-btn-toggle
          v-model="filtroEstado_ahbb"
          toggle-color="primary"
          unelevated
          flat
          dense
          :options="opcionesFiltro_ahbb"
          class="bg-grey-2 rounded-borders"
        />
      </div>
      <q-space />
      <q-btn 
        flat 
        round 
        icon="refresh" 
        color="grey-7" 
        @click="cargarInscripciones_ahbb" 
        :loading="cargando_ahbb"
      />
    </div>

    <div v-if="cargando_ahbb && inscripciones_ahbb.length === 0" class="flex flex-center q-pa-xl">
      <q-spinner-tail color="primary" size="50px" />
    </div>

    <div v-else-if="inscripcionesFiltradas_ahbb.length === 0" class="flex flex-center q-pa-xl column text-grey-6">
      <q-icon name="no_accounts" size="4rem" color="grey-3" />
      <div class="text-h6 q-mt-md">No tienes inscripciones {{ filtroEstado_ahbb === 'TODOS' ? '' : 'con este estado' }}</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div 
        class="col-12 col-md-6" 
        v-for="ins in inscripcionesFiltradas_ahbb" 
        :key="ins.id_inscripcion_ahbb"
      >
        <q-card flat bordered class="rounded-xl shadow-1">
          <q-card-section class="q-pb-none">
            <div class="row no-wrap items-center">
              <div class="text-h6 text-weight-bold col ellipsis">{{ ins.curso.nombre_ahbb }}</div>
              <q-chip 
                :color="obtenerColorEstado_ahbb(ins.estatus_ahbb) + '-1'" 
                :text-color="obtenerColorEstado_ahbb(ins.estatus_ahbb) + '-9'"
                :icon="obtenerIconoEstado_ahbb(ins.estatus_ahbb)"
                class="text-weight-bold"
                size="sm"
              >
                {{ ins.estatus_ahbb }}
              </q-chip>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-icon name="person" color="grey-6" class="q-mr-xs" />
                <span class="text-subtitle2 grey-8">Profesor:</span> 
                {{ ins.curso.profesor.nombre_ahbb }} {{ ins.curso.profesor.apellido_ahbb }}
              </div>
              <div class="col-12">
                <q-icon name="event" color="primary" class="q-mr-xs" />
                <span class="text-subtitle2 grey-8">Inicia:</span> 
                <span class="text-weight-bold text-primary">{{ formatearFecha_ahbb(ins.curso.fechaInicio_ahbb) }}</span>
              </div>
              <div class="col-12">
                <q-icon name="schedule" color="secondary" class="q-mr-xs" />
                <span class="text-subtitle2 grey-8">Horario:</span> 
                <span class="text-weight-bold">{{ formatearHora12h_ahbb(ins.curso.horaInicio_ahbb) }} - {{ formatearHora12h_ahbb(ins.curso.horaFin_ahbb) }}</span>
              </div>

            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="primary" :to="`/cursos/${ins.curso.id_curso_ahbb}?from=inscripciones`" label="Ver Detalles del Curso" icon-right="arrow_forward" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rounded-xl { border-radius: 16px; }
.shadow-1 { box-shadow: 0 1px 5px rgba(0,0,0,0.1); }
</style>
