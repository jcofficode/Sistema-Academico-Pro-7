<!-- MisAlumnosView_ahbb.vue — Vista de alumnos para el profesor (Lectura) -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAutenticacionStore_ahbb } from 'src/stores/autenticacionStore_ahbb';
import { obtenerInscripcionesPorProfesor_ahbb } from 'src/servicios/inscripcionesServicio_ahbb';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAutenticacionStore_ahbb();

const cargando = ref(true);
const inscripciones = ref([]);
const filtroTexto = ref('');
const filtroCurso = ref(null);

// Opciones para el select de cursos (únicos de la lista de inscripciones)
const opcionesCursos = computed(() => {
  const cursosMap = new Map();
  cursosMap.set('todos', { label: 'Todos los cursos', value: null });
  
  inscripciones.value.forEach(ins => {
    if (ins.curso && !cursosMap.has(ins.curso.id_curso_ahbb)) {
      cursosMap.set(ins.curso.id_curso_ahbb, {
        label: ins.curso.nombre_ahbb,
        value: ins.curso.id_curso_ahbb
      });
    }
  });
  return Array.from(cursosMap.values());
});

const columnas = [
  { name: 'alumno', label: 'Estudiante', field: row => `${row.alumno.nombre_ahbb} ${row.alumno.apellido_ahbb}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: row => row.alumno.cedula_ahbb, align: 'left', sortable: true },
  { name: 'correo', label: 'Correo', field: row => row.alumno.correo_ahbb, align: 'left' },
  { name: 'curso', label: 'Último Curso', field: row => row.curso?.nombre_ahbb || 'N/A', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado Actual', field: 'estatus_ahbb', align: 'center', sortable: true },
];

const inscripcionesFiltradas = computed(() => {
  // Deduplicar por ID de alumno para mostrar solo su estado más reciente
  const mapaUnicos = new Map();
  
  // Ordenar por ID de inscripción de mayor a menor (el más reciente primero)
  const sorted = [...inscripciones.value].sort((a, b) => b.id_inscripcion_ahbb - a.id_inscripcion_ahbb);
  
  sorted.forEach(ins => {
    const idAlumno = ins.alumno?.id_usuario_ahbb || ins.id_usuario_inscripcion_ahbb;
    if (!mapaUnicos.has(idAlumno)) {
      mapaUnicos.set(idAlumno, ins);
    }
  });
  
  const listaUnica = Array.from(mapaUnicos.values());

  return listaUnica.filter(ins => {
    const nombreCompleto = `${ins.alumno.nombre_ahbb} ${ins.alumno.apellido_ahbb}`.toLowerCase();
    const coincidenceTexto = nombreCompleto.includes(filtroTexto.value.toLowerCase()) || 
                             ins.alumno.cedula_ahbb?.includes(filtroTexto.value);
    
    const coincidenceCurso = !filtroCurso.value || ins.curso?.id_curso_ahbb === filtroCurso.value;
    
    return coincidenceTexto && coincidenceCurso;
  });
});

const cargarDatos = async () => {
  if (!authStore.usuarioActivo_ahbb?.id) return;
  
  cargando.value = true;
  try {
    const data = await obtenerInscripcionesPorProfesor_ahbb(authStore.usuarioActivo_ahbb.id);
    inscripciones.value = data;
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Error al cargar la lista de alumnos',
      icon: 'report_problem'
    });
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  if (authStore.usuarioActivo_ahbb?.id) {
    cargarDatos();
  }
});

// Watch para cuando el store se inicialice
watch(() => authStore.usuarioActivo_ahbb?.id, (nuevoId) => {
  if (nuevoId) {
    cargarDatos();
  }
}, { immediate: true });
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">
          <q-icon name="groups" color="primary" class="q-mr-sm" />
          Mis Alumnos
        </div>
        <div class="text-subtitle2 text-grey-7">Listado general de estudiantes en mis cursos</div>
      </div>
      <q-btn flat round icon="refresh" color="primary" @click="cargarDatos" :loading="cargando">
        <q-tooltip>Actualizar lista</q-tooltip>
      </q-btn>
    </div>

    <q-card flat bordered class="q-mb-lg shadow-1">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input
            v-model="filtroTexto"
            dense
            outlined
            placeholder="Buscar por nombre o cédula..."
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="filtroCurso"
            :options="opcionesCursos"
            label="Filtrar por curso"
            dense
            outlined
            emit-value
            map-options
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="filter_list" />
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>

    <q-table
      :rows="inscripcionesFiltradas"
      :columns="columnas"
      row-key="id_inscripcion_ahbb"
      :loading="cargando"
      flat
      bordered
      no-data-label="No se encontraron alumnos inscritos"
      rows-per-page-label="Registros por página"
    >
      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="props.value === 'APROBADO' ? 'green-1' : props.value === 'REPROBADO' ? 'red-1' : 'blue-1'"
            :text-color="props.value === 'APROBADO' ? 'green-9' : props.value === 'REPROBADO' ? 'red-9' : 'blue-9'"
            class="text-weight-bold"
          >
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>
  </div>
</template>

<style scoped>
.shadow-1 {
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
</style>
