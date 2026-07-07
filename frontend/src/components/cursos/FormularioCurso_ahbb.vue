<!--
  FormularioCurso_ahbb.vue — Formulario crear/editar sin campo "Días" ni "Estatus"
  - El estado lo determina el backend por rol (ADMIN=ACTIVO, PROFESOR=PENDIENTE).
  - Los días se calculan automáticamente desde las horas lectivas y el horario.
-->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';

const props = defineProps({
  cursoInicial_ahbb: { default: null },
  esEdicion_ahbb: { type: Boolean, default: false },
  esAdmin_ahbb: { type: Boolean, default: false },
  esProfesor_ahbb: { type: Boolean, default: false },
  profesores_ahbb: { type: Array, default: () => [] }
});

const emit = defineEmits(['guardar', 'cancelar']);

const cursosStore_ahbb = useCursosStore_ahbb();

const diasDisponibles_ahbb = [
  { label: 'Lunes', value: 'lunes' },
  { label: 'Martes', value: 'martes' },
  { label: 'Miércoles', value: 'miercoles' },
  { label: 'Jueves', value: 'jueves' },
  { label: 'Viernes', value: 'viernes' },
  { label: 'Sábado', value: 'sabado' },
  { label: 'Domingo', value: 'domingo' },
];

const formulario_ahbb = ref({
  nombre: '',
  descripcion: '',
  profesor: '',
  profesorId: null,
  duracionHoras: 40,
  dias: [],
  horaInicio: '08:00',
  horaFin: '10:00',
  topeEstudiantes: 10,
  tienePrelacion: false,
  prelacionCursoId: null,
  temario: '',
  fechaInicio: '',
  mensajeCorreccion: '',
});

// Computed: whether correction message is required (professor editing a rejected course)
const requiereMensajeCorreccion_ahbb = computed(() =>
  props.esProfesor_ahbb &&
  props.esEdicion_ahbb &&
  props.cursoInicial_ahbb?.estatus === 'rechazado'
);

// Helper to get min/max valid fechaInicio for the date input
const fechaMinimaInicio_ahbb = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
});

const fechaMaximaInicio_ahbb = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 31);
  return d.toISOString().split('T')[0];
});

const reglaseFechaInicio_ahbb = [
  (v) => !!v || 'La fecha de inicio es requerida',
  (v) => {
    if (!v) return true;
    const seleccionada = new Date(v + 'T00:00:00');
    const minima = new Date();
    minima.setDate(minima.getDate() + 3);
    minima.setHours(0, 0, 0, 0);
    return seleccionada >= minima || 'Debe ser al menos 3 días a partir de hoy';
  },
  (v) => {
    if (!v) return true;
    const seleccionada = new Date(v + 'T00:00:00');
    const maxima = new Date();
    maxima.setDate(maxima.getDate() + 31);
    maxima.setHours(23, 59, 59, 999);
    return seleccionada <= maxima || 'No puede ser mayor a 1 mes desde hoy';
  },
  (v) => {
    if (!v || formulario_ahbb.value.dias.length === 0) return true;
    const dias_ahbb = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSeleccionado_ahbb = dias_ahbb[new Date(v + 'T12:00:00').getDay()];
    // Normalizar nombres de días para la comparación si es necesario, 
    // pero diasDisponibles_ahbb ya usa minúsculas y sin acentos.
    return formulario_ahbb.value.dias.includes(diaSeleccionado_ahbb) ||
      'La fecha debe coincidir con uno de los días de clase seleccionados';
  }
];

// Cálculo automático de semanas y días estimados con tope de 3h/día
const horasPorDia_ahbb = computed(() => {
  const [ih, im] = formulario_ahbb.value.horaInicio.split(':').map(Number);
  const [fh, fm] = formulario_ahbb.value.horaFin.split(':').map(Number);
  const total = (fh + fm / 60) - (ih + im / 60);
  // Según requerimiento: No deben verse más de 3 horas diarias de clase
  const horasEfectivas = total > 0 ? Math.min(total, 3.0) : 2;
  return horasEfectivas;
});

const horasPorSemana_ahbb = computed(() => {
  const dias = formulario_ahbb.value.dias.length || 1;
  return horasPorDia_ahbb.value * dias;
});

const sesionesTotales_ahbb = computed(() => {
  if (horasPorDia_ahbb.value <= 0) return 0;
  return Math.ceil(formulario_ahbb.value.duracionHoras / horasPorDia_ahbb.value);
});

const semanasEstimadas_ahbb = computed(() => {
  const diasPorSemana = formulario_ahbb.value.dias.length || 1;
  return Math.ceil(sesionesTotales_ahbb.value / diasPorSemana);
});

// ID del profesor actualmente seleccionado en el form (para Admin es el select, para Profesor es su propio ID)
const profesorIdActual_ahbb = computed(() => {
  // Cuando el Admin elige un profesor del select, usamos ese valor
  // Cuando es un Profesor logueado, su id viene precargado en formulario_ahbb como profesorId
  return formulario_ahbb.value.profesorId;
});

// Solo cursos del profesor seleccionado, excluyendo el curso que se está editando
const opcionesPrelacion_ahbb = computed(() => {
  if (!profesorIdActual_ahbb.value) return [];

  return cursosStore_ahbb.listaCursos_ahbb
    .filter((c) =>
      // Del mismo profesor
      String(c.profesorId) === String(profesorIdActual_ahbb.value) &&
      // No el propio curso que se está editando
      String(c.id) !== String(props.cursoInicial_ahbb?.id)
    )
    .map((c) => ({ label: c.nombre, value: c.id }));
});

// Al cambiar el profesor (Admin), limpiar la prelación — pero solo si el form ya tenía datos
// (evita que se ejecute durante la precarga inicial del modo edición)
watch(() => formulario_ahbb.value.profesorId, (_nuevo, viejo) => {
  // Si viejo era null es la inicialización, no limpiar
  if (viejo !== null && viejo !== undefined) {
    formulario_ahbb.value.prelacionCursoId = null;
    formulario_ahbb.value.tienePrelacion = false;
  }
});

// Función reutilizable para precargar el formulario
const precargarFormulario_ahbb = (curso) => {
  if (!curso) return;
  
  // Normalizar fechaInicio: si es string ISO (YYYY-MM-DDTHH:mm:ss.sssZ) o YYYY-MM-DD
  let fechaInicio_ahbb = '';
  if (curso.fechaInicio) {
    if (typeof curso.fechaInicio === 'string' && curso.fechaInicio.length === 10) {
      fechaInicio_ahbb = curso.fechaInicio; // Ya es YYYY-MM-DD
    } else {
      // Intentar extraer con UTC para evitar desfases
      const d = new Date(curso.fechaInicio);
      const anio = d.getUTCFullYear();
      const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(d.getUTCDate()).padStart(2, '0');
      fechaInicio_ahbb = `${anio}-${mes}-${dia}`;
    }
  }

  formulario_ahbb.value = {
    nombre: curso.nombre || '',
    descripcion: curso.descripcion || '',
    profesor: curso.profesor || '',
    profesorId: curso.profesorId || null,
    duracionHoras: curso.duracionHoras || 40,
    dias: [...(curso.dias || [])],
    horaInicio: curso.horaInicio || '08:00',
    horaFin: curso.horaFin || '10:00',
    topeEstudiantes: curso.topeEstudiantes || 10,
    tienePrelacion: curso.tienePrelacion || false,
    prelacionCursoId: curso.prelacionCursoId || null,
    temario: curso.temario || '',
    fechaInicio: fechaInicio_ahbb,
    mensajeCorreccion: '',
  };
};

// Watch con immediate:true reemplaza onMounted.
// Así funciona tanto cuando el prop llega sincrónicamente (store cache)
// como de forma asíncrona (fetch de API). Sin esto, si el padre tardaba
// en setear la prop, el formulario quedaba vacío.
watch(
  () => props.cursoInicial_ahbb,
  (nuevoCurso) => {
    if (nuevoCurso) precargarFormulario_ahbb(nuevoCurso);
  },
  { immediate: true, deep: false }
);


const enviarFormulario_ahbb = () => {
  if (formulario_ahbb.value.dias.length === 0) {
    return;
  }
  if (!formulario_ahbb.value.tienePrelacion) {
    formulario_ahbb.value.prelacionCursoId = null;
  }
  emit('guardar', { ...formulario_ahbb.value });
};
</script>

<template>
  <q-card flat bordered>
    <q-card-section>
      <q-form @submit.prevent="enviarFormulario_ahbb" class="q-gutter-y-md">
        <!-- Nombre y profesor -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="formulario_ahbb.nombre"
              label="Nombre del curso *"
              outlined
              dense
              :rules="[(v) => !!v || 'Requerido']"
            >
              <template v-slot:prepend><q-icon name="school" /></template>
            </q-input>
          </div>
          <!-- Admin: Select dinámico de profesores desde BD -->
          <div class="col-12 col-sm-6" v-if="props.esAdmin_ahbb">
            <q-select
              v-model="formulario_ahbb.profesorId"
              :options="props.profesores_ahbb"
              label="Profesor Asignado *"
              outlined
              dense
              emit-value
              map-options
              :rules="[(v) => !!v || 'Debe asignar un profesor']"
            >
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-select>
          </div>
          <!-- Profesor: campo informativo, se autoasigna -->
          <div class="col-12 col-sm-6" v-else>
            <q-input
              v-model="formulario_ahbb.profesor"
              label="Profesor"
              outlined
              dense
              disable
              :placeholder="!props.esEdicion_ahbb ? 'Te autoasignarás a este curso' : ''"
            >
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>
          </div>
        </div>

        <!-- Descripción -->
        <q-input
          v-model="formulario_ahbb.descripcion"
          label="Descripción *"
          type="textarea"
          outlined
          dense
          :rules="[(v) => !!v || 'Requerida']"
        />

        <!-- Fecha de inicio y Horas Lectivas -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="formulario_ahbb.fechaInicio"
              label="Fecha de inicio *"
              type="date"
              outlined
              dense
              :min="fechaMinimaInicio_ahbb"
              :max="fechaMaximaInicio_ahbb"
              :rules="reglaseFechaInicio_ahbb"
              hint="Mín. 3 días · Máx. 1 mes desde hoy"
            >
              <template v-slot:prepend><q-icon name="event" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model.number="formulario_ahbb.duracionHoras"
              label="Horas lectivas totales *"
              type="number"
              outlined
              dense
              min="1"
              :rules="[(v) => v > 0 || 'Mínimo 1 hora']"
            >
              <template v-slot:prepend><q-icon name="schedule" /></template>
              <template v-slot:hint>
                ≈ {{ semanasEstimadas_ahbb }} semanas · {{ sesionesTotales_ahbb }} clases en total
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model.number="formulario_ahbb.topeEstudiantes"
              label="Cupo máximo"
              type="number"
              outlined
              dense
              min="1"
              max="50"
            >
              <template v-slot:prepend><q-icon name="groups" /></template>
            </q-input>
          </div>
        </div>

        <!-- Días de clase -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Días de clase *</div>
          <q-option-group
            v-model="formulario_ahbb.dias"
            :options="diasDisponibles_ahbb"
            type="checkbox"
            inline
            color="secondary"
          />
          <div v-if="formulario_ahbb.dias.length === 0" class="text-negative text-caption">
            Debes seleccionar al menos un día de clase
          </div>
        </div>

        <!-- Horario -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="formulario_ahbb.horaInicio"
              label="Hora inicio de clase"
              type="time"
              outlined
              dense
            >
              <template v-slot:prepend><q-icon name="access_time" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="formulario_ahbb.horaFin"
              label="Hora fin de clase"
              type="time"
              outlined
              dense
            >
              <template v-slot:prepend><q-icon name="timer_off" /></template>
            </q-input>
          </div>
        </div>

        <!-- Resumen de carga estimada -->
        <q-banner rounded class="bg-blue-1 text-blue-9" v-if="formulario_ahbb.dias.length > 0 && formulario_ahbb.duracionHoras > 0">
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          <strong>Carga estimada:</strong>
          {{ horasPorSemana_ahbb.toFixed(1) }}h/semana ·
          {{ semanasEstimadas_ahbb }} semanas ·
          {{ sesionesTotales_ahbb }} sesiones totales
        </q-banner>

        <!-- Prelación -->
        <div>
          <q-toggle
            v-model="formulario_ahbb.tienePrelacion"
            label="Este curso tiene prelación"
            color="secondary"
          />
          <q-select
            v-if="formulario_ahbb.tienePrelacion"
            v-model="formulario_ahbb.prelacionCursoId"
            :options="opcionesPrelacion_ahbb"
            label="Curso de prelación"
            outlined
            dense
            emit-value
            map-options
            clearable
            class="q-mt-sm"
          />
        </div>

        <!-- Temario -->
        <q-input
          v-model="formulario_ahbb.temario"
          label="Temario del curso"
          type="textarea"
          outlined
          dense
          hint="Escribe el temario con numeración, un tema por línea."
          rows="4"
        />

        <!-- Mensaje de corrección (Profesor editando curso rechazado) -->
        <div v-if="requiereMensajeCorreccion_ahbb">
          <q-banner rounded class="bg-orange-1 text-orange-9 q-mb-sm">
            <template v-slot:avatar>
              <q-icon name="feedback" color="orange" />
            </template>
            Este curso fue <strong>rechazado</strong> por la administración. Al guardar los cambios, tu curso volverá al estado <strong>PENDIENTE DE APROBACIÓN</strong>. Describe brevemente qué correcciones realizaste para que el administrador lo pueda revisar.
          </q-banner>
          <q-input
            v-model="formulario_ahbb.mensajeCorreccion"
            label="¿Qué correcciones realizaste? *"
            type="textarea"
            outlined
            dense
            rows="3"
            :rules="[(v) => !!v?.trim() || 'Debes describir las correcciones realizadas']"
            hint="El administrador verá este mensaje al revisar el curso."
          >
            <template v-slot:prepend><q-icon name="edit_note" /></template>
          </q-input>
        </div>

        <!-- Resubmit info banner for professor (non-rejected edits) -->
        <q-banner
          v-else-if="esProfesor_ahbb && esEdicion_ahbb"
          rounded
          class="bg-blue-1 text-blue-9"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          Al guardar los cambios, el curso volverá a estado <strong>PENDIENTE DE APROBACIÓN</strong> hasta que la administración lo revise nuevamente.
        </q-banner>

        <!-- Acciones -->
        <q-separator />
        <div class="row justify-end q-gutter-sm">
          <q-btn
            label="Cancelar"
            outline
            color="grey-7"
            @click="emit('cancelar')"
          />
          <q-btn
            type="submit"
            :label="esEdicion_ahbb ? 'Guardar Cambios' : 'Crear Curso'"
            color="primary"
            unelevated
            icon="save"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>
