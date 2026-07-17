<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { obtenerCursos_ahbb } from '../../servicios/cursosServicio_ahbb';

const $q = useQuasar();
const cursos = ref([]);
const cargando = ref(false);

const cargarCursos = async () => {
  cargando.value = true;
  try {
    // Obtener los cursos propios del profesor
    const data = await obtenerCursos_ahbb({ solo_propios: true });
    cursos.value = data;
  } catch (error) {
    console.error('Error al cargar cursos:', error);
    $q.notify({
      type: 'negative',
      message: 'Fallo al cargar tus cursos asignados.',
    });
  } finally {
    cargando.value = false;
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Por definir';
  return new Date(fecha).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

onMounted(cargarCursos);
</script>

<template>
  <q-page class="q-pa-xl bg-grey-1">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bold text-primary q-my-none">
          Cursos Multimedia
        </h1>
        <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-none">
          Gestiona el contenido estructurado de tus asignaturas libres, lecciones en video y aulas virtuales.
        </p>
      </div>
      <q-btn
        flat
        round
        color="primary"
        icon="refresh"
        @click="cargarCursos"
        :loading="cargando"
        size="lg"
      />
    </div>

    <!-- Spinner -->
    <div v-if="cargando && cursos.length === 0" class="flex flex-center q-py-xl">
      <q-spinner-dots color="primary" size="80px" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="cursos.length === 0"
      class="flex flex-center column q-py-xl text-center text-grey-6"
    >
      <q-icon name="video_library" size="100px" class="text-grey-4" />
      <h2 class="text-h5 text-weight-bold q-mt-md q-mb-xs">No tienes cursos asignados</h2>
      <p class="text-body1 max-width-md text-grey-6">
        Para crear contenido multimedia, necesitas tener cursos activos asignados bajo tu nombre.
      </p>
    </div>

    <!-- Cursos Grid -->
    <div v-else class="row q-col-gutter-xl">
      <div
        class="col-12 col-sm-6 col-md-4"
        v-for="curso in cursos"
        :key="curso.id"
      >
        <q-card flat bordered class="curso-card rounded-xl shadow-1 hover-shadow transition-all bg-white full-height flex column">
          <div class="card-gradient q-pa-lg text-white">
            <q-chip
              color="white"
              text-color="primary"
              size="sm"
              class="text-weight-bold q-mb-md"
            >
              Curso Académico
            </q-chip>
            <div class="text-h5 text-weight-bold ellipsis-2-lines line-height-tight">
              {{ curso.nombre }}
            </div>
          </div>

          <q-card-section class="col q-pa-lg">
            <div class="column q-gap-md text-grey-8">
              <div class="row items-center">
                <q-icon name="calendar_today" color="primary" size="xs" class="q-mr-sm" />
                <span class="text-subtitle2 text-grey-6 q-mr-xs">Inicio:</span>
                <span class="text-weight-bold">{{ formatearFecha(curso.fechaInicio) }}</span>
              </div>

              <div class="row items-center">
                <q-icon name="timer" color="secondary" size="xs" class="q-mr-sm" />
                <span class="text-subtitle2 text-grey-6 q-mr-xs">Duración:</span>
                <span class="text-weight-bold">{{ curso.duracionHoras }} horas</span>
              </div>

              <div class="row items-center">
                <q-icon name="people" color="accent" size="xs" class="q-mr-sm" />
                <span class="text-subtitle2 text-grey-6 q-mr-xs">Tope:</span>
                <span class="text-weight-bold">{{ curso.topeEstudiantes }} alumnos max.</span>
              </div>
            </div>

            <div class="q-mt-lg text-body2 text-grey-6 ellipsis-3-lines">
              {{ curso.descripcion || 'Sin descripción detallada.' }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions class="q-pa-lg bg-grey-2 justify-end">
            <q-btn
              unelevated
              color="primary"
              class="rounded-lg text-weight-bold px-lg"
              icon="construction"
              label="Constructor Multimedia"
              :to="`/profesor/multimedia/constructor/${curso.id}`"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.curso-card {
  border-radius: 20px;
  overflow: hidden;
}
.card-gradient {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}
.rounded-xl {
  border-radius: 20px;
}
.rounded-lg {
  border-radius: 10px;
}
.hover-shadow:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
}
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.px-lg {
  padding-left: 20px;
  padding-right: 20px;
}
.line-height-tight {
  line-height: 1.25;
}
.max-width-md {
  max-width: 450px;
}
.q-gap-md {
  gap: 12px;
}
</style>
