<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  obtenerContenidoCurso_jf,
  crearBloque_jf,
  actualizarBloque_jf,
  eliminarBloque_jf,
  crearLeccion_jf,
  actualizarLeccion_jf,
  eliminarLeccion_jf,
  subirVideoLeccion_jf,
  guardarEvaluacion_jf,
  obtenerSalasCurso_jf,
  crearSalaVideollamada_jf,
  actualizarEstadoSala_jf,
  extraerError_jf,
} from '../../servicios/multimediaServicio_jf';
import { obtenerCursoPorId_ahbb } from '../../servicios/cursosServicio_ahbb';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const cursoId = Number(route.params.id);
const curso = ref(null);
const bloques = ref([]);
const salas = ref([]);

const cargando = ref(false);
const cargandoSalas = ref(false);
const paso = ref(1);

// Modals
const modalBloque = ref(false);
const modalLeccion = ref(false);
const modalPregunta = ref(false);
const modalSala = ref(false);

// Edit targets
const editandoBloqueId = ref(null);
const editandoLeccionId = ref(null);

// Forms
const formBloque = ref({ nombre_jf: '', descripcion_jf: '', orden_jf: 1 });
const formLeccion = ref({ titulo_jf: '', descripcion_jf: '', orden_jf: 1, tipo_jf: 'VIDEO', contenidoTexto_jf: '' });
const formPregunta = ref({ pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0 });
const formSala = ref({ titulo_jf: '', fechaProgramada_jf: '' });

// Uploading video progress
const subiendoVideo = ref({}); // { leccionId: true/false }
const progresoVideo = ref({}); // { leccionId: 0..100 }

// Current evaluation being edited per block
const evaluacionBloque = ref({}); // { bloqueId: { titulo_jf, ... } }
const preguntasEvaluacion = ref([]); // array of questions for active evaluation edit

// Load initial details
const cargarDatos = async () => {
  cargando.value = true;
  try {
    const c = await obtenerCursoPorId_ahbb(cursoId);
    if (!c) {
      $q.notify({ type: 'negative', message: 'No se pudo cargar el curso.' });
      router.push('/profesor/cursos-multimedia');
      return;
    }
    curso.value = c;
    
    // Contenido multimedia
    const content = await obtenerContenidoCurso_jf(cursoId);
    bloques.value = content.bloques || [];
    
    // Preparar mapas de evaluaciones
    bloques.value.forEach((b) => {
      if (b.evaluacion_jf) {
        evaluacionBloque.value[b.id_bloque_jf] = {
          titulo_jf: b.evaluacion_jf.titulo_jf,
          descripcion_jf: b.evaluacion_jf.descripcion_jf,
          notaMinima_jf: Number(b.evaluacion_jf.notaMinima_jf),
          intentosMaximos_jf: b.evaluacion_jf.intentosMaximos_jf,
          preguntasJson_jf: b.evaluacion_jf.preguntasJson_jf || [],
        };
      } else {
        inicializarEvaluacionVacia(b.id_bloque_jf);
      }
    });

    await cargarSalas();
  } catch (error) {
    console.error('Error al cargar datos:', error);
    $q.notify({ type: 'negative', message: 'Fallo al cargar estructura del curso.' });
  } finally {
    cargando.value = false;
  }
};

const cargarSalas = async () => {
  cargandoSalas.value = true;
  try {
    const data = await obtenerSalasCurso_jf(cursoId);
    salas.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    cargandoSalas.value = false;
  }
};

const inicializarEvaluacionVacia = (bloqueId) => {
  evaluacionBloque.value[bloqueId] = {
    titulo_jf: 'Evaluación de Bloque',
    descripcion_jf: '',
    notaMinima_jf: 12,
    intentosMaximos_jf: 3,
    preguntasJson_jf: [],
  };
};

// ─── ACCIONES BLOQUES ──────────────────────────────────────────

const abrirCrearBloque = () => {
  editandoBloqueId.value = null;
  formBloque.value = {
    nombre_jf: '',
    descripcion_jf: '',
    orden_jf: bloques.value.length + 1,
  };
  modalBloque.value = true;
};

const abrirEditarBloque = (bloque) => {
  editandoBloqueId.value = bloque.id_bloque_jf;
  formBloque.value = {
    nombre_jf: bloque.nombre_jf,
    descripcion_jf: bloque.descripcion_jf || '',
    orden_jf: bloque.orden_jf,
  };
  modalBloque.value = true;
};

const guardarBloque = async () => {
  try {
    if (editandoBloqueId.value) {
      await actualizarBloque_jf(editandoBloqueId.value, formBloque.value);
      $q.notify({ type: 'positive', message: 'Bloque actualizado.' });
    } else {
      await crearBloque_jf({
        ...formBloque.value,
        id_curso_bloque_jf: cursoId,
      });
      $q.notify({ type: 'positive', message: 'Bloque creado con éxito.' });
    }
    modalBloque.value = false;
    await cargarDatos();
  } catch (error) {
    const err = extraerError_jf(error, 'Error al guardar bloque.');
    $q.notify({ type: 'negative', message: err.mensaje });
  }
};

const confirmarEliminarBloque = (bloqueId) => {
  $q.dialog({
    title: '¿Confirmar eliminación?',
    message: 'Se borrarán de forma permanente todas las lecciones y progresos asociados a este bloque.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await eliminarBloque_jf(bloqueId);
      $q.notify({ type: 'positive', message: 'Bloque eliminado.' });
      await cargarDatos();
    } catch (error) {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar el bloque.' });
    }
  });
};

// ─── ACCIONES LECCIONES ────────────────────────────────────────

const activeBloqueId = ref(null);

const abrirCrearLeccion = (bloqueId) => {
  activeBloqueId.value = bloqueId;
  editandoLeccionId.value = null;
  const numLec = bloques.value.find((b) => b.id_bloque_jf === bloqueId)?.lecciones_jf?.length || 0;
  formLeccion.value = {
    titulo_jf: '',
    descripcion_jf: '',
    orden_jf: numLec + 1,
    tipo_jf: 'VIDEO',
    contenidoTexto_jf: '',
  };
  modalLeccion.value = true;
};

const abrirEditarLeccion = (leccion, bloqueId) => {
  activeBloqueId.value = bloqueId;
  editandoLeccionId.value = leccion.id_leccion_jf;
  formLeccion.value = {
    titulo_jf: leccion.titulo_jf,
    descripcion_jf: leccion.descripcion_jf || '',
    orden_jf: leccion.orden_jf,
    tipo_jf: leccion.tipo_jf,
    contenidoTexto_jf: leccion.contenidoTexto_jf || '',
  };
  modalLeccion.value = true;
};

const guardarLeccion = async () => {
  try {
    if (editandoLeccionId.value) {
      await actualizarLeccion_jf(editandoLeccionId.value, formLeccion.value);
      $q.notify({ type: 'positive', message: 'Lección actualizada.' });
    } else {
      await crearLeccion_jf({
        ...formLeccion.value,
        id_bloque_leccion_jf: activeBloqueId.value,
      });
      $q.notify({ type: 'positive', message: 'Lección creada.' });
    }
    modalLeccion.value = false;
    await cargarDatos();
  } catch (error) {
    const err = extraerError_jf(error, 'Error al guardar lección.');
    $q.notify({ type: 'negative', message: err.mensaje });
  }
};

const confirmarEliminarLeccion = (leccionId) => {
  $q.dialog({
    title: '¿Confirmar eliminación?',
    message: 'Esta lección y su video o lectura se eliminarán para siempre.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await eliminarLeccion_jf(leccionId);
      $q.notify({ type: 'positive', message: 'Lección eliminada.' });
      await cargarDatos();
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Fallo al eliminar lección.' });
    }
  });
};

// Subida de video
const subirArchivoVideo = async (leccionId, archivo) => {
  if (!archivo) return;
  subiendoVideo.value[leccionId] = true;
  progresoVideo.value[leccionId] = 0;
  
  try {
    await subirVideoLeccion_jf(leccionId, archivo, (porcentaje) => {
      progresoVideo.value[leccionId] = porcentaje;
    });
    $q.notify({ type: 'positive', message: 'Video subido con éxito.' });
    await cargarDatos();
  } catch (error) {
    const err = extraerError_jf(error, 'Error al subir video.');
    $q.notify({ type: 'negative', message: err.mensaje });
  } finally {
    subiendoVideo.value[leccionId] = false;
  }
};

// ─── ACCIONES EVALUACIONES ─────────────────────────────────────

const activeEvaluacionBloqueId = ref(null);

const abrirEditorEvaluacion = (bloque) => {
  activeEvaluacionBloqueId.value = bloque.id_bloque_jf;
  const ev = evaluacionBloque.value[bloque.id_bloque_jf];
  preguntasEvaluacion.value = ev.preguntasJson_jf ? JSON.parse(JSON.stringify(ev.preguntasJson_jf)) : [];
};

const abrirAgregarPregunta = () => {
  formPregunta.value = {
    pregunta: '',
    opciones: ['', '', '', ''],
    respuestaCorrecta: 0,
  };
  modalPregunta.value = true;
};

const agregarPregunta = () => {
  const p = formPregunta.value;
  if (!p.pregunta.trim() || p.opciones.some((o) => !o.trim())) {
    $q.notify({ type: 'warning', message: 'Por favor completa la pregunta y sus 4 opciones.' });
    return;
  }
  preguntasEvaluacion.value.push({
    pregunta: p.pregunta.trim(),
    opciones: p.opciones.map((o) => o.trim()),
    respuestaCorrecta: Number(p.respuestaCorrecta),
  });
  modalPregunta.value = false;
};

const quitarPregunta = (index) => {
  preguntasEvaluacion.value.splice(index, 1);
};

const guardarEvaluacionCompleta = async (bloqueId) => {
  const ev = evaluacionBloque.value[bloqueId];
  if (preguntasEvaluacion.value.length === 0) {
    $q.notify({ type: 'warning', message: 'Agrega al menos una pregunta a la evaluación.' });
    return;
  }
  
  try {
    await guardarEvaluacion_jf({
      id_bloque_evaluacion_jf: bloqueId,
      titulo_jf: ev.titulo_jf,
      descripcion_jf: ev.descripcion_jf || '',
      notaMinima_jf: ev.notaMinima_jf,
      intentosMaximos_jf: ev.intentosMaximos_jf,
      preguntasJson_jf: preguntasEvaluacion.value,
    });
    $q.notify({ type: 'positive', message: 'Evaluación guardada correctamente.' });
    activeEvaluacionBloqueId.value = null;
    await cargarDatos();
  } catch (error) {
    const err = extraerError_jf(error, 'Error al guardar la evaluación.');
    $q.notify({ type: 'negative', message: err.mensaje });
  }
};

// ─── ACCIONES SALAS DE VIDEOLLAMADA ──────────────────────────

const abrirCrearSala = () => {
  formSala.value = {
    titulo_jf: '',
    fechaProgramada_jf: new Date().toISOString(),
  };
  modalSala.value = true;
};

const programarSala = async () => {
  try {
    await crearSalaVideollamada_jf({
      id_curso_sala_jf: cursoId,
      titulo_jf: formSala.value.titulo_jf,
      fechaProgramada_jf: new Date(formSala.value.fechaProgramada_jf).toISOString(),
    });
    $q.notify({ type: 'positive', message: 'Videollamada programada.' });
    modalSala.value = false;
    await cargarSalas();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al programar videollamada.' });
  }
};

const iniciarVideollamada = async (salaId) => {
  try {
    await actualizarEstadoSala_jf(salaId, 'EN_VIVO');
    router.push(`/aula-virtual/videollamada/${salaId}`);
  } catch (e) {
    $q.notify({ type: 'negative', message: 'No se pudo iniciar la videollamada.' });
  }
};

const finalizarVideollamada = async (salaId) => {
  try {
    await actualizarEstadoSala_jf(salaId, 'FINALIZADA');
    $q.notify({ type: 'info', message: 'Videollamada finalizada.' });
    await cargarSalas();
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al finalizar.' });
  }
};

onMounted(cargarDatos);
</script>

<template>
  <q-page class="q-pa-xl bg-grey-1">
    <div v-if="cargando && !curso" class="flex flex-center q-py-xl">
      <q-spinner-tail color="primary" size="80px" />
    </div>

    <div v-else-if="curso">
      <!-- Header -->
      <div class="row items-center q-mb-xl q-gap-md">
        <q-btn flat round color="primary" icon="arrow_back" to="/profesor/cursos-multimedia" size="lg" />
        <div class="col">
          <div class="text-caption text-primary text-weight-bold text-uppercase">Constructor Multimedia</div>
          <h1 class="text-h3 text-weight-bold text-dark q-my-none line-height-tight">
            {{ curso.nombre_ahbb }}
          </h1>
        </div>
      </div>

      <!-- Stepper Principal -->
      <q-stepper
        v-model="paso"
        ref="stepper"
        color="primary"
        animated
        header-nav
        flat
        bordered
        class="rounded-xl shadow-1 bg-white"
      >
        <!-- PASO 1: BLOQUES -->
        <q-step :name="1" title="Estructura de Bloques" icon="folder" :done="paso > 1">
          <div class="row justify-between items-center q-mb-lg">
            <h2 class="text-h5 text-weight-bold text-primary q-my-none">Bloques de Contenido</h2>
            <q-btn unelevated color="primary" icon="add" label="Agregar Bloque" class="rounded-lg text-weight-bold" @click="abrirCrearBloque" />
          </div>

          <div v-if="bloques.length === 0" class="text-center q-py-xl text-grey-5">
            <q-icon name="folder_open" size="64px" />
            <div class="text-h6 q-mt-md">Aún no has creado bloques de contenido.</div>
          </div>

          <q-list v-else bordered separator class="rounded-xl overflow-hidden border-grey-3">
            <q-item v-for="b in bloques" :key="b.id_bloque_jf" class="q-py-md">
              <q-item-section avatar>
                <q-avatar color="primary-1" text-color="primary" icon="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-h6 text-weight-bold text-dark">
                  Bloque {{ b.orden_jf }}: {{ b.nombre_jf }}
                </q-item-label>
                <q-item-label caption class="text-body2 text-grey-7">
                  {{ b.descripcion_jf || 'Sin descripción.' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gap-sm">
                  <q-btn flat round color="primary" icon="edit" @click="abrirEditarBloque(b)" />
                  <q-btn flat round color="negative" icon="delete" @click="confirmarEliminarBloque(b.id_bloque_jf)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-step>

        <!-- PASO 2: LECCIONES -->
        <q-step :name="2" title="Lecciones y Video" icon="play_circle_filled" :done="paso > 2">
          <div class="q-mb-lg">
            <h2 class="text-h5 text-weight-bold text-primary q-my-none">Contenido del Curso</h2>
            <p class="text-grey-7 q-mt-xs q-mb-none">Agrega y edita videos, lecturas o recursos para cada bloque.</p>
          </div>

          <div v-if="bloques.length === 0" class="text-center q-py-xl text-grey-5">
            <q-icon name="warning" size="64px" />
            <div class="text-h6 q-mt-md">Debes crear al menos un bloque primero.</div>
          </div>

          <div v-else class="column q-gap-lg">
            <q-card v-for="b in bloques" :key="b.id_bloque_jf" flat bordered class="rounded-xl border-grey-3">
              <q-card-section class="bg-grey-2 row justify-between items-center q-py-md q-px-lg">
                <div class="text-h6 text-weight-bold text-dark">
                  Bloque {{ b.orden_jf }}: {{ b.nombre_jf }}
                </div>
                <q-btn flat dense color="primary" icon="add" label="Agregar Lección" class="text-weight-bold" @click="abrirCrearLeccion(b.id_bloque_jf)" />
              </q-card-section>

              <q-card-section class="q-pa-none">
                <div v-if="!b.lecciones_jf || b.lecciones_jf.length === 0" class="q-pa-lg text-center text-grey-5">
                  Sin lecciones registradas.
                </div>
                <q-list v-else separator>
                  <q-item v-for="l in b.lecciones_jf" :key="l.id_leccion_jf" class="q-py-md">
                    <q-item-section avatar>
                      <q-icon :name="l.tipo_jf === 'VIDEO' ? 'play_circle' : l.tipo_jf === 'LECTURA' ? 'description' : 'attachment'" color="primary" size="md" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-subtitle1 text-weight-bold text-dark">
                        {{ l.orden_jf }}. {{ l.titulo_jf }}
                      </q-item-label>
                      <q-item-label caption class="text-body2 text-grey-6 q-mb-xs">
                        Tipo: <q-badge dense outline color="primary" class="text-weight-bold">{{ l.tipo_jf }}</q-badge>
                        <span v-if="l.descripcion_jf"> · {{ l.descripcion_jf }}</span>
                      </q-item-label>
                      
                      <!-- Video Subida -->
                      <div v-if="l.tipo_jf === 'VIDEO'" class="q-mt-sm">
                        <div v-if="l.urlArchivo_jf" class="row items-center q-gap-sm">
                          <q-icon name="check_circle" color="positive" size="18px" />
                          <span class="text-caption text-grey-8">Archivo de video: <code>{{ l.urlArchivo_jf.split('/').pop() }}</code></span>
                          <q-file dense borderless class="q-pa-none" style="display:inline-block; width:140px" accept="video/mp4" @update:model-value="(val) => subirArchivoVideo(l.id_leccion_jf, val)" label="Reemplazar video..." />
                        </div>
                        <div v-else>
                          <q-file filled dense class="max-width-xs" accept="video/mp4" label="Seleccionar video (.mp4)" @update:model-value="(val) => subirArchivoVideo(l.id_leccion_jf, val)" :loading="subiendoVideo[l.id_leccion_jf]" />
                          <div v-if="subiendoVideo[l.id_leccion_jf]" class="row items-center q-mt-xs q-gap-sm max-width-xs">
                            <q-linear-progress :value="progresoVideo[l.id_leccion_jf] / 100" color="primary" track-color="grey-4" class="col" />
                            <span class="text-caption text-weight-bold">{{ progresoVideo[l.id_leccion_jf] }}%</span>
                          </div>
                        </div>
                      </div>
                    </q-item-section>

                    <q-item-section side>
                      <div class="row q-gap-sm">
                        <q-btn flat round color="primary" icon="edit" @click="abrirEditarLeccion(l, b.id_bloque_jf)" />
                        <q-btn flat round color="negative" icon="delete" @click="confirmarEliminarLeccion(l.id_leccion_jf)" />
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </q-step>

        <!-- PASO 3: EVALUACIONES -->
        <q-step :name="3" title="Evaluaciones de Bloque" icon="quiz" :done="paso > 3">
          <div class="q-mb-lg">
            <h2 class="text-h5 text-weight-bold text-primary q-my-none">Evaluaciones Diagnósticas</h2>
            <p class="text-grey-7 q-mt-xs q-mb-none">Configura cuestionarios tipo test opcionales al cierre de cada bloque.</p>
          </div>

          <div v-if="bloques.length === 0" class="text-center q-py-xl text-grey-5">
            <q-icon name="warning" size="64px" />
            <div class="text-h6 q-mt-md">Debes crear al menos un bloque primero.</div>
          </div>

          <div v-else class="column q-gap-lg">
            <div v-for="b in bloques" :key="b.id_bloque_jf">
              <q-card flat bordered class="rounded-xl border-grey-3">
                <q-card-section class="bg-grey-2 row justify-between items-center q-py-md q-px-lg">
                  <div class="text-h6 text-weight-bold text-dark">
                    Evaluación: {{ b.nombre_jf }}
                  </div>
                  <q-btn
                    v-if="activeEvaluacionBloqueId !== b.id_bloque_jf"
                    flat
                    color="primary"
                    icon="edit"
                    label="Configurar Cuestionario"
                    class="text-weight-bold"
                    @click="abrirEditorEvaluacion(b)"
                  />
                  <div v-else class="row q-gap-sm">
                    <q-btn flat color="grey-7" label="Cancelar" @click="activeEvaluacionBloqueId = null" />
                    <q-btn unelevated color="positive" icon="save" label="Guardar Cuestionario" class="text-weight-bold" @click="guardarEvaluacionCompleta(b.id_bloque_jf)" />
                  </div>
                </q-card-section>

                <q-card-section v-if="activeEvaluacionBloqueId !== b.id_bloque_jf" class="q-pa-lg">
                  <div v-if="b.evaluacion_jf" class="column q-gap-xs">
                    <div class="text-subtitle1 text-weight-bold text-primary">{{ b.evaluacion_jf.titulo_jf }}</div>
                    <div class="text-body2 text-grey-7">{{ b.evaluacion_jf.descripcion_jf || 'Sin descripción.' }}</div>
                    <div class="row q-gap-md q-mt-sm">
                      <q-badge color="primary">Nota Mínima: {{ b.evaluacion_jf.notaMinima_jf }} / 20</q-badge>
                      <q-badge color="secondary">Intentos: {{ b.evaluacion_jf.intentosMaximos_jf }}</q-badge>
                      <q-badge color="accent">Preguntas: {{ b.evaluacion_jf.preguntasJson_jf?.length }}</q-badge>
                    </div>
                  </div>
                  <div v-else class="text-center text-grey-5 py-sm">
                    Cierre de bloque libre. No requiere aprobación de evaluación para pasar al siguiente bloque.
                  </div>
                </q-card-section>

                <!-- Formulario Edición de Evaluación -->
                <q-card-section v-else class="q-pa-lg">
                  <div class="row q-col-gutter-md q-mb-md">
                    <div class="col-12 col-sm-6">
                      <q-input v-model="evaluacionBloque[b.id_bloque_jf].titulo_jf" label="Título del examen" outlined dense />
                    </div>
                    <div class="col-12 col-sm-3">
                      <q-input v-model.number="evaluacionBloque[b.id_bloque_jf].notaMinima_jf" type="number" label="Nota Aprobatoria (0-20)" outlined dense />
                    </div>
                    <div class="col-12 col-sm-3">
                      <q-input v-model.number="evaluacionBloque[b.id_bloque_jf].intentosMaximos_jf" type="number" label="Intentos Permitidos" outlined dense />
                    </div>
                    <div class="col-12">
                      <q-input v-model="evaluacionBloque[b.id_bloque_jf].descripcion_jf" label="Instrucciones del examen" outlined dense type="textarea" rows="2" />
                    </div>
                  </div>

                  <q-separator class="q-my-md" />

                  <div class="row justify-between items-center q-mb-md">
                    <div class="text-subtitle1 text-weight-bold text-dark">Banco de Preguntas ({{ preguntasEvaluacion.length }})</div>
                    <q-btn unelevated color="primary" dense icon="add" label="Agregar Pregunta" class="rounded-lg text-weight-bold q-px-sm" @click="abrirAgregarPregunta" />
                  </div>

                  <div v-if="preguntasEvaluacion.length === 0" class="text-center text-grey-5 q-py-lg">
                    Sin preguntas asignadas. Agrégalas desde el botón superior.
                  </div>
                  
                  <q-list v-else bordered separator class="rounded-xl overflow-hidden border-grey-3">
                    <q-item v-for="(p, index) in preguntasEvaluacion" :key="index" class="q-py-md">
                      <q-item-section>
                        <q-item-label class="text-subtitle1 text-weight-bold text-dark">
                          {{ index + 1 }}. {{ p.pregunta }}
                        </q-item-label>
                        <div class="row q-col-gutter-xs q-mt-xs">
                          <div class="col-6 text-caption text-grey-7" v-for="(opt, idx) in p.opciones" :key="idx">
                            <span :class="{'text-positive text-weight-bold': idx === p.respuestaCorrecta}">
                              {{ String.fromCharCode(65 + idx) }}) {{ opt }}
                              <q-icon name="check" color="positive" v-if="idx === p.respuestaCorrecta" />
                            </span>
                          </div>
                        </div>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn flat round color="negative" icon="delete" @click="quitarPregunta(index)" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-step>

        <!-- PASO 4: CLASES EN VIVO -->
        <q-step :name="4" title="Videollamadas" icon="video_call">
          <div class="row justify-between items-center q-mb-lg">
            <div>
              <h2 class="text-h5 text-weight-bold text-primary q-my-none">Clases Virtuales en Vivo</h2>
              <p class="text-grey-7 q-mt-xs q-mb-none">Programa y arranca videoconferencias en tiempo real integradas.</p>
            </div>
            <q-btn unelevated color="primary" icon="video_call" label="Programar Videollamada" class="rounded-lg text-weight-bold" @click="abrirCrearSala" />
          </div>

          <div v-if="cargandoSalas" class="flex flex-center q-py-lg">
            <q-spinner color="primary" size="40px" />
          </div>

          <div v-else-if="salas.length === 0" class="text-center q-py-xl text-grey-5">
            <q-icon name="videocam_off" size="64px" />
            <div class="text-h6 q-mt-md">Aún no has programado salas en vivo.</div>
          </div>

          <q-list v-else bordered separator class="rounded-xl overflow-hidden border-grey-3">
            <q-item v-for="s in salas" :key="s.id_sala_jf" class="q-py-md">
              <q-item-section avatar>
                <q-avatar :color="s.estado_jf === 'EN_VIVO' ? 'positive-1' : s.estado_jf === 'FINALIZADA' ? 'grey-3' : 'primary-1'" 
                          :text-color="s.estado_jf === 'EN_VIVO' ? 'positive' : s.estado_jf === 'FINALIZADA' ? 'grey-7' : 'primary'" 
                          icon="video_chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-subtitle1 text-weight-bold text-dark">
                  {{ s.titulo_jf }}
                </q-item-label>
                <q-item-label caption class="text-body2 text-grey-7">
                  Programada: {{ new Date(s.fechaProgramada_jf).toLocaleString() }}
                </q-item-label>
                <q-item-label caption v-if="s.estado_jf === 'FINALIZADA'" class="text-caption text-grey-5">
                  Duración real: {{ Math.round((s.duracionSegundos_jf || 0) / 60) }} mins.
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gap-sm items-center">
                  <q-chip v-if="s.estado_jf === 'EN_VIVO'" color="positive" text-color="white" label="EN VIVO" class="text-weight-bold pulse-badge" />
                  <q-chip v-else-if="s.estado_jf === 'FINALIZADA'" color="grey-4" text-color="grey-8" label="FINALIZADA" />
                  <q-chip v-else color="primary" text-color="white" label="PROGRAMADA" />

                  <!-- Acciones de estado -->
                  <q-btn v-if="s.estado_jf === 'PROGRAMADA'" unelevated color="positive" dense class="q-px-sm rounded-lg" label="Iniciar Clase" icon="videocam" @click="iniciarVideollamada(s.id_sala_jf)" />
                  <q-btn v-if="s.estado_jf === 'EN_VIVO'" unelevated color="negative" dense class="q-px-sm rounded-lg" label="Finalizar" icon="call_end" @click="finalizarVideollamada(s.id_sala_jf)" />
                  <q-btn v-if="s.estado_jf === 'EN_VIVO'" flat color="primary" dense class="q-px-sm rounded-lg" label="Unirse" icon="link" :to="`/aula-virtual/videollamada/${s.id_sala_jf}`" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-step>
      </q-stepper>
    </div>

    <!-- MODAL BLOQUE -->
    <q-dialog v-model="modalBloque" persistent>
      <q-card style="width: 450px" class="rounded-xl q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-primary">{{ editandoBloqueId ? 'Editar Bloque' : 'Crear Bloque' }}</div>
        </q-card-section>
        <q-card-section class="column q-gap-md">
          <q-input v-model="formBloque.nombre_jf" label="Nombre del Bloque" outlined dense />
          <q-input v-model="formBloque.descripcion_jf" label="Descripción (opcional)" outlined dense type="textarea" rows="3" />
          <q-input v-model.number="formBloque.orden_jf" type="number" label="Orden (ej. 1)" outlined dense />
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md">
          <q-btn flat color="grey-7" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar" class="rounded-lg text-weight-bold" @click="guardarBloque" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL LECCION -->
    <q-dialog v-model="modalLeccion" persistent>
      <q-card style="width: 500px" class="rounded-xl q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-primary">{{ editandoLeccionId ? 'Editar Lección' : 'Crear Lección' }}</div>
        </q-card-section>
        <q-card-section class="column q-gap-md">
          <q-input v-model="formLeccion.titulo_jf" label="Título de la Lección" outlined dense />
          <q-input v-model="formLeccion.descripcion_jf" label="Descripción (opcional)" outlined dense type="textarea" rows="2" />
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select v-model="formLeccion.tipo_jf" :options="['VIDEO', 'LECTURA', 'RECURSO']" label="Tipo de Lección" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model.number="formLeccion.orden_jf" type="number" label="Orden" outlined dense />
            </div>
          </div>
          <q-input v-if="formLeccion.tipo_jf === 'LECTURA'" v-model="formLeccion.contenidoTexto_jf" label="Contenido de Lectura" outlined dense type="textarea" rows="5" />
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md">
          <q-btn flat color="grey-7" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar" class="rounded-lg text-weight-bold" @click="guardarLeccion" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL PREGUNTA -->
    <q-dialog v-model="modalPregunta" persistent>
      <q-card style="width: 500px" class="rounded-xl q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-primary">Agregar Pregunta</div>
        </q-card-section>
        <q-card-section class="column q-gap-sm">
          <q-input v-model="formPregunta.pregunta" label="Enunciado de la Pregunta" outlined dense />
          <q-input v-model="formPregunta.opciones[0]" label="Opción A" outlined dense />
          <q-input v-model="formPregunta.opciones[1]" label="Opción B" outlined dense />
          <q-input v-model="formPregunta.opciones[2]" label="Opción C" outlined dense />
          <q-input v-model="formPregunta.opciones[3]" label="Opción D" outlined dense />
          <q-select
            v-model="formPregunta.respuestaCorrecta"
            emit-value
            map-options
            :options="[
              { label: 'Opción A', value: 0 },
              { label: 'Opción B', value: 1 },
              { label: 'Opción C', value: 2 },
              { label: 'Opción D', value: 3 },
            ]"
            label="Respuesta Correcta"
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md">
          <q-btn flat color="grey-7" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Agregar" class="rounded-lg text-weight-bold" @click="agregarPregunta" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL SALA -->
    <q-dialog v-model="modalSala" persistent>
      <q-card style="width: 450px" class="rounded-xl q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-primary">Programar Videollamada</div>
        </q-card-section>
        <q-card-section class="column q-gap-md">
          <q-input v-model="formSala.titulo_jf" label="Título de la Conferencia" outlined dense />
          <q-input v-model="formSala.fechaProgramada_jf" label="Fecha y Hora (ISO)" outlined dense>
            <template v-slot:prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="formSala.fechaProgramada_jf" mask="YYYY-MM-DD HH:mm">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Ok" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="formSala.fechaProgramada_jf" mask="YYYY-MM-DD HH:mm" format24h>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Ok" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md">
          <q-btn flat color="grey-7" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Programar" class="rounded-lg text-weight-bold" @click="programarSala" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.rounded-xl {
  border-radius: 20px;
}
.rounded-lg {
  border-radius: 10px;
}
.max-width-xs {
  max-width: 320px;
}
.line-height-tight {
  line-height: 1.25;
}
.q-gap-sm {
  gap: 8px;
}
.q-gap-md {
  gap: 12px;
}
.q-gap-lg {
  gap: 20px;
}
.border-grey-3 {
  border: 1px solid #e0e0e0;
}
.pulse-badge {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
