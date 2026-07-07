<!-- DetalleInscripcionesView_ahbb.vue — Estatus de alumnos (Aprobado/Reprobado) -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { obtenerInscripcionesPorCurso_ahbb, actualizarEstadoInscripcion_ahbb } from 'src/servicios/inscripcionesServicio_ahbb';
import { obtenerCursoPorId_ahbb } from 'src/servicios/cursosServicio_ahbb';
import {
  emitirCertificadosMasivo_ahbb,
  obtenerCertificadosCurso_ahbb,
  descargarPdfCertificado_ahbb,
} from 'src/servicios/certificadosServicio_ahbb';
import { useAutenticacionStore_ahbb } from 'src/stores/autenticacionStore_ahbb';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAutenticacionStore_ahbb();
const route = useRoute();
const router = useRouter();
const idCurso = route.params.id;

const cargando = ref(true);
const emitiendo = ref(false);
const curso = ref(null);
const inscripciones = ref([]);
const certificadosCurso = ref([]);
const filtroNombre = ref('');

const columnas = [
  { name: 'alumno', label: 'Estudiante', field: row => `${row.alumno.nombre_ahbb} ${row.alumno.apellido_ahbb}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: row => row.alumno.cedula_ahbb, align: 'left' },
  { name: 'correo', label: 'Correo', field: row => row.alumno.correo_ahbb, align: 'left' },
  { name: 'estado', label: 'Estatus (Switch)', field: 'estatus_ahbb', align: 'center' },
  { name: 'estadoLabel', label: 'Estado Actual', field: 'estatus_ahbb', align: 'center' },
  { name: 'certificado', label: 'Certificado', field: 'id_inscripcion_ahbb', align: 'center' },
];

const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [cursoData, insData] = await Promise.all([
      obtenerCursoPorId_ahbb(idCurso),
      obtenerInscripcionesPorCurso_ahbb(idCurso)
    ]);
    curso.value = cursoData;
    inscripciones.value = insData;

    // Cargar certificados del curso
    try {
      certificadosCurso.value = await obtenerCertificadosCurso_ahbb(idCurso);
    } catch {
      certificadosCurso.value = [];
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Error al cargar los datos del curso',
      icon: 'report_problem'
    });
  } finally {
    cargando.value = false;
  }
};

const cursoFinalizado = computed(() => {
  if (!curso.value) return false;
  return curso.value.estatus === 'inactivo';
});

const inscripcionesFiltradas = computed(() => {
  const mapaUnicos = new Map();
  const sorted = [...inscripciones.value].sort((a,b) => b.id_inscripcion_ahbb - a.id_inscripcion_ahbb);
  
  sorted.forEach(ins => {
    if (!mapaUnicos.has(ins.alumno.id_usuario_ahbb)) {
      mapaUnicos.set(ins.alumno.id_usuario_ahbb, ins);
    }
  });

  return Array.from(mapaUnicos.values()).filter(ins => {
    const nombreCompleto = `${ins.alumno.nombre_ahbb} ${ins.alumno.apellido_ahbb}`.toLowerCase();
    return nombreCompleto.includes(filtroNombre.value.toLowerCase()) || 
           ins.alumno.cedula_ahbb?.includes(filtroNombre.value);
  });
});

const aprobadosSinCertificado = computed(() => {
  return inscripcionesFiltradas.value.filter(
    ins => ins.estatus_ahbb === 'APROBADO' && !tieneCertificado(ins.id_inscripcion_ahbb)
  ).length;
});

const tieneCertificado = (idInscripcion) => {
  return certificadosCurso.value.some(c => c.inscripcionId === idInscripcion);
};

const obtenerCertificadoPorInscripcion = (idInscripcion) => {
  return certificadosCurso.value.find(c => c.inscripcionId === idInscripcion);
};

const mostrarModalEvaluacion = ref(false);
const noRecordarAdvertencia = ref(localStorage.getItem('no_recordar_evaluacion_ahbb') === 'true');
const omitirAdvertenciaTemp = ref(false);
const estudianteAEvaluar = ref(null);
const accionEvaluacion = ref('');

const intentarEvaluar = (row, accion) => {
  if (row.estatus_ahbb === 'APROBADO' || row.estatus_ahbb === 'REPROBADO') return;
  
  if (noRecordarAdvertencia.value) {
    ejecutarEvaluacion(row, accion);
  } else {
    estudianteAEvaluar.value = row;
    accionEvaluacion.value = accion;
    omitirAdvertenciaTemp.value = false;
    mostrarModalEvaluacion.value = true;
  }
};

const confirmarEvaluacionModal = () => {
  if (omitirAdvertenciaTemp.value) {
    localStorage.setItem('no_recordar_evaluacion_ahbb', 'true');
    noRecordarAdvertencia.value = true;
  }
  ejecutarEvaluacion(estudianteAEvaluar.value, accionEvaluacion.value);
  mostrarModalEvaluacion.value = false;
};

const ejecutarEvaluacion = async (row, nuevoEstado) => {
  const exito = await actualizarEstadoInscripcion_ahbb(row.id_inscripcion_ahbb, nuevoEstado);
  
  if (exito) {
    row.estatus_ahbb = nuevoEstado;
    $q.notify({
      color: nuevoEstado === 'APROBADO' ? 'positive' : 'negative',
      message: `${row.alumno.nombre_ahbb} ha sido ${nuevoEstado.toLowerCase()}`,
      timeout: 1500,
      icon: nuevoEstado === 'APROBADO' ? 'check_circle' : 'cancel'
    });
  } else {
    $q.notify({
      color: 'negative',
      message: 'Error al actualizar estatus',
      icon: 'error'
    });
    cargarDatos();
  }
};

const emitirCertificados = async () => {
  // Antes de redirigir, intentar recargar el perfil por si la firma ya existe en la DB
  if (!authStore.usuarioActivo_ahbb?.firmaDigital) {
    await authStore.recargarPerfil_ahbb();
  }

  // Validar si el profesor tiene firma digital antes de proceder
  if (!authStore.usuarioActivo_ahbb?.firmaDigital) {
    $q.notify({
      color: 'warning',
      message: 'Debes cargar tu firma digital antes de emitir certificados.',
      icon: 'edit_square',
      timeout: 4000,
      actions: [{ label: 'Ir a Firma', color: 'white', handler: () => router.push({ name: 'profesorFirmaDigital', query: { redirect: route.fullPath } }) }]
    });
    // Redirigir automáticamente después de un breve delay
    setTimeout(() => {
      router.push({ name: 'profesorFirmaDigital', query: { redirect: route.fullPath } });
    }, 2500);
    return;
  }

  emitiendo.value = true;
  try {
    const resultado = await emitirCertificadosMasivo_ahbb(idCurso);
    if (resultado.exito) {
      $q.notify({
        color: 'positive',
        message: resultado.mensaje,
        icon: 'workspace_premium',
        timeout: 3000,
      });
      certificadosCurso.value = await obtenerCertificadosCurso_ahbb(idCurso);
    } else {
      $q.notify({
        color: 'negative',
        message: resultado.mensaje,
        icon: 'error',
      });
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: 'Error al emitir certificados.',
      icon: 'error',
    });
  } finally {
    emitiendo.value = false;
  }
};

const descargarCertificadoPdf = async (idInscripcion) => {
  // Intentar recargar perfil antes de bloquear por falta de firma
  if (!authStore.usuarioActivo_ahbb?.firmaDigital) {
    await authStore.recargarPerfil_ahbb();
  }

  // Validar si el profesor tiene firma digital (por seguridad)
  if (!authStore.usuarioActivo_ahbb?.firmaDigital) {
    $q.notify({
      color: 'warning',
      message: 'Debes cargar tu firma digital para generar los PDFs.',
      icon: 'report_problem',
    });
    router.push({ name: 'profesorFirmaDigital', query: { redirect: route.fullPath } });
    return;
  }

  const cert = obtenerCertificadoPorInscripcion(idInscripcion);
  if (cert) {
    try {
      await descargarPdfCertificado_ahbb(cert.id);
    } catch {
      $q.notify({ color: 'negative', message: 'Error al descargar certificado.' });
    }
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="primary" @click="router.back()" class="q-mr-sm" />
      <div class="col" v-if="curso">
        <div class="text-h5 text-primary">
          <q-icon name="how_to_reg" class="q-mr-sm" />
          {{ curso.nombre }}
        </div>
        <div class="text-caption text-grey-7">Gestión de estatus finales</div>
      </div>
    </div>

    <!-- Alerta de estado del curso -->
    <q-banner v-if="!cursoFinalizado && !cargando" class="bg-blue-1 text-blue-9 shadow-1 q-mb-lg" rounded inline-actions>
      <template v-slot:avatar>
        <q-icon name="lock" color="blue-9" />
      </template>
      Este curso aún se encuentra en progreso (Termina: {{ new Date(curso.fechaFin).toLocaleDateString() }}). 
      No se puede asignar el estatus final hasta que el curso haya culminado.
    </q-banner>

    <q-banner v-else-if="cursoFinalizado && !cargando" class="bg-green-1 text-green-9 shadow-1 q-mb-lg" rounded inline-actions>
      <template v-slot:avatar>
        <q-icon name="check_circle" color="green-7" />
      </template>
      El curso ha finalizado. Puedes usar los botones para escoger <strong>Aprobar</strong> o <strong>Reprobar</strong> a los estudiantes. Recuerda que no podrás revertir esta acción de evaluación de cursante una vez se haya tomado la decisión.
      
      <template v-slot:action>
        <q-btn
          v-if="aprobadosSinCertificado > 0"
          label="Emitir Certificados"
          icon="workspace_premium"
          color="amber-8"
          text-color="white"
          :loading="emitiendo"
          @click="emitirCertificados"
          class="q-ml-md"
        >
          <q-tooltip>
            Emitir certificados para {{ aprobadosSinCertificado }} alumno(s) aprobado(s) pendientes
          </q-tooltip>
        </q-btn>
        <q-chip
          v-else-if="certificadosCurso.length > 0"
          color="green"
          text-color="white"
          icon="verified"
          class="q-ml-md"
        >
          Todos los certificados emitidos
        </q-chip>
      </template>
    </q-banner>

    <q-card flat bordered class="q-pa-md q-mb-md shadow-1">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6">
          <q-input v-model="filtroNombre" dense outlined placeholder="Filtrar por estudiante..." clearable>
            <template v-slot:prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 text-right">
          <div class="text-subtitle2 text-grey-8">Total Alumnos: {{ inscripciones.length }}</div>
        </div>
      </div>
    </q-card>

    <q-table
      :rows="inscripcionesFiltradas"
      :columns="columnas"
      row-key="id_inscripcion_ahbb"
      :loading="cargando"
      flat
      bordered
      no-data-label="No hay estudiantes inscritos en este curso"
      rows-per-page-label="Registros por página"
    >
      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <template v-if="props.row.estatus_ahbb === 'INSCRITO' || props.row.estatus_ahbb === 'OYENTE'">
            <q-btn-group rounded outline>
              <q-btn 
                size="sm" 
                color="green" 
                :disable="!cursoFinalizado" 
                icon="check" 
                label="Aprobar" 
                @click="intentarEvaluar(props.row, 'APROBADO')" 
              />
              <q-btn 
                size="sm" 
                color="red" 
                :disable="!cursoFinalizado" 
                icon="close" 
                label="Reprobar" 
                @click="intentarEvaluar(props.row, 'REPROBADO')" 
              />
            </q-btn-group>
            <q-tooltip v-if="!cursoFinalizado">Solo disponible al culminar el curso</q-tooltip>
          </template>
          <template v-else>
            <q-btn flat dense icon="lock" color="grey" disable>
              <q-tooltip>Evaluación ya asignada de forma irreversible</q-tooltip>
            </q-btn>
          </template>
        </q-td>
      </template>

      <template v-slot:body-cell-estadoLabel="props">
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

      <template v-slot:body-cell-certificado="props">
        <q-td :props="props">
          <template v-if="tieneCertificado(props.row.id_inscripcion_ahbb)">
            <q-btn
              flat
              dense
              round
              icon="picture_as_pdf"
              color="red"
              @click="descargarCertificadoPdf(props.row.id_inscripcion_ahbb)"
            >
              <q-tooltip>Descargar PDF del certificado</q-tooltip>
            </q-btn>
            <q-icon name="verified" color="green" size="xs" class="q-ml-xs">
              <q-tooltip>Certificado emitido</q-tooltip>
            </q-icon>
          </template>
          <template v-else-if="props.row.estatus_ahbb === 'APROBADO'">
            <q-chip dense color="amber-1" text-color="amber-9" icon="pending">
              Pendiente
            </q-chip>
          </template>
          <template v-else>
            <span class="text-grey-4">—</span>
          </template>
        </q-td>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>
  </div>

  <!-- Modal Confirmación de Evaluación -->
  <q-dialog v-model="mostrarModalEvaluacion" persistent>
    <q-card style="min-width: 380px; border-radius: 12px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-primary row items-center">
          <q-icon name="warning_amber" size="md" color="orange" class="q-mr-sm" /> 
          Confirmar Evaluación
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md text-subtitle1">
        Estás a punto de evaluar permanentemente a <strong>{{ estudianteAEvaluar?.alumno?.nombre_ahbb }} {{ estudianteAEvaluar?.alumno?.apellido_ahbb }}</strong> como <strong :class="accionEvaluacion === 'APROBADO' ? 'text-green-8' : 'text-red-8'">{{ accionEvaluacion }}</strong>.
        <br><br>
        <span class="text-body2 text-grey-8">Esta acción es para proteger la emisión de certificados. De aprobar o reprobar a un alumno, el estatus se <strong>bloqueará permanentemente</strong> y no podrá revertirse haciendo clics por accidente. ¿Deseas continuar?</span>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-checkbox v-model="omitirAdvertenciaTemp" label="No volver a avisarme en este navegador" color="primary" />
      </q-card-section>

      <q-card-actions align="right" class="bg-grey-1 q-pa-md">
        <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
        <q-btn unelevated :color="accionEvaluacion === 'APROBADO' ? 'green' : 'red'" label="Sí, Confirmar" @click="confirmarEvaluacionModal" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<style scoped>
.shadow-1 {
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
</style>
