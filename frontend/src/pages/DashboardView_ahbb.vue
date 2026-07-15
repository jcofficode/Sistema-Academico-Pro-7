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
  { icono: 'account_tree', color: 'deep-purple', etiqueta: 'Carreras', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCarreras) },
  { icono: 'collections_bookmark', color: 'indigo', etiqueta: 'Materias en Pensums', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalMaterias) },
  { icono: 'school', color: 'primary', etiqueta: 'Cursos Extracurriculares', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCursos) },
  { icono: 'groups', color: 'info', etiqueta: 'Estudiantes Totales', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalEstudiantes) },
]);

const estadisticas_profesor_ahbb = computed(() => [
  { icono: 'collections_bookmark', color: 'deep-purple', etiqueta: 'Materias Asignadas', valor: formatStat_ahbb(statsDynamic_ahbb.value?.materiasAsignadas) },
  { icono: 'groups_2', color: 'indigo', etiqueta: 'Alumnos en mis Materias', valor: formatStat_ahbb(statsDynamic_ahbb.value?.alumnosEnMaterias) },
  { icono: 'school', color: 'primary', etiqueta: 'Mis Cursos Extracurriculares', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCursos) },
  { icono: 'groups', color: 'info', etiqueta: 'Estudiantes en mis Cursos', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalEstudiantes) },
]);

const estadisticas_alumno_ahbb = computed(() => [
  { icono: 'account_tree', color: 'deep-purple', etiqueta: 'Mis Carreras', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalCarreras) },
  { icono: 'collections_bookmark', color: 'indigo', etiqueta: 'Materias de Carrera Inscritas', valor: formatStat_ahbb(statsDynamic_ahbb.value?.totalMateriasInscritas) },
  { icono: 'menu_book', color: 'primary', etiqueta: 'Cursos Extracurriculares', valor: formatStat_ahbb(statsDynamic_ahbb.value?.cursosInscritos) },
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

    <!-- Carreras (admin): visión global del módulo académico -->
    <q-card v-if="authStore_ahbb.esAdmin_ahbb && statsDynamic_ahbb" flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-sm">🎓 Módulo de Carreras</div>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <q-chip
              v-for="carrera_cjgp in statsDynamic_ahbb.carrerasNombres ?? []"
              :key="carrera_cjgp"
              color="deep-purple-1"
              text-color="deep-purple-9"
              icon="school"
            >
              {{ carrera_cjgp }}
            </q-chip>
            <span v-if="!(statsDynamic_ahbb.carrerasNombres ?? []).length" class="text-caption text-grey-6">
              Aún no hay carreras: créalas con el asistente.
            </span>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-blue-9">{{ statsDynamic_ahbb.materiasCursando ?? 0 }}</div>
            <div class="text-caption text-grey-7">inscripciones en curso</div>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-green-9">{{ statsDynamic_ahbb.planesPublicados ?? 0 }}</div>
            <div class="text-caption text-grey-7">planes publicados</div>
          </div>
          <div class="col-auto text-center">
            <div class="text-h6 text-primary">{{ statsDynamic_ahbb.periodoActivo ?? '—' }}</div>
            <div class="text-caption text-grey-7">período activo</div>
          </div>
          <div class="col-auto">
            <q-btn outline color="deep-purple" icon="auto_fix_high" label="Nueva carrera" to="/admin/carreras/asistente" class="q-mr-sm" />
            <q-btn outline color="primary" icon="person_add" label="Inscribir alumnos" to="/admin/inscripcion-alumnos" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Materias (profesor): lo que dicta en las carreras -->
    <q-card v-if="authStore_ahbb.esProfesor_ahbb && statsDynamic_ahbb" flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-sm">🎓 Mis Materias de Carrera</div>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <q-chip
              v-for="carrera_cjgp in statsDynamic_ahbb.carrerasProfesor ?? []"
              :key="carrera_cjgp"
              color="deep-purple-1"
              text-color="deep-purple-9"
              icon="school"
            >
              {{ carrera_cjgp }}
            </q-chip>
            <span v-if="!(statsDynamic_ahbb.carrerasProfesor ?? []).length" class="text-caption text-grey-6">
              Aún no tienes materias asignadas (las asigna el administrador).
            </span>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-blue-9">{{ statsDynamic_ahbb.materiasAsignadas ?? 0 }}</div>
            <div class="text-caption text-grey-7">materias asignadas</div>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-green-9">{{ statsDynamic_ahbb.alumnosEnMaterias ?? 0 }}</div>
            <div class="text-caption text-grey-7">alumnos cursando</div>
          </div>
          <div class="col-auto">
            <q-btn outline color="deep-purple" icon="collections_bookmark" label="Mis materias" to="/profesor/mis-materias-carrera" class="q-mr-sm" />
            <q-btn outline color="primary" icon="grading" label="Cargar notas" to="/control-estudios/carga-notas" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mi Carrera (alumno): carreras cursadas y avance de materias -->
    <q-card
      v-if="authStore_ahbb.esAlumno_ahbb && statsDynamic_ahbb?.carrerasAlumno?.length"
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-sm">🎓 Mi Carrera</div>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md">
            <q-chip
              v-for="carrera_cjgp in statsDynamic_ahbb.carrerasAlumno"
              :key="carrera_cjgp"
              color="deep-purple-1"
              text-color="deep-purple-9"
              icon="school"
            >
              {{ carrera_cjgp }}
            </q-chip>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-blue-9">{{ statsDynamic_ahbb.materiasEnCurso ?? 0 }}</div>
            <div class="text-caption text-grey-7">materias en curso</div>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-green-9">{{ statsDynamic_ahbb.materiasAprobadas ?? 0 }}</div>
            <div class="text-caption text-grey-7">materias aprobadas</div>
          </div>
          <div class="col-auto">
            <q-btn outline color="deep-purple" icon="app_registration" label="Inscribir materias" to="/alumno/inscripcion-materias" class="q-mr-sm" />
            <q-btn outline color="primary" icon="grading" label="Mis notas" to="/alumno/mis-notas" />
          </div>
        </div>
      </q-card-section>
    </q-card>

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
