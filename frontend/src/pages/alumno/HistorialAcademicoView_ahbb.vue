<!-- HistorialAcademicoView_ahbb.vue — Historial académico del alumno -->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerInscripcionesPorAlumno_ahbb } from '../../servicios/inscripcionesServicio_ahbb';

const $q_ahbb = useQuasar();
const authStore_ahbb = useAutenticacionStore_ahbb();

const historial_ahbb = ref([]);
const cargando_ahbb = ref(true);
const filtro_ahbb = ref('');

const columnas_ahbb = [
  {
    name: 'curso',
    label: 'Curso Curricular',
    field: row_ahbb => row_ahbb.curso.nombre_ahbb,
    align: 'left',
    sortable: true,
  },
  {
    name: 'profesor',
    label: 'Instructor',
    field: row_ahbb => `${row_ahbb.curso.profesor.nombre_ahbb} ${row_ahbb.curso.profesor.apellido_ahbb}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'fechaInicio',
    label: 'Fecha Inicio',
    field: row_ahbb => row_ahbb.curso.fechaInicio_ahbb,
    align: 'center',
    sortable: true,
    format: val_ahbb => val_ahbb ? new Date(val_ahbb).toLocaleDateString('es-VE') : '—',
  },
  {
    name: 'fechaFin',
    label: 'Fecha Fin',
    field: row_ahbb => row_ahbb.curso.fechaFin_ahbb,
    align: 'center',
    sortable: true,
    format: val_ahbb => val_ahbb ? new Date(val_ahbb).toLocaleDateString('es-VE') : '—',
  },
  {
    name: 'estado',
    label: 'Estado Académico',
    field: 'estatus_ahbb',
    align: 'center',
    sortable: true,
  }
];

const cargarHistorial_ahbb = async () => {
  const idUsuario_ahbb = authStore_ahbb.usuarioActivo_ahbb?.id;
  if (!idUsuario_ahbb) return;

  cargando_ahbb.value = true;
  try {
    const data_ahbb = await obtenerInscripcionesPorAlumno_ahbb(idUsuario_ahbb);
    historial_ahbb.value = data_ahbb;
  } catch (error_ahbb) {
    console.error('Error cargando historial:', error_ahbb);
    $q_ahbb.notify({ type: 'negative', message: 'Error al cargar tu historial académico.' });
  } finally {
    cargando_ahbb.value = false;
  }
};

const obtenerColorEstado_ahbb = (estado_ahbb) => {
  const mapeo_ahbb = {
    INSCRITO: 'blue',
    OYENTE: 'orange',
    APROBADO: 'positive',
    REPROBADO: 'negative'
  };
  return mapeo_ahbb[estado_ahbb] || 'grey';
};

onMounted(cargarHistorial_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="history_edu" class="q-mr-sm" />
          Historial Académico
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          Registro completo de tu trayectoria, cursos cursados y estatus académico.
        </div>
      </div>
    </div>

    <!-- Buscador Superior -->
    <q-card flat bordered class="q-pa-md q-mb-md rounded-borders">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="filtro_ahbb"
            dense
            outlined
            placeholder="Buscar por curso o instructor..."
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 text-right">
          <div class="text-subtitle2 text-grey-8">
            Cursos en tu historial: <span class="text-weight-bold text-primary">{{ historial_ahbb.length }}</span>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Tabla Data -->
    <q-table
      :rows="historial_ahbb"
      :columns="columnas_ahbb"
      row-key="id_inscripcion_ahbb"
      :loading="cargando_ahbb"
      :filter="filtro_ahbb"
      flat
      bordered
      rows-per-page-label="Registros por página"
      no-data-label="Aún no posees registros culminados o activos en tu historial"
      class="shadow-1"
    >
      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="obtenerColorEstado_ahbb(props.value) + '-1'"
            :text-color="obtenerColorEstado_ahbb(props.value) + '-9'"
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
