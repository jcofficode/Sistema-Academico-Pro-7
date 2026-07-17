<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerInscripcionesPorAlumno_ahbb } from '../../servicios/inscripcionesServicio_ahbb';
import { obtenerContenidoCurso_jf } from '../../servicios/multimediaServicio_jf';

const $q = useQuasar();
const authStore = useAutenticacionStore_ahbb();

const cursos = ref([]);
const cargando = ref(false);

const cargarCursos = async () => {
  const idUsuario = authStore.usuarioActivo_ahbb?.id;
  if (!idUsuario) return;

  cargando.value = true;
  try {
    const inscripciones = await obtenerInscripcionesPorAlumno_ahbb(idUsuario);
    // Filtrar solo las inscripciones con estatus activo (INSCRITO, OYENTE, APROBADO)
    const inscripcionesActivas = inscripciones.filter(
      (ins) => ins.estatus_ahbb === 'INSCRITO' || ins.estatus_ahbb === 'OYENTE' || ins.estatus_ahbb === 'APROBADO'
    );

    // Cargar el progreso de cada curso en paralelo
    const promesas = inscripcionesActivas.map(async (ins) => {
      let progreso = { porcentajeProgreso: 0, leccionesCompletadas: 0, totalLecciones: 0 };
      try {
        const content = await obtenerContenidoCurso_jf(ins.curso.id_curso_ahbb);
        if (content && content.progresoCurso) {
          progreso = content.progresoCurso;
        }
      } catch (err) {
        // El curso podría no tener bloques multimedia aún configurados
      }
      return {
        id_curso_ahbb: ins.curso.id_curso_ahbb,
        nombre_ahbb: ins.curso.nombre_ahbb,
        descripcion_ahbb: ins.curso.descripcion_ahbb,
        tematica_ahbb: ins.curso.tematica_ahbb,
        profesor: `${ins.curso.profesor.nombre_ahbb} ${ins.curso.profesor.apellido_ahbb}`,
        progreso,
      };
    });

    cursos.value = await Promise.all(promesas);
  } catch (error) {
    console.error('Error cargando aula virtual:', error);
    $q.notify({
      type: 'negative',
      message: 'Fallo al cargar tus clases del Aula Virtual.',
    });
  } finally {
    cargando.value = false;
  }
};

onMounted(cargarCursos);
</script>

<template>
  <q-page class="q-pa-xl bg-grey-1">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h1 class="text-h3 text-weight-bold text-primary q-my-none">
          Mi Aula Virtual
        </h1>
        <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-none">
          Accede al material de tus cursos, reproduce lecciones en video y realiza tus evaluaciones.
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
      <q-icon name="school" size="100px" class="text-grey-4" />
      <h2 class="text-h5 text-weight-bold q-mt-md q-mb-xs">No estás cursando asignaturas libres</h2>
      <p class="text-body1 max-width-md text-grey-6">
        Inscríbete en los cursos extracurriculares de la academia desde la oferta académica para verlos aquí.
      </p>
    </div>

    <!-- Grid de Clases -->
    <div v-else class="row q-col-gutter-xl">
      <div
        class="col-12 col-sm-6"
        v-for="curso in cursos"
        :key="curso.id_curso_ahbb"
      >
        <q-card flat bordered class="curso-card rounded-xl shadow-1 hover-shadow transition-all bg-white full-height flex column">
          <q-card-section class="col q-pa-lg">
            <q-chip
              color="primary-1"
              text-color="primary"
              size="sm"
              class="text-weight-bold q-mb-md"
            >
              {{ curso.tematica_ahbb }}
            </q-chip>
            <div class="text-h5 text-weight-bold text-dark q-mb-xs line-height-tight">
              {{ curso.nombre_ahbb }}
            </div>
            <div class="text-caption text-grey-6 q-mb-lg">
              Facilitador: <span class="text-weight-medium">{{ curso.profesor }}</span>
            </div>

            <!-- Progreso Bar -->
            <div class="q-my-md">
              <div class="row justify-between items-center q-mb-xs">
                <span class="text-subtitle2 text-grey-8 text-weight-bold">Progreso de Aprendizaje</span>
                <span class="text-subtitle2 text-primary text-weight-bold">
                  {{ curso.progreso.porcentajeProgreso }}%
                </span>
              </div>
              <q-linear-progress
                :value="curso.progreso.porcentajeProgreso / 100"
                color="primary"
                track-color="grey-3"
                size="10px"
                class="rounded-lg"
              />
              <div class="text-caption text-grey-5 q-mt-xs text-right">
                {{ curso.progreso.leccionesCompletadas }} de {{ curso.progreso.totalLecciones }} lecciones vistas
              </div>
            </div>

            <p class="text-body2 text-grey-7 ellipsis-3-lines q-mt-md">
              {{ curso.descripcion_ahbb || 'Sin descripción detallada disponible.' }}
            </p>
          </q-card-section>

          <q-separator />

          <q-card-actions class="q-pa-lg bg-grey-2 justify-end">
            <q-btn
              unelevated
              color="primary"
              class="rounded-lg text-weight-bold px-lg"
              icon="play_circle_filled"
              label="Ingresar al Aula"
              :to="`/alumno/aula-virtual/player/${curso.id_curso_ahbb}`"
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
.line-height-tight {
  line-height: 1.25;
}
.max-width-md {
  max-width: 450px;
}
.px-lg {
  padding-left: 20px;
  padding-right: 20px;
}
</style>
