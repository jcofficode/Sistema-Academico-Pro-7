<!--
  CursoFormView_ahbb.vue — Vista crear/editar con:
  - Precarga desde API cuando hay :id en la ruta.
  - Modal informativo para profesores al crear (curso queda PENDIENTE de aprobación).
  - Select dinámico de profesores desde BD (solo para Admin).
-->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCursosStore_ahbb } from '../stores/cursosStore_ahbb';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import { obtenerProfesoresParaSelect_ahbb } from '../servicios/usuariosServicio_ahbb';
import { obtenerCursoPorId_ahbb } from '../servicios/cursosServicio_ahbb';
import FormularioCurso_ahbb from '../components/cursos/FormularioCurso_ahbb.vue';
import DialogoSolapamiento_ahbb from '../components/cursos/DialogoSolapamiento_ahbb.vue';

const $q_ahbb = useQuasar();
const route_ahbb = useRoute();
const router_ahbb = useRouter();
const cursosStore_ahbb = useCursosStore_ahbb();
const authStore_ahbb = useAutenticacionStore_ahbb();

const esEdicion_ahbb = ref(false);
const cursoActual_ahbb = ref(null);
const profeslista_ahbb = ref([]);
const cargando_ahbb = ref(false);
const isAdmin_ahbb = computed(() => authStore_ahbb.esAdmin_ahbb);
const isProfesor_ahbb = computed(() => authStore_ahbb.esProfesor_ahbb);

onMounted(async () => {
  // Cargar profesores para el select (solo Admin)
  if (isAdmin_ahbb.value) {
    try {
      const listado = await obtenerProfesoresParaSelect_ahbb();
      profeslista_ahbb.value = (listado || []).map(p => ({
        label: p ? `${p.nombre || '??'} ${p.apellido || ''} (${p.id || '?'})` : 'Cargando...',
        value: p?.id
      }));
    } catch (e) {
      console.error('No se pudo cargar la lista de profesores', e);
    }
  }

  // Si es Profesor creando un curso nuevo, precargar su propio ID
  // para que el select de prelación filtre sus cursos desde el inicio
  if (isProfesor_ahbb.value && !route_ahbb.params['id']) {
    cursoActual_ahbb.value = {
      profesorId: authStore_ahbb.usuarioActivo_ahbb?.id ?? null
    };
  }

  // Precarga del curso si estamos editando
  const id_ahbb = route_ahbb.params['id'];
  if (id_ahbb) {
    esEdicion_ahbb.value = true;
    cargando_ahbb.value = true;
    try {
      // Primero intentamos desde el store (datos ya cargados)
      let curso_ahbb = cursosStore_ahbb.obtenerCursoPorId_ahbb(id_ahbb);
      // Si no está en cache, pedimos directo a la API
      if (!curso_ahbb) {
        curso_ahbb = await obtenerCursoPorId_ahbb(id_ahbb);
      }
      if (curso_ahbb) {
        // Block editing if students are already enrolled
        if (curso_ahbb.estudiantesInscritos > 0) {
          $q_ahbb.notify({ 
            type: 'warning', 
            message: 'No puedes editar un curso que ya tiene alumnos inscritos.',
            icon: 'warning'
          });
          void router_ahbb.push({ name: 'cursos' });
          return;
        }
        cursoActual_ahbb.value = { ...curso_ahbb };
      } else {
        $q_ahbb.notify({ type: 'negative', message: 'Curso no encontrado.' });
        void router_ahbb.push({ name: 'cursos' });
      }
    } finally {
      cargando_ahbb.value = false;
    }
  }
});

const manejarGuardar_ahbb = async (datos_ahbb) => {
  cargando_ahbb.value = true;
  try {
    if (esEdicion_ahbb.value && cursoActual_ahbb.value) {
      const exito = await cursosStore_ahbb.actualizarCurso_ahbb(cursoActual_ahbb.value.id, datos_ahbb);
      if (exito) {
        $q_ahbb.notify({ type: 'positive', message: '¡Curso actualizado correctamente!' });
        void router_ahbb.push({ name: 'cursos' });
      } else {
        $q_ahbb.notify({ type: 'negative', message: 'Error al actualizar el curso.' });
      }
    } else {
      const nuevoCurso = await cursosStore_ahbb.crearCurso_ahbb(datos_ahbb);
      if (nuevoCurso) {
        // Modal especial para profesores: el curso queda PENDIENTE
        if (isProfesor_ahbb.value) {
          $q_ahbb.dialog({
            title: '¡Curso registrado con éxito!',
            message:
              'Tu curso ha sido enviado para revisión. La administración lo revisará y recibirás una ' +
              'notificación en tu lista de cursos cuando sea aprobado o si requiere ajustes.',
            ok: { label: 'Entendido', color: 'primary', unelevated: true },
            persistent: true,
            html: false,
          }).onOk(() => {
            void router_ahbb.push({ name: 'cursos' });
          });
        } else {
          $q_ahbb.notify({ type: 'positive', message: '¡Curso creado y publicado correctamente!' });
          void router_ahbb.push({ name: 'cursos' });
        }
      }
    }
  } catch (error) {
    // Manejo de solapamiento de horario (Silencioso para la consola)
    if (error.response?.data?.message === 'SOLAPAMIENTO_DETECTADO') {
      const { solapamientos, huecosDisponibles } = error.response.data.payload;
      $q_ahbb.dialog({
        component: DialogoSolapamiento_ahbb,
        componentProps: {
          solapamientos,
          huecosDisponibles
        }
      });
      return;
    }

    console.error('Error al guardar el curso:', error);
    const mensaje_ahbb = error.response?.data?.message || 'Ocurrió un error al intentar guardar el curso.';
    $q_ahbb.notify({
      type: 'negative',
      message: Array.isArray(mensaje_ahbb) ? mensaje_ahbb[0] : mensaje_ahbb,
      icon: 'report_problem'
    });
  } finally {
    cargando_ahbb.value = false;
  }
};

const manejarCancelar_ahbb = () => {
  void router_ahbb.push({ name: 'cursos' });
};
</script>

<template>
  <div>
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        {{ esEdicion_ahbb ? 'Editar Curso' : 'Nuevo Curso' }}
      </div>
      <q-btn label="Volver a Cursos" icon="arrow_back" unelevated color="primary" text-color="white" @click="manejarCancelar_ahbb" />
    </div>

    <div v-if="cargando_ahbb" class="column items-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
      <div class="text-grey-6 q-mt-md">Cargando datos del curso...</div>
    </div>

    <FormularioCurso_ahbb
      v-else
      :curso-inicial_ahbb="cursoActual_ahbb"
      :es-edicion_ahbb="esEdicion_ahbb"
      :es-admin_ahbb="isAdmin_ahbb"
      :profesores_ahbb="profeslista_ahbb"
      @guardar="manejarGuardar_ahbb"
      @cancelar="manejarCancelar_ahbb"
    />
  </div>
</template>
