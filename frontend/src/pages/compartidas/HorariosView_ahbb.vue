<!--
  HorariosView_ahbb.vue — Vista dinámica de Horarios con Calendario y Bandeja de Detalles
-->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { date, useQuasar } from 'quasar';
import CalendarioDinamico_ahbb from '../../components/horarios/CalendarioDinamico_ahbb.vue';
import { obtenerUsuariosPorRol_ahbb, obtenerAlumnosPorProfesor_ahbb } from '../../servicios/usuariosServicio_ahbb';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';

const $q = useQuasar();
const cursosStore_ahbb = useCursosStore_ahbb();
const authStore_ahbb = useAutenticacionStore_ahbb();

const diaSeleccionado_ahbb = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));

// Estados del filtro
const filtroTipo_ahbb = ref('todo'); // 'todo', 'curso', 'usuario'
const modoFiltro_ahbb = ref(authStore_ahbb.esAdmin_ahbb ? 'profesor' : 'alumno');
const usuarioSeleccionado_ahbb = ref(null);
const cursoSeleccionado_ahbb = ref(null);

const opcionesUsuarios_ahbb = ref([]);
const opcionesCursos_ahbb = ref([]);
const cargandoFiltros_ahbb = ref(false);
const calendarioRef_ahbb = ref(null);

const tienePermisoFiltrar_ahbb = computed(() => !authStore_ahbb.esAlumno_ahbb); // Admin y Profesor pueden filtrar usuarios/cursos

// Construye los filtros actuales según el estado activo (para polling)
const obtenerFiltrosActuales_ahbb = () => {
  if (filtroTipo_ahbb.value === 'usuario' && usuarioSeleccionado_ahbb.value) {
    return { id_usuario_ahbb: usuarioSeleccionado_ahbb.value.value, rol: modoFiltro_ahbb.value.toUpperCase() };
  }
  if (filtroTipo_ahbb.value === 'curso' && cursoSeleccionado_ahbb.value) {
    return { id_curso_ahbb: cursoSeleccionado_ahbb.value.value };
  }
  // 'todo' o sin filtro activo
  const filtros = {};
  if (authStore_ahbb.esAlumno_ahbb) {
    filtros.id_usuario_ahbb = authStore_ahbb.usuarioActivo_ahbb?.id;
    filtros.rol = 'ALUMNO';
  }
  return filtros;
};

onMounted(async () => {
  await cargarOpcionesFiltro_ahbb();
  await cursosStore_ahbb.fetchSesiones_ahbb(obtenerFiltrosActuales_ahbb());
});

// Polling cada 60s: el calendario se mantiene al día con los filtros activos
useAutoRefresh_ahbb(
  () => cursosStore_ahbb.fetchSesiones_ahbb(obtenerFiltrosActuales_ahbb()),
  60_000,
  false // no duplicar la carga inicial del onMounted
);

async function cargarOpcionesFiltro_ahbb() {
  cargandoFiltros_ahbb.value = true;
  try {
    // 1. Cargar Usuarios (si aplica)
    if (authStore_ahbb.esAdmin_ahbb || authStore_ahbb.esProfesor_ahbb) {
      let rawU_ahbb = [];
      if (authStore_ahbb.esAdmin_ahbb) {
        rawU_ahbb = await obtenerUsuariosPorRol_ahbb(modoFiltro_ahbb.value);
      } else if (authStore_ahbb.esProfesor_ahbb && modoFiltro_ahbb.value === 'alumno') {
        rawU_ahbb = await obtenerAlumnosPorProfesor_ahbb();
      }
      opcionesUsuarios_ahbb.value = rawU_ahbb.map(u => ({
        label: `${u.nombre} ${u.apellido} (${u.id})`,
        value: u.id,
        rol: u.rol
      }));
    }

    // 2. Cargar Cursos (según rol)
    // Los alumnos ven sus cursos inscritos, los profesores sus cursos dictados, admin ve todo
    const filtrosCursos = {};
    if (authStore_ahbb.esProfesor_ahbb) {
      filtrosCursos.solo_propios = true;
    } else if (authStore_ahbb.esAlumno_ahbb) {
      // Para alumnos, solo queremos los cursos donde están inscritos
      filtrosCursos.solo_inscritos = true;
    }

    await cursosStore_ahbb.inicializar_ahbb(filtrosCursos);
    opcionesCursos_ahbb.value = (cursosStore_ahbb.listaCursos_ahbb || []).map(c => ({
      label: c.nombre,
      value: c.id
    }));

  } catch (error) {
    console.error('Error cargando filtros:', error);
  } finally {
    cargandoFiltros_ahbb.value = false;
  }
}

// Al cambiar el modo (Profesor/Alumno), recargar la lista de opciones de usuarios
watch(modoFiltro_ahbb, async () => {
  usuarioSeleccionado_ahbb.value = null;
  await cargarOpcionesFiltro_ahbb();
});

// Al cambiar el tipo de filtro general
watch(filtroTipo_ahbb, async (nuevoTipo) => {
  usuarioSeleccionado_ahbb.value = null;
  cursoSeleccionado_ahbb.value = null;
  if (nuevoTipo === 'todo') {
    const filtros_ahbb = {};
    if (authStore_ahbb.esAlumno_ahbb) {
      filtros_ahbb.id_usuario_ahbb = authStore_ahbb.usuarioActivo_ahbb.id;
      filtros_ahbb.rol = 'ALUMNO';
    }
    await cursosStore_ahbb.fetchSesiones_ahbb(filtros_ahbb);
  }
});

// Al seleccionar un usuario
watch(usuarioSeleccionado_ahbb, async (val) => {
  if (val && filtroTipo_ahbb.value === 'usuario') {
    await cursosStore_ahbb.fetchSesiones_ahbb({
      id_usuario_ahbb: val.value,
      rol: modoFiltro_ahbb.value.toUpperCase()
    });
  }
});

// Al seleccionar un curso
watch(cursoSeleccionado_ahbb, async (val) => {
  if (val && filtroTipo_ahbb.value === 'curso') {
    await cursosStore_ahbb.fetchSesiones_ahbb({
      id_curso_ahbb: val.value
    });
    
    // Auto-navegar el calendario al mes de inicio del curso seleccionado
    const curso = (cursosStore_ahbb.listaCursos_ahbb || []).find(c => c.id === val.value);
    if (curso && curso.fechaInicio && calendarioRef_ahbb.value) {
      calendarioRef_ahbb.value.cambiarVistaAMes_ahbb(curso.fechaInicio);
      diaSeleccionado_ahbb.value = curso.fechaInicio;
    }
  }
});

const sesionesHoy_ahbb = computed(() => {
  return cursosStore_ahbb.listaSesiones_ahbb.filter(s => {
    const sFecha = typeof s.fecha === 'string' 
      ? s.fecha.split('T')[0] 
      : date.formatDate(s.fecha, 'YYYY-MM-DD');
    return sFecha === diaSeleccionado_ahbb.value;
  });
});

const iniciosTentativosHoy_ahbb = computed(() => {
  return (cursosStore_ahbb.listaMarcadoresCalendario_ahbb || []).filter((marcador_ahbb) => {
    const fechaMarcador_ahbb =
      typeof marcador_ahbb.fecha === 'string'
        ? marcador_ahbb.fecha.split('T')[0]
        : date.formatDate(marcador_ahbb.fecha, 'YYYY-MM-DD');

    return (
      marcador_ahbb.tipo === 'tentativo' &&
      fechaMarcador_ahbb === diaSeleccionado_ahbb.value
    );
  });
});

const fechaFormateada_ahbb = computed(() => {
  const f = new Date(diaSeleccionado_ahbb.value + 'T12:00:00'); 
  return date.formatDate(f, 'dddd, D [de] MMMM', {
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    months: ['Enero', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  });
});

function alSeleccionarDia_ahbb(fechaStr) {
  diaSeleccionado_ahbb.value = fechaStr;
}

const formatearHora12h_ahbb = (horaStr) => {
  if (!horaStr) return '—';
  // Soporta formatos HH:mm y HH:mm:ss
  const [horas, minutos] = horaStr.split(':').map(Number);
  const ampm = (horas ?? 0) >= 12 ? 'PM' : 'AM';
  const horas12 = (horas ?? 0) % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${String(minutos ?? 0).padStart(2, '0')} ${ampm}`;
};
</script>

<template>
  <q-page class="bg-grey-1">
    <div class="container-horarios-ahbb q-mx-auto q-pa-md" style="max-width: 800px;">
      
      <!-- Sección de Filtros -->
      <q-card flat bordered class="q-mb-md shadow-1 rounded-lg bg-white">
        <q-card-section class="q-py-md">
          <div class="row q-col-gutter-md items-end">
            <!-- 1. Tipo de Filtro -->
            <div class="col-12 col-sm-auto">
              <div class="text-caption text-grey-7 q-mb-xs">Filtrar por</div>
              <q-btn-toggle
                v-model="filtroTipo_ahbb"
                toggle-color="primary"
                toggle-text-color="white"
                color="white"
                text-color="primary"
                unelevated
                rounded
                padding="8px 16px"
                class="filter-toggle-ahbb border-primary"
                :options="[
                  { label: 'Todo', value: 'todo' },
                  { label: 'Por Curso', value: 'curso' },
                  { label: 'Por Usuario', value: 'usuario' }
                ].filter(opt => {
                  if (authStore_ahbb.esAlumno_ahbb) return opt.value !== 'usuario';
                  return true;
                })"
              />
            </div>

            <!-- 2. Selector de Curso (si aplica) -->
            <div v-if="filtroTipo_ahbb === 'curso'" class="col-12 col-sm">
              <q-select
                v-model="cursoSeleccionado_ahbb"
                :options="opcionesCursos_ahbb"
                label="Seleccionar Curso"
                outlined
                dense
                clearable
                class="bg-grey-1"
                :loading="cargandoFiltros_ahbb"
              />
            </div>

            <!-- 3. Selector de Usuario/Alumno (si aplica) -->
            <div v-if="filtroTipo_ahbb === 'usuario'" class="col-12 col-sm">
              <div class="row q-col-gutter-sm">
                <!-- Toggle Alumno/Profesor solo para Admin -->
                <div v-if="authStore_ahbb.esAdmin_ahbb" class="col-auto">
                  <q-btn-toggle
                    v-model="modoFiltro_ahbb"
                    toggle-color="secondary"
                    flat
                    dense
                    rounded
                    unelevated
                    :options="[
                      { label: 'Profs', value: 'profesor' },
                      { label: 'Alums', value: 'alumno' }
                    ]"
                  />
                </div>
                <div class="col">
                  <q-select
                    v-model="usuarioSeleccionado_ahbb"
                    :options="opcionesUsuarios_ahbb"
                    :label="modoFiltro_ahbb === 'profesor' ? 'Seleccionar Profesor' : 'Seleccionar Alumno'"
                    outlined
                    dense
                    clearable
                    use-input
                    input-debounce="300"
                    behavior="menu"
                    :loading="cargandoFiltros_ahbb"
                    class="bg-grey-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Card del Calendario -->
      <q-card flat bordered class="q-mb-lg shadow-2 rounded-xl">
        <q-card-section class="q-pa-none">
          <div v-if="cursosStore_ahbb.cargando_ahbb" class="absolute-full flex flex-center z-top bg-white-transparent">
            <q-spinner-dots color="primary" size="3rem" />
          </div>
<CalendarioDinamico_ahbb 
            ref="calendarioRef_ahbb"
            :sesiones_ahbb="cursosStore_ahbb.listaSesiones_ahbb"
            :marcadores_ahbb="cursosStore_ahbb.listaMarcadoresCalendario_ahbb"
            @seleccionar-dia="alSeleccionarDia_ahbb"
          />
        </q-card-section>
      </q-card>

      <!-- Bandeja de Detalles (Detail Tray) -->
      <div class="tray-detalles-ahbb">
        <div class="row items-center q-mb-md">
          <div class="text-h6 text-weight-bold text-primary">
            {{ fechaFormateada_ahbb }}
          </div>
          <q-space />
          <q-badge
            rounded
            :color="sesionesHoy_ahbb.length > 0 || iniciosTentativosHoy_ahbb.length > 0 ? 'orange' : 'green'"
            class="q-pa-sm"
          >
            <template v-if="sesionesHoy_ahbb.length > 0">
              <span v-if="sesionesHoy_ahbb.length === 1">Clase #{{ sesionesHoy_ahbb[0].nroClase }}</span>
              <span v-else>{{ sesionesHoy_ahbb.length }} Clases</span>
            </template>
            <template v-else-if="iniciosTentativosHoy_ahbb.length > 0">
              {{ iniciosTentativosHoy_ahbb.length }} {{ iniciosTentativosHoy_ahbb.length === 1 ? 'Inicio tentativo' : 'Inicios tentativos' }}
            </template>
            <template v-else>
              0 Clases
            </template>
          </q-badge>
        </div>

        <q-scroll-area style="height: 300px;">
          <div v-if="sesionesHoy_ahbb.length > 0" class="q-gutter-y-md">
            <q-card 
              v-for="sesion in sesionesHoy_ahbb" 
              :key="sesion.id" 
              flat 
              bordered 
              class="item-sesion-ahbb q-pa-sm rounded-lg hover-elevate"
            >
              <div class="row items-center no-wrap">
                <div class="col-auto q-mr-md">
                  <div class="hora-bloque-ahbb text-center q-pa-xs rounded-borders bg-primary text-white">
                    <div class="text-caption" style="font-size: 0.7rem">{{ formatearHora12h_ahbb(sesion.horaInicio) }}</div>
                    <div class="text-caption opacity-70" style="line-height: 0.8">a</div>
                    <div class="text-caption" style="font-size: 0.7rem">{{ formatearHora12h_ahbb(sesion.horaFin) }}</div>
                  </div>
                </div>
                
                <div class="col">
                  <div class="text-weight-bold text-subtitle1">{{ sesion.cursoNombre }}</div>
                  <div class="row items-center text-grey-8 q-gutter-x-sm">
                    <q-icon name="bookmark" size="xs" color="orange" />
                    <span>Clase #{{ sesion.nroClase }}</span>
                  </div>
                </div>

                <div class="col-auto">
                  <q-btn flat round color="primary" icon="chevron_right" :to="`/cursos/${sesion.idCurso}?from=horarios`" />
                </div>
              </div>
            </q-card>
          </div>

          <div v-else-if="iniciosTentativosHoy_ahbb.length > 0" class="q-gutter-y-md">
            <q-banner
              v-for="marcador in iniciosTentativosHoy_ahbb"
              :key="`${marcador.idCurso}-${marcador.fecha}`"
              rounded
              class="bg-yellow-1 text-amber-10 banner-tentativo-ahbb"
            >
              <template v-slot:avatar>
                <q-icon name="event_upcoming" color="orange-8" size="md" />
              </template>
              <div class="q-pl-md">
                <div class="text-weight-bold" style="line-height: 1.2">{{ marcador.cursoNombre }}</div>
                <div class="text-body2 opacity-80">
                  {{ marcador.mensaje || 'Este curso tiene fecha de inicio prevista, pero aun no posee alumnos inscritos activos.' }}
                </div>
              </div>
            </q-banner>
          </div>

          <div v-else class="text-center q-pa-xl">
            <q-icon name="event_available" size="4rem" color="green-2" class="q-mb-md" />
            <div class="text-h6 text-grey-6">¡Día libre! No hay clases programadas</div>
          </div>
        </q-scroll-area>
      </div>

    </div>
  </q-page>
</template>

<style scoped>
.container-horarios-ahbb {
  animation: fadeIn 0.5s ease;
}

.bg-white-transparent {
  background: rgba(255, 255, 255, 0.7);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.rounded-xl {
  border-radius: 20px;
}

.rounded-lg {
  border-radius: 12px;
}

.item-sesion-ahbb {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border-left: 5px solid var(--q-primary);
}

.item-sesion-ahbb:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

.hora-bloque-ahbb {
  width: 70px;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(var(--q-primary), 0.3);
}

.opacity-70 {
  opacity: 0.7;
}

.tray-detalles-ahbb {
  background: white;
  padding: 20px;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.03);
}
</style>
