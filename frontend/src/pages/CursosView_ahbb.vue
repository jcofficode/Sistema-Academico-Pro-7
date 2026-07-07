<!--
  CursosView_ahbb.vue — Vista del listado de cursos con:
  - Modal de confirmación para eliminar.
  - Modal de rechazo con formulario de motivo para Admin.
  - Modal de motivo de rechazo para Profesor (lectura).
  - Aprobación directa sin modal.
  - Polling automático cada 45 segundos.
-->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useCursosStore_ahbb } from '../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import TablaCursos_ahbb from '../components/cursos/TablaCursos_ahbb.vue';
import FiltroCursos_ahbb from '../components/cursos/FiltroCursos_ahbb.vue';
import ModalConfirmar_ahbb from '../components/cursos/ModalConfirmar_ahbb.vue';
import { useAutoRefresh_ahbb } from '../composables/useAutoRefresh_ahbb';

const $q_ahbb = useQuasar();
const router_ahbb = useRouter();
const cursosStore_ahbb = useCursosStore_ahbb();
const authStore_ahbb = useAutenticacionStore_ahbb();

// ── Eliminar ──────────────────────────────────────────────────────────────────
const mostrarModalEliminar_ahbb = ref(false);
const cursoAEliminar_ahbb = ref(null);

const confirmarEliminacion_ahbb = (curso_ahbb) => {
  cursoAEliminar_ahbb.value = curso_ahbb;
  mostrarModalEliminar_ahbb.value = true;
};

const ejecutarEliminacion_ahbb = async () => {
  if (cursoAEliminar_ahbb.value) {
    const res = await cursosStore_ahbb.eliminarCurso_ahbb(cursoAEliminar_ahbb.value.id);
    mostrarModalEliminar_ahbb.value = false;
    cursoAEliminar_ahbb.value = null;
    if (res?.exito) {
      $q_ahbb.notify({
        type: res.softDeleted ? 'warning' : 'positive',
        message: res.mensaje || 'Curso eliminado.',
        icon: res.softDeleted ? 'archive' : 'check_circle',
      });
    } else {
      $q_ahbb.notify({ type: 'negative', message: res?.mensaje || 'Error al eliminar el curso.' });
    }
  }
};

const cancelarEliminacion_ahbb = () => {
  mostrarModalEliminar_ahbb.value = false;
  cursoAEliminar_ahbb.value = null;
};

// ── Aprobar (Admin) ───────────────────────────────────────────────────────────
const aprobarCurso_ahbb = async (curso_ahbb) => {
  const res = await cursosStore_ahbb.evaluarCurso_ahbb(curso_ahbb.id, 'ACTIVO');
  if (res?.exito) {
    $q_ahbb.notify({ type: 'positive', message: `¡Curso "${curso_ahbb.nombre}" aprobado y publicado!`, icon: 'check_circle' });
  } else {
    $q_ahbb.notify({ type: 'negative', message: res?.mensaje || 'Error al aprobar el curso.' });
  }
};

// ── Rechazar (Admin) ──────────────────────────────────────────────────────────
const mostrarModalRechazo_ahbb = ref(false);
const cursoARechazar_ahbb = ref(null);
const motivoRechazo_ahbb = ref('');

const iniciarRechazo_ahbb = (curso_ahbb) => {
  cursoARechazar_ahbb.value = curso_ahbb;
  motivoRechazo_ahbb.value = '';
  mostrarModalRechazo_ahbb.value = true;
};

const ejecutarRechazo_ahbb = async () => {
  if (!motivoRechazo_ahbb.value.trim()) {
    $q_ahbb.notify({ type: 'warning', message: 'Debes indicar el motivo del rechazo.' });
    return;
  }
  const res = await cursosStore_ahbb.evaluarCurso_ahbb(
    cursoARechazar_ahbb.value.id,
    'RECHAZADO',
    motivoRechazo_ahbb.value.trim()
  );
  mostrarModalRechazo_ahbb.value = false;
  if (res?.exito) {
    $q_ahbb.notify({ type: 'info', message: `Curso "${cursoARechazar_ahbb.value.nombre}" rechazado. El profesor fue notificado.`, icon: 'feedback' });
  } else {
    $q_ahbb.notify({ type: 'negative', message: res?.mensaje || 'Error al rechazar el curso.' });
  }
  cursoARechazar_ahbb.value = null;
};

// ── Editar con validación de alumnos inscritos ────────────────────────────────
const mostrarDialogoInscritosBlockeo_ahbb = ref(false);

const manejarEditar_ahbb = (curso_ahbb) => {
  if ((curso_ahbb.estudiantesInscritos ?? 0) > 0) {
    mostrarDialogoInscritosBlockeo_ahbb.value = true;
  } else {
    void router_ahbb.push({ path: `/cursos/editar/${curso_ahbb.id}` });
  }
};

// ── Ver motivo de rechazo (Profesor) ─────────────────────────────────────────
const mostrarMotivoProfesor_ahbb = ref(false);
const cursoRechazadoActual_ahbb = ref(null);

const verMotivo_ahbb = (curso_ahbb) => {
  cursoRechazadoActual_ahbb.value = curso_ahbb;
  mostrarMotivoProfesor_ahbb.value = true;
};

// ── Inicialización + Reactividad ─────────────────────────────────────────────
const cargarCursos_ahbb = async () => {
  if (authStore_ahbb.esProfesor_ahbb) {
    await cursosStore_ahbb.recargarCursos_ahbb({ solo_propios: true });
  } else {
    await cursosStore_ahbb.recargarCursos_ahbb();
  }
};

// Polling cada 45s: detecta nuevos cursos pendientes/aprobados automáticamente
useAutoRefresh_ahbb(cargarCursos_ahbb, 45_000, false);

// Refrescar al volver a la pestaña
const onVisible_ahbb = () => {
  if (document.visibilityState === 'visible') void cargarCursos_ahbb();
};
onMounted(async () => {
  await cargarCursos_ahbb();
  document.addEventListener('visibilitychange', onVisible_ahbb);
});
onUnmounted(() => document.removeEventListener('visibilitychange', onVisible_ahbb));
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">Gestión de Cursos</div>
      <q-btn
        v-if="!authStore_ahbb.esAlumno_ahbb"
        label="Nuevo Curso"
        icon="add"
        color="primary"
        unelevated
        to="/cursos/nuevo"
      />
    </div>

    <!-- Filtros -->
    <FiltroCursos_ahbb />

    <!-- Tabla -->
    <TablaCursos_ahbb
      @eliminar="confirmarEliminacion_ahbb"
      @aprobar="aprobarCurso_ahbb"
      @rechazar="iniciarRechazo_ahbb"
      @verMotivo="verMotivo_ahbb"
      @editar="manejarEditar_ahbb"
    />

    <!-- Modal: Confirmar eliminación -->
    <ModalConfirmar_ahbb
      v-if="mostrarModalEliminar_ahbb"
      titulo_ahbb="Eliminar Curso"
      :mensaje_ahbb="`¿Estás seguro de eliminar '${cursoAEliminar_ahbb?.nombre}'? Si tiene alumnos inscritos se archivará en lugar de eliminarse.`"
      @confirmar="ejecutarEliminacion_ahbb"
      @cancelar="cancelarEliminacion_ahbb"
    />

    <!-- Modal: Rechazar curso (Admin) -->
    <q-dialog v-model="mostrarModalRechazo_ahbb" persistent>
      <q-card style="min-width: 420px">
        <q-card-section class="bg-negative text-white row items-center">
          <q-icon name="cancel" size="24px" class="q-mr-sm" />
          <div class="text-h6">Rechazar Curso</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body1 q-mb-md">
            Estás por rechazar el curso <strong>{{ cursoARechazar_ahbb?.nombre }}</strong>.
            El profesor recibirá el motivo que escribas.
          </p>
          <q-input
            v-model="motivoRechazo_ahbb"
            label="Motivo del rechazo *"
            type="textarea"
            outlined
            autofocus
            rows="4"
            :rules="[(v) => !!v?.trim() || 'El motivo es obligatorio']"
            hint="Sé específico para que el profesor pueda corregir el curso."
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-gutter-sm">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            label="Confirmar Rechazo"
            color="negative"
            unelevated
            icon="cancel"
            @click="ejecutarRechazo_ahbb"
            :disable="!motivoRechazo_ahbb.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal: Ver motivo (Profesor) -->
    <q-dialog v-model="mostrarMotivoProfesor_ahbb">
      <q-card style="min-width: 380px">
        <q-card-section class="bg-warning text-white row items-center">
          <q-icon name="feedback" size="24px" class="q-mr-sm" />
          <div class="text-h6">Feedback del Administrador</div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div class="text-subtitle2 text-grey-6 q-mb-xs">Curso: <strong>{{ cursoRechazadoActual_ahbb?.nombre }}</strong></div>
          <q-separator class="q-mb-md" />
          <p class="text-body1">
            {{ cursoRechazadoActual_ahbb?.motivoRechazo || 'Sin motivo especificado. Puedes contactar a la administración.' }}
          </p>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
          <q-btn
            label="Editar y reenviar"
            color="primary"
            unelevated
            icon="edit"
            @click="() => { mostrarMotivoProfesor_ahbb = false; void router_ahbb.push(`/cursos/editar/${cursoRechazadoActual_ahbb?.id}`); }"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal: Bloqueo edición con alumnos inscritos -->
    <q-dialog v-model="mostrarDialogoInscritosBlockeo_ahbb">
      <q-card style="min-width: 380px">
        <q-card-section class="bg-orange text-white row items-center">
          <q-icon name="warning" size="24px" class="q-mr-sm" />
          <div class="text-h6">No se puede editar</div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <p class="text-body1">
            Este curso <strong>no puede ser editado</strong> porque ya tiene alumnos inscritos.
          </p>
          <p class="text-body2 text-grey-7">
            Para realizar modificaciones, primero debes retirar o gestionar las inscripciones activas, o eliminar el curso y crear uno nuevo.
          </p>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Entendido" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
