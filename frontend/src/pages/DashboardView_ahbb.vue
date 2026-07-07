<!--
  DashboardView_ahbb.vue — Panel principal con Quasar
-->
<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useCursosStore_ahbb } from '../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import { obtenerEstadisticasDashboard_ahbb } from '../servicios/dashboardServicio_ahbb';
import { useAutoRefresh_ahbb } from '../composables/useAutoRefresh_ahbb';

const cursosStore_ahbb = useCursosStore_ahbb();
const authStore_ahbb = useAutenticacionStore_ahbb();

const statsDynamic_ahbb = ref(null);
const isLoadingStats_ahbb = ref(true);

const recargarEstadisticas_ahbb = async () => {
  try {
    statsDynamic_ahbb.value = await obtenerEstadisticasDashboard_ahbb() || {};
  } finally {
    isLoadingStats_ahbb.value = false;
  }
};

// Polling cada 60s: las métricas del dashboard se mantienen frescas sin recargar la página
useAutoRefresh_ahbb(recargarEstadisticas_ahbb, 60_000);

// Cuando el usuario vuelve a la pestaña (visibilitychange), refrescar inmediatamente
const onVisible_ahbb = () => {
  if (document.visibilityState === 'visible') void recargarEstadisticas_ahbb();
};
onMounted(() => document.addEventListener('visibilitychange', onVisible_ahbb));
onUnmounted(() => document.removeEventListener('visibilitychange', onVisible_ahbb));

const isAdmin_ahbb = computed(() => authStore_ahbb.esAdmin_ahbb);
const isTeacher_ahbb = computed(() => authStore_ahbb.esProfesor_ahbb);
const isStudent_ahbb = computed(() => authStore_ahbb.esAlumno_ahbb);

const formatStat_ahbb = (val) => val != null ? val : '...';

const estadisticas_admin_ahbb = computed(() => [
  { icono: 'school', color: 'primary', etiqueta: 'Total Cursos', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCursos) },
  { icono: 'check_circle', color: 'positive', etiqueta: 'Cursos Activos', valor: formatStat_ahbb(statsDynamic_ahbb.value?.cursosActivos) },
  { icono: 'groups', color: 'info', etiqueta: 'Estudiantes Totales', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalEstudiantes) },
  { icono: 'pending', color: 'warning', etiqueta: 'Alumnos Pendientes', valor: formatStat_ahbb(statsDynamic_ahbb.value?.alumnosPendientes) },
]);

const estadisticas_profesor_ahbb = computed(() => [
  { icono: 'school', color: 'primary', etiqueta: 'Mis Cursos Reales', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCursos) },
  { icono: 'check_circle', color: 'positive', etiqueta: 'Cursos P. Activos', valor: formatStat_ahbb(statsDynamic_ahbb.value?.cursosActivos) },
  { icono: 'groups', color: 'info', etiqueta: 'Estudiantes a mi cargo', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalEstudiantes) },
]);

const estadisticas_alumno_ahbb = computed(() => [
  { icono: 'menu_book', color: 'primary', etiqueta: 'Cursos Inscritos', valor: formatStat_ahbb(statsDynamic_ahbb.value?.cursosInscritos) },
  { icono: 'workspace_premium', color: 'positive', etiqueta: 'Certificados', valor: formatStat_ahbb(statsDynamic_ahbb.value?.certificados) },
]);

const estadisticasActuales_ahbb = computed(() => {
  if (isAdmin_ahbb.value) return estadisticas_admin_ahbb.value;
  if (isTeacher_ahbb.value) return estadisticas_profesor_ahbb.value;
  if (isStudent_ahbb.value) return estadisticas_alumno_ahbb.value;
  return [];
});
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Panel Principal</div>
        <div class="text-grey-6">Bienvenido, {{ authStore_ahbb.nombreCompleto_ahbb }}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="(stat, idx) in estadisticasActuales_ahbb"
        :key="stat.etiqueta + idx"
        class="col-12 col-sm-6"
        :class="estadisticasActuales_ahbb.length === 2 ? 'col-md-6' : (estadisticasActuales_ahbb.length === 3 ? 'col-md-4' : 'col-md-3')"
      >
        <q-card flat bordered>
          <q-card-section class="row items-center q-gutter-md">
            <q-avatar :color="stat.color" text-color="white" :icon="stat.icono" size="50px" />
            <div>
              <div class="text-h4 text-weight-bold">
                 <q-spinner-dots v-if="isLoadingStats_ahbb" color="primary" size="30px" />
                 <span v-else>{{ stat.valor }}</span>
              </div>
              <div class="text-caption text-grey-6">{{ stat.etiqueta }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-md">Accesos Rapidos</div>
        <div class="q-gutter-sm">
          <q-btn unelevated color="primary" text-color="white" icon="list" label="Ver Cursos" to="/cursos" />
          <q-btn v-if="!authStore_ahbb.esAlumno_ahbb" unelevated color="primary" text-color="white" icon="add" label="Crear Curso" to="/cursos/nuevo" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Cursos recientes -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-md">Cursos Recientes</div>
      </q-card-section>

      <q-list separator v-if="cursosStore_ahbb.listaCursos_ahbb.length > 0">
        <q-item
          v-for="curso in cursosStore_ahbb.listaCursos_ahbb.slice(0, 5)"
          :key="curso.id"
          clickable
          :to="`/cursos/${curso.id}`"
        >
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="menu_book" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ curso.nombre }}</q-item-label>
            <q-item-label caption>
              {{ curso.profesor }} · {{ curso.estudiantesInscritos }}/{{ curso.topeEstudiantes }} estudiantes
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              :color="curso.estatus === 'activo' ? 'positive' : curso.estatus === 'pendiente' ? 'warning' : 'negative'"
              :label="curso.estatus"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-else class="text-center text-grey-5 q-py-xl">
        <q-icon name="inbox" size="3rem" class="q-mb-sm" />
        <div>No hay cursos registrados todavia.</div>
      </q-card-section>
    </q-card>
  </div>
</template>
