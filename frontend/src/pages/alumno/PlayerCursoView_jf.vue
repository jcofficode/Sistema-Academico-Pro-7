<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  obtenerContenidoCurso_jf,
  registrarProgresoLeccion_jf,
  resolverEvaluacion_jf,
  obtenerSalasCurso_jf,
  extraerError_jf,
} from '../../servicios/multimediaServicio_jf';
import { BASE_URL_API_AHBB } from '../../servicios/api_ahbb';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const cursoId = Number(route.params.id);
const bloques = ref([]);
const salas = ref([]);
const cargando = ref(false);
const cargandoSalas = ref(false);

const leccionActiva = ref(null);
const evaluacionActiva = ref(null);
const activeBloqueEvaluacion = ref(null);

// Quiz states
const respuestasCuestionario = ref([]); // array of answers
const enviandoQuiz = ref(false);
const resultadoQuiz = ref(null);

const tokenJWT = sessionStorage.getItem('certificaciones_token_ahbb') || '';

// Load data
const cargarDatos = async () => {
  cargando.value = true;
  try {
    const data = await obtenerContenidoCurso_jf(cursoId);
    bloques.value = data.bloques || [];
    
    // Auto-select first unlocked lesson if none selected
    if (!leccionActiva.value && !evaluacionActiva.value) {
      seleccionarSiguienteAlPaso();
    }
    
    await cargarSalas();
  } catch (error) {
    console.error('Error al cargar player:', error);
    $q.notify({
      type: 'negative',
      message: 'Fallo al cargar contenido o no posees inscripción activa.',
    });
    router.push('/alumno/aula-virtual');
  } finally {
    cargando.value = false;
  }
};

const cargarSalas = async () => {
  cargandoSalas.value = true;
  try {
    const data = await obtenerSalasCurso_jf(cursoId);
    // Filtrar solo las que están EN_VIVO o PROGRAMADAS
    salas.value = data.filter((s) => s.estado_jf !== 'FINALIZADA');
  } catch (e) {
    console.error(e);
  } finally {
    cargandoSalas.value = false;
  }
};

// Jitsi live room link
const salaActivaEnVivo = computed(() => {
  return salas.value.find((s) => s.estado_jf === 'EN_VIVO');
});

// Ordenar lecciones de forma global
const leccionesOrdenadas = computed(() => {
  return bloques.value.flatMap((b) => b.lecciones_jf || []);
});

const obtenerEstadoCompletado = (leccion) => {
  if (!leccion) return false;
  return leccion.progresos_jf && leccion.progresos_jf[0]?.completada_jf === true;
};

// Determina si una lección está desbloqueada secuencialmente
const esLeccionDesbloqueada = (leccionId) => {
  const index = leccionesOrdenadas.value.findIndex((l) => l.id_leccion_jf === leccionId);
  if (index <= 0) return true; // Primera lección desbloqueada por defecto
  
  const anterior = leccionesOrdenadas.value[index - 1];
  const completada = obtenerEstadoCompletado(anterior);

  // Además, si la lección anterior pertenecía a un bloque anterior, ese bloque
  // debió haber aprobado su evaluación si tenía una.
  const leccActual = leccionesOrdenadas.value[index];
  const bloqueLecActual = bloques.value.find((b) => b.id_bloque_jf === leccActual.id_bloque_leccion_jf);
  const bloqueLecAnterior = bloques.value.find((b) => b.id_bloque_jf === anterior.id_bloque_leccion_jf);
  
  if (bloqueLecActual && bloqueLecAnterior && bloqueLecActual.orden_jf > bloqueLecAnterior.orden_jf) {
    // Cruce de bloque: requiere haber aprobado la evaluación del bloque anterior (si posee una)
    if (bloqueLecAnterior.evaluacion_jf) {
      const aprobado = bloqueLecAnterior.evaluacion_jf.intentos_jf?.some((i) => i.aprobado_jf);
      return completada && aprobado;
    }
  }

  return completada;
};

// Determina si un bloque completo está desbloqueado
const esBloqueDesbloqueado = (bloque) => {
  if (bloque.orden_jf === 1) return true;
  const bloqueAnterior = bloques.value.find((b) => b.orden_jf === bloque.orden_jf - 1);
  if (!bloqueAnterior) return false;

  // Si tiene evaluación, debe estar aprobada
  if (bloqueAnterior.evaluacion_jf) {
    return bloqueAnterior.evaluacion_jf.intentos_jf?.some((i) => i.aprobado_jf) === true;
  }
  
  // Si no tiene evaluación, la última lección del bloque anterior debe estar completada
  const leccionesAnterior = bloqueAnterior.lecciones_jf || [];
  if (leccionesAnterior.length === 0) return true;
  return obtenerEstadoCompletado(leccionesAnterior[leccionesAnterior.length - 1]);
};

// Determina si la evaluación de un bloque está habilitada
const esEvaluacionHabilitada = (bloque) => {
  if (!bloque.lecciones_jf || bloque.lecciones_jf.length === 0) return true;
  // Todas las lecciones del bloque deben estar completadas
  return bloque.lecciones_jf.every((l) => obtenerEstadoCompletado(l));
};

const esEvaluacionAprobada = (bloque) => {
  return bloque.evaluacion_jf?.intentos_jf?.some((i) => i.aprobado_jf) === true;
};

// Selecciona automáticamente la primera lección desbloqueada sin terminar
const seleccionarSiguienteAlPaso = () => {
  for (const lec of leccionesOrdenadas.value) {
    if (esLeccionDesbloqueada(lec.id_leccion_jf) && !obtenerEstadoCompletado(lec)) {
      seleccionarLeccion(lec);
      return;
    }
  }
  // Si todo está terminado, seleccionar la primera
  if (leccionesOrdenadas.value.length > 0) {
    seleccionarLeccion(leccionesOrdenadas.value[0]);
  }
};

const seleccionarLeccion = (leccion) => {
  if (!esLeccionDesbloqueada(leccion.id_leccion_jf)) {
    $q.notify({ type: 'warning', message: 'Esta lección está bloqueada. Debes completar las anteriores.' });
    return;
  }
  leccionActiva.value = leccion;
  evaluacionActiva.value = null;
  activeBloqueEvaluacion.value = null;
  resultadoQuiz.value = null;
};

const seleccionarEvaluacion = (bloque) => {
  if (!esEvaluacionHabilitada(bloque)) {
    $q.notify({ type: 'warning', message: 'Debes completar todas las lecciones del bloque para rendir la evaluación.' });
    return;
  }
  evaluacionActiva.value = bloque.evaluacion_jf;
  activeBloqueEvaluacion.value = bloque;
  leccionActiva.value = null;
  resultadoQuiz.value = null;
  respuestasCuestionario.value = Array(bloque.evaluacion_jf.preguntasJson_jf?.length).fill(null);
};

// URLs de video con token incrustado para autenticar
const videoUrl = computed(() => {
  if (!leccionActiva.value || !leccionActiva.value.urlArchivo_jf) return '';
  return `${BASE_URL_API_AHBB}/multimedia/lecciones/${leccionActiva.value.id_leccion_jf}/video?token=${tokenJWT}`;
});

// Registrar completado al terminar el video
const alTerminarVideo = async () => {
  if (!leccionActiva.value) return;
  
  // Si ya estaba completado, ignorar
  if (obtenerEstadoCompletado(leccionActiva.value)) return;

  try {
    await registrarProgresoLeccion_jf(leccionActiva.value.id_leccion_jf, true, 100);
    $q.notify({ type: 'positive', message: '¡Lección completada!', icon: 'check_circle' });
    await cargarDatos(); // Recargar datos para desbloquear siguiente reactivamente
  } catch (e) {
    console.error(e);
  }
};

const completarLectura = async () => {
  if (!leccionActiva.value) return;
  try {
    await registrarProgresoLeccion_jf(leccionActiva.value.id_leccion_jf, true, 100);
    $q.notify({ type: 'positive', message: '¡Lectura completada!' });
    await cargarDatos();
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Fallo al guardar progreso.' });
  }
};

const enviarEvaluacion = async () => {
  if (respuestasCuestionario.value.some((r) => r === null)) {
    $q.notify({ type: 'warning', message: 'Por favor responde todas las preguntas antes de enviar.' });
    return;
  }

  enviandoQuiz.value = true;
  try {
    const res = await resolverEvaluacion_jf(evaluacionActiva.value.id_evaluacion_jf, respuestasCuestionario.value);
    resultadoQuiz.value = res;
    if (res.aprobado) {
      $q.notify({ type: 'positive', message: '¡Felicitaciones! Has aprobado el bloque.', icon: 'emoji_events' });
    } else {
      $q.notify({ type: 'negative', message: `No has aprobado. Nota obtenida: ${res.notaObtenida}/20.` });
    }
    await cargarDatos();
  } catch (error) {
    const err = extraerError_jf(error, 'Error al procesar la evaluación.');
    $q.notify({ type: 'negative', message: err.mensaje });
  } finally {
    enviandoQuiz.value = false;
  }
};

onMounted(cargarDatos);
</script>

<template>
  <q-page class="q-pa-lg bg-grey-1">
    <!-- Spinner -->
    <div v-if="cargando && bloques.length === 0" class="flex flex-center q-py-xl absolute-center">
      <q-spinner-tail color="primary" size="80px" />
    </div>

    <!-- Empty State (No content uploaded yet) -->
    <div v-else-if="bloques.length === 0" class="flex flex-center column q-py-xl text-center text-grey-5 absolute-center" style="max-width: 500px; width: 90%;">
      <q-icon name="video_library" size="100px" class="text-grey-4" />
      <h2 class="text-h5 text-weight-bold q-mt-md text-dark q-mb-xs">Aula Virtual Vacía</h2>
      <p class="text-body1 text-grey-6">El facilitador asignado aún no ha configurado bloques de estudio, lecciones o exámenes en esta asignatura.</p>
      <q-btn unelevated color="primary" label="Volver a mis cursos" icon="arrow_back" class="q-mt-md rounded-lg text-weight-bold" to="/alumno/aula-virtual" />
    </div>

    <!-- Main Player Layout (Responsive Grid) -->
    <div v-else class="row q-col-gutter-lg">
      
      <!-- PANEL IZQUIERDO: CONTENIDO Y PLAYER -->
      <div class="col-12 col-md-8 column q-gap-md">
        <!-- Alerta de videollamada activa -->
        <q-banner v-if="salaActivaEnVivo" rounded class="bg-positive text-white q-mb-lg shadow-1">
          <template v-slot:avatar>
            <q-icon name="video_call" color="white" />
          </template>
          <div class="text-subtitle1 text-weight-bold">
            ¡Clase en vivo activa ahora!
          </div>
          <div class="text-caption">
            Tema: "{{ salaActivaEnVivo.titulo_jf }}"
          </div>
          <template v-slot:action>
            <q-btn unelevated color="white" text-color="positive" label="Unirse Ahora" class="text-weight-bold rounded-lg" :to="`/aula-virtual/videollamada/${salaActivaEnVivo.id_sala_jf}`" />
          </template>
        </q-banner>

        <div v-if="leccionActiva" class="column q-gap-md full-width">
          <!-- Reproductor de Video -->
          <div v-if="leccionActiva.tipo_jf === 'VIDEO'" class="video-container shadow-2 rounded-xl bg-black overflow-hidden relative-position">
            <video
              v-if="videoUrl"
              :key="leccionActiva.id_leccion_jf"
              :src="videoUrl"
              controls
              autoplay
              controlsList="nodownload"
              @ended="alTerminarVideo"
              class="full-width full-height object-contain"
            ></video>
          </div>

          <!-- Banner aviso de video de simulación del seed -->
          <div v-if="leccionActiva.tipo_jf === 'VIDEO' && leccionActiva.urlArchivo_jf && leccionActiva.urlArchivo_jf.includes('video_demo')" class="bg-amber-1 text-amber-9 q-pa-md rounded-xl text-body2 row items-center q-gap-sm border border-amber-3">
            <q-icon name="info" size="sm" color="amber-9" />
            <div class="col">
              <span class="text-weight-bold">Video Demostrativo del Seed:</span> 
              Este archivo es un dummy simulado de 1MB creado por el semillero inicial. Para reproducir videos reales con decodificación completa, inicia sesión como profesor (Carlos) y sube tu propio archivo de video en el constructor multimedia.
            </div>
          </div>

          <!-- Reproductor de Lectura -->
          <q-card v-else flat bordered class="rounded-xl q-pa-xl text-dark bg-white border-grey-3 full-width">
            <q-card-section class="q-pa-none">
              <div class="text-h4 text-weight-bold text-primary q-mb-md">
                {{ leccionActiva.titulo_jf }}
              </div>
              <q-separator class="q-my-lg" />
              <div class="text-body1 text-justify line-height-relaxed text-grey-9 whitespace-pre-line">
                {{ leccionActiva.contenidoTexto_jf || 'Esta lección de lectura no posee contenido registrado.' }}
              </div>

              <div class="row justify-end q-mt-xl">
                <q-btn
                  v-if="!obtenerEstadoCompletado(leccionActiva)"
                  unelevated
                  color="positive"
                  icon="check"
                  label="Marcar como leída"
                  class="rounded-lg text-weight-bold q-px-lg q-py-sm"
                  @click="completarLectura"
                />
                <q-chip v-else color="positive-1" text-color="positive" icon="done" label="Lectura Completada" class="text-weight-bold q-px-md" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Detalles de Lección (Abajo del Video) -->
          <div v-if="leccionActiva.tipo_jf === 'VIDEO'" class="q-mt-md">
            <h2 class="text-h4 text-weight-bold text-dark q-my-none">
              {{ leccionActiva.titulo_jf }}
            </h2>
            <p class="text-subtitle1 text-grey-7 q-mt-sm">
              {{ leccionActiva.descripcion_jf || 'Sin descripción adicional para esta lección.' }}
            </p>
          </div>
        </div>

        <!-- Vista Evaluación -->
        <div v-else-if="evaluacionActiva" class="column justify-center items-center full-width">
          <q-card flat bordered class="rounded-xl q-pa-xl bg-white border-grey-3 full-width max-width-lg">
            <q-card-section class="q-pa-none">
              <div class="text-h4 text-weight-bold text-primary q-mb-xs">
                {{ evaluacionActiva.titulo_jf }}
              </div>
              <div class="text-subtitle1 text-grey-6 q-mb-lg">
                {{ evaluacionActiva.descripcion_jf || 'Lee con atención y responde el cuestionario.' }}
              </div>

              <div class="row q-gap-md q-mb-xl">
                <q-badge color="primary">Examen sobre 20 puntos</q-badge>
                <q-badge color="secondary">Nota Mínima para Aprobar: {{ evaluacionActiva.notaMinima_jf }} / 20</q-badge>
                <q-badge color="accent">Límite de Intentos: {{ evaluacionActiva.intentosMaximos_jf }}</q-badge>
              </div>

              <!-- Si ya está aprobada -->
              <div v-if="esEvaluacionAprobada(activeBloqueEvaluacion)" class="text-center q-py-xl bg-positive-1 rounded-xl text-positive column items-center q-gap-md">
                <q-icon name="emoji_events" size="80px" />
                <h3 class="text-h5 text-weight-bold q-my-none">¡Bloque Aprobado!</h3>
                <p class="text-body1 q-mb-none text-grey-8">Ya has aprobado este bloque de forma exitosa.</p>
              </div>

              <!-- Si no está aprobada y quedan intentos -->
              <div v-else-if="!resultadoQuiz">
                <div class="column q-gap-lg">
                  <div v-for="(p, index) in evaluacionActiva.preguntasJson_jf" :key="index" class="q-mb-md">
                    <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm">
                      {{ index + 1 }}. {{ p.pregunta }}
                    </div>
                    <q-option-group
                      v-model="respuestasCuestionario[index]"
                      :options="p.opciones.map((opt, oIdx) => ({ label: opt, value: oIdx }))"
                      color="primary"
                    />
                  </div>
                </div>

                <div class="row justify-end q-mt-xl">
                  <q-btn
                    unelevated
                    color="primary"
                    label="Enviar Respuestas"
                    icon="send"
                    class="rounded-lg text-weight-bold q-px-xl q-py-md"
                    :loading="enviandoQuiz"
                    @click="enviarEvaluacion"
                  />
                </div>
              </div>

              <!-- Si acaba de rendir el examen (Resultado) -->
              <div v-else class="text-center q-py-xl rounded-xl column items-center q-gap-md" :class="resultadoQuiz.aprobado ? 'bg-positive-1 text-positive' : 'bg-negative-1 text-negative'">
                <q-icon :name="resultadoQuiz.aprobado ? 'check_circle' : 'cancel'" size="80px" />
                <h3 class="text-h5 text-weight-bold q-my-none">
                  {{ resultadoQuiz.aprobado ? '¡Aprobado!' : 'No Aprobado' }}
                </h3>
                <p class="text-body1 text-grey-8 q-mb-none">
                  Nota obtenida: <span class="text-weight-bold">{{ resultadoQuiz.notaObtenida }} / 20</span> (Mínimo: {{ evaluacionActiva.notaMinima_jf }})
                </p>
                <p class="text-caption text-grey-6 q-mb-none">
                  Aciertos: {{ resultadoQuiz.aciertos }} de {{ resultadoQuiz.totalPreguntas }} preguntas.
                  Intentos restantes: {{ resultadoQuiz.intentosRestantes }}.
                </p>
                <q-btn
                  v-if="!resultadoQuiz.aprobado && resultadoQuiz.intentosRestantes > 0"
                  unelevated
                  color="negative"
                  label="Reintentar Evaluación"
                  class="rounded-lg text-weight-bold q-mt-md"
                  @click="resultadoQuiz = null; respuestasCuestionario = Array(evaluacionActiva.preguntasJson_jf?.length).fill(null);"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- PANEL DERECHO: PLAYLIST SIDEBAR -->
      <div class="col-12 col-md-4 column bg-white border border-grey-3 rounded-xl shadow-1 overflow-hidden" style="max-height: calc(100vh - 100px); min-height: 400px;">
        <div class="q-pa-lg bg-grey-2 border-bottom border-grey-3">
          <div class="text-subtitle1 text-weight-bold text-dark ellipsis">Playlist del Curso</div>
          <div class="text-caption text-grey-6">Consumo lineal verificado</div>
        </div>

        <div class="col overflow-auto q-py-md">
          <q-list class="q-px-md column q-gap-md">
            <div v-for="b in bloques" :key="b.id_bloque_jf">
              <!-- Nombre del Bloque -->
              <div class="row items-center q-mb-sm justify-between">
                <span class="text-subtitle2 text-weight-bold text-primary col ellipsis">
                  {{ b.nombre_jf }}
                </span>
                <q-icon
                  :name="esBloqueDesbloqueado(b) ? 'lock_open' : 'lock'"
                  :color="esBloqueDesbloqueado(b) ? 'grey-5' : 'negative'"
                  size="xs"
                />
              </div>

              <!-- Lista de Lecciones de este bloque -->
              <q-list v-if="esBloqueDesbloqueado(b)" class="column q-gap-xs q-mb-md">
                <q-item
                  v-for="l in b.lecciones_jf"
                  :key="l.id_leccion_jf"
                  clickable
                  v-ripple
                  class="rounded-lg playlist-item"
                  :active="leccionActiva && leccionActiva.id_leccion_jf === l.id_leccion_jf"
                  active-class="active-playlist"
                  :disabled="!esLeccionDesbloqueada(l.id_leccion_jf)"
                  @click="seleccionarLeccion(l)"
                >
                  <q-item-section avatar min-width="32px">
                    <!-- Icono según completada -->
                    <q-icon
                      v-if="obtenerEstadoCompletado(l)"
                      name="check_circle"
                      color="positive"
                      size="sm"
                    />
                    <q-icon
                      v-else-if="!esLeccionDesbloqueada(l.id_leccion_jf)"
                      name="lock"
                      color="grey-4"
                      size="sm"
                    />
                    <q-icon
                      v-else
                      name="play_circle_outline"
                      color="primary"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-body2 text-weight-bold text-dark ellipsis">
                      {{ l.orden_jf }}. {{ l.titulo_jf }}
                    </q-item-label>
                    <q-item-label caption class="text-caption text-grey-6">
                      {{ l.tipo_jf }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Evaluación del Bloque -->
                <q-item
                  v-if="b.evaluacion_jf"
                  clickable
                  v-ripple
                  class="rounded-lg playlist-item bg-amber-1"
                  :active="evaluacionActiva && evaluacionActiva.id_evaluacion_jf === b.evaluacion_jf.id_evaluacion_jf"
                  active-class="active-eval"
                  :disabled="!esEvaluacionHabilitada(b)"
                  @click="seleccionarEvaluacion(b)"
                >
                  <q-item-section avatar min-width="32px">
                    <q-icon
                      :name="esEvaluacionAprobada(b) ? 'emoji_events' : 'assignment_turned_in'"
                      :color="esEvaluacionAprobada(b) ? 'positive' : esEvaluacionHabilitada(b) ? 'warning' : 'grey-4'"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-body2 text-weight-bold text-dark ellipsis">
                      Examen: {{ b.evaluacion_jf.titulo_jf }}
                    </q-item-label>
                    <q-item-label caption class="text-caption text-grey-6">
                      {{ esEvaluacionAprobada(b) ? 'Aprobada' : 'Aprobación Requerida' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Bloque bloqueado -->
              <div v-else class="text-caption text-grey-5 q-pa-sm text-center bg-grey-2 rounded-lg q-mb-md">
                <q-icon name="lock" size="14px" class="q-mr-xs" /> Contenido bloqueado.
              </div>
            </div>
          </q-list>
        </div>
      </div>

    </div>
  </q-page>
</template>

<style scoped>
.full-height {
  height: 100%;
}
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}
.object-contain {
  object-fit: contain;
}
.rounded-xl {
  border-radius: 20px;
}
.rounded-lg {
  border-radius: 10px;
}
.border-left {
  border-left: 1px solid #e0e0e0;
}
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-grey-3 {
  border: 1px solid #e0e0e0;
}
.line-height-relaxed {
  line-height: 1.6;
}
.whitespace-pre-line {
  white-space: pre-line;
}
.playlist-item {
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.playlist-item:hover {
  background-color: #f5f5f5;
}
.active-playlist {
  background-color: #e3f2fd !important;
  border: 1px solid #90caf9;
}
.active-eval {
  background-color: #fff9c4 !important;
  border: 1px solid #fff59d;
}
.max-width-lg {
  max-width: 750px;
}
.q-gap-xs {
  gap: 4px;
}
.q-gap-sm {
  gap: 8px;
}
.q-gap-md {
  gap: 12px;
}
.q-gap-lg {
  gap: 16px;
}
</style>
