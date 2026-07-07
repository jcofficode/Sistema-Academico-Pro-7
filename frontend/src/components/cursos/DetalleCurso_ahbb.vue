<!--
  DetalleCurso_ahbb.vue — Componente 3: Detalle con Quasar
-->
<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { ROLES_AHBB } from '../../constantes/roles_ahbb';
import FormularioInscripcionCurso_ahbb from './FormularioInscripcionCurso_ahbb.vue';

const props = defineProps({
  curso_ahbb: { required: true },
  origen_ahbb: { type: Object, default: () => ({ label: 'Volver', route: '/cursos' }) }
});

const router_ahbb = useRouter();
const $q_ahbb = useQuasar();
const cursosStore_ahbb = useCursosStore_ahbb();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();

/**
 * Intenta navegar al formulario de edición.
 * Bloquea si el curso ya tiene alumnos inscritos para proteger la integridad de datos.
 */
const intentarEditar_ahbb = () => {
  if ((props.curso_ahbb.estudiantesInscritos ?? 0) > 0) {
    $q_ahbb.notify({
      type: 'warning',
      icon: 'warning',
      message: 'Este curso no puede editarse porque ya tiene alumnos inscritos.',
      caption: 'Para modificarlo, gestione primero las inscripciones activas.',
      position: 'top',
      timeout: 5000,
    });
  } else {
    void router_ahbb.push(`/cursos/editar/${props.curso_ahbb.id}`);
  }
};

const diasFormateados_ahbb = computed(() => {
  if (!props.curso_ahbb.dias || props.curso_ahbb.dias.length === 0)
    return 'No definidos';
  return props.curso_ahbb.dias
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(', ');
});

const nombrePrelacion_ahbb = computed(() => {
  if (!props.curso_ahbb.tienePrelacion || !props.curso_ahbb.prelacionCursoId)
    return 'Ninguna';
  const p = cursosStore_ahbb.obtenerCursoPorId_ahbb(
    props.curso_ahbb.prelacionCursoId
  );
  return p ? p.nombre : 'Curso no encontrado';
});

const colorEstatus_ahbb = computed(() => {
  const m = {
    activo: 'positive',
    iniciado: 'blue',
    pendiente: 'warning',
    rechazado: 'negative',
    archivado: 'grey-8'
  };
  return m[props.curso_ahbb.estatus] || 'grey';
});

const iconEstatus_ahbb = computed(() => {
  const m = {
    activo: 'check_circle',
    iniciado: 'play_circle',
    pendiente: 'hourglass_top',
    rechazado: 'cancel',
    archivado: 'archive',
  };
  return m[props.curso_ahbb.estatus] || 'help';
});

const solicitarRepublicar_ahbb = () => {
  $q_ahbb.dialog({
    title: 'Republicar Curso',
    message: 'Este curso no tuvo inscritos a tiempo. ¿Deseas enviarlo nuevamente a revisión para establecer una nueva fecha?',
    cancel: true,
    persistent: true,
    ok: { label: 'Sí, Republicar', color: 'primary', unelevated: true }
  }).onOk(async () => {
    const res = await cursosStore_ahbb.republicarCurso_ahbb(props.curso_ahbb.id);
    if (res.exito) {
      $q_ahbb.notify({ type: 'positive', message: 'Solicitud enviada. El curso pasó a estado PENDIENTE.' });
      router_ahbb.push('/cursos');
    }
  });
};

const mostrarBotonRepublicar_ahbb = computed(() => {
  const hoy_ahbb = new Date();
  const inicio_ahbb = props.curso_ahbb.fechaInicio ? new Date(props.curso_ahbb.fechaInicio) : null;
  return esPersonalAcademico_ahbb.value && 
         (props.curso_ahbb.estudiantesInscritos === 0) &&
         inicio_ahbb && inicio_ahbb <= hoy_ahbb &&
         ['activo', 'iniciado'].includes(props.curso_ahbb.estatus);
});

const formatearFecha_ahbb = (fecha) => {
  if (!fecha) return 'Por definir';
  
  let d;
  if (typeof fecha === 'string') {
    const fechaLimpia = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    d = new Date(fechaLimpia + 'T12:00:00');
  } else {
    d = new Date(fecha);
  }
    
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatearHora12h_ahbb = (horaStr) => {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':').map(Number);
  const ampm = (horas ?? 0) >= 12 ? 'PM' : 'AM';
  const horas12 = (horas ?? 0) % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${String(minutos ?? 0).padStart(2, '0')} ${ampm}`;
};

const esPersonalAcademico_ahbb = computed(
  () => ['ADMIN', 'PROFESOR'].includes(autenticacionStore_ahbb.usuarioActivo_ahbb?.rol)
);

const puedeInscribirse_ahbb = computed(
  () => autenticacionStore_ahbb.usuarioActivo_ahbb?.rol === ROLES_AHBB.ALUMNO && props.curso_ahbb.estatus === 'activo'
);
</script>

<template>
  <q-card flat bordered>
    <!-- Header -->
    <q-card-section class="bg-primary text-white">
      <div class="text-h5 text-weight-bold">{{ curso_ahbb.nombre }}</div>
      <div class="text-caption" style="opacity: 0.8">
        Impartido por {{ curso_ahbb.profesor }}
      </div>
    </q-card-section>

    <q-card-section>
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Estatus</div>
          <q-chip 
            :color="colorEstatus_ahbb" 
            text-color="white"
            dense
            inner-class="text-weight-bold"
            class="text-weight-bold text-uppercase q-px-md"
            style="font-size: 0.75rem; border-radius: 12px;"
          >
            <q-icon :name="iconEstatus_ahbb" size="14px" class="q-mr-xs" />
            {{ curso_ahbb.estatus }}
          </q-chip>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Duracion</div>
          <div>{{ curso_ahbb.duracionHoras }} horas ({{ curso_ahbb.cantidadDias }} dias)</div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Estudiantes</div>
          <div>{{ curso_ahbb.estudiantesInscritos }} / {{ curso_ahbb.topeEstudiantes }}</div>
        </div>
        <div class="col-12 col-sm-4" v-if="curso_ahbb.fechaInicio">
          <div class="text-overline text-grey-7">Fecha de Inicio</div>
          <div class="text-weight-bold text-primary">
            <q-icon name="today" class="q-mr-xs" />
            {{ formatearFecha_ahbb(curso_ahbb.fechaInicio) }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Dias de clase</div>
          <div>{{ diasFormateados_ahbb }}</div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Horario</div>
          <div class="text-weight-bold">
            {{ formatearHora12h_ahbb(curso_ahbb.horaInicio) }} - {{ formatearHora12h_ahbb(curso_ahbb.horaFin) }}
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="text-overline text-grey-7">Prelacion</div>
          <div>{{ nombrePrelacion_ahbb }}</div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-overline text-grey-7">Descripcion</div>
      <div>{{ curso_ahbb.descripcion }}</div>
    </q-card-section>

    <q-card-section v-if="curso_ahbb.temario">
      <div class="text-overline text-grey-7">Temario</div>
      <div style="white-space: pre-line">{{ curso_ahbb.temario }}</div>
    </q-card-section>

    <q-separator />

    <q-card-actions v-if="esPersonalAcademico_ahbb" align="right" class="q-gutter-sm">
      <q-btn
        v-if="mostrarBotonRepublicar_ahbb"
        label="Republicar Curso"
        icon="refresh"
        color="orange"
        unelevated
        @click="solicitarRepublicar_ahbb"
      >
        <q-tooltip>El curso no tuvo alumnos, click para relanzar</q-tooltip>
      </q-btn>

      <q-btn
        label="Editar Curso"
        icon="edit"
        color="primary"
        unelevated
        @click="intentarEditar_ahbb"
      />
    </q-card-actions>

    <q-card-section v-if="puedeInscribirse_ahbb" class="q-pt-none">
      <FormularioInscripcionCurso_ahbb :curso_ahbb="curso_ahbb" />
    </q-card-section>
  </q-card>
</template>
