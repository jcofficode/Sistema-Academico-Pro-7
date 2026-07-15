<!--
  MisMateriasCarreraView_cjgp.vue — Materias inscritas de la CARRERA (Alumno).

  Muestra las inscripciones del período académico ACTIVO con toda la
  información de contexto (alumno, carrera, materia, bloque, créditos) y
  permite retirar materias que sigan en curso. Es la contraparte "de carrera"
  de la página "Mis Inscripciones" de cursos extracurriculares.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerHistorialMaterias_cjgp,
  obtenerPeriodoActivo_cjgp,
  retirarMateria_cjgp,
} from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const autenticacion_cjgp = useAutenticacionStore_ahbb();

const periodoActivo_cjgp = ref(null);
const inscripciones_cjgp = ref([]);
const cargando_cjgp = ref(true);

// Solo las inscripciones del período activo (lo vigente para el alumno)
const inscripcionesPeriodo_cjgp = computed(() =>
  inscripciones_cjgp.value.filter(
    (inscripcion_cjgp) =>
      inscripcion_cjgp.id_periodo_im_cjgp === periodoActivo_cjgp.value?.id_periodo_cjgp &&
      inscripcion_cjgp.estatus_cjgp !== 'RETIRADO',
  ),
);

const creditosInscritos_cjgp = computed(() =>
  inscripcionesPeriodo_cjgp.value
    .filter((inscripcion_cjgp) => inscripcion_cjgp.estatus_cjgp === 'INSCRITO')
    .reduce(
      (total_cjgp, inscripcion_cjgp) =>
        total_cjgp + inscripcion_cjgp.materia_cjgp.creditos_cjgp,
      0,
    ),
);

const COLOR_ESTATUS_CJGP = {
  INSCRITO: { color: 'blue-1', texto: 'blue-9', icono: 'pending' },
  APROBADO: { color: 'green-1', texto: 'green-9', icono: 'verified' },
  REPROBADO: { color: 'red-1', texto: 'red-9', icono: 'cancel' },
};

const cargar_cjgp = async () => {
  cargando_cjgp.value = true;
  try {
    [periodoActivo_cjgp.value, inscripciones_cjgp.value] = await Promise.all([
      obtenerPeriodoActivo_cjgp(),
      obtenerHistorialMaterias_cjgp(),
    ]);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar tus materias.' });
  } finally {
    cargando_cjgp.value = false;
  }
};

const confirmarRetiro_cjgp = (inscripcion_cjgp) => {
  $q.dialog({
    title: 'Retirar materia',
    message: `¿Seguro que deseas retirar "${inscripcion_cjgp.materia_cjgp.nombre_cjgp}" (${inscripcion_cjgp.materia_cjgp.creditos_cjgp} créditos)? Podrás volver a inscribirla en un próximo período.`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Retirar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    const resultado_cjgp = await retirarMateria_cjgp(
      inscripcion_cjgp.id_inscripcion_materia_cjgp,
    );
    $q.notify({
      type: resultado_cjgp.exito ? 'positive' : 'negative',
      message: resultado_cjgp.mensaje,
    });
    if (resultado_cjgp.exito) cargar_cjgp();
  });
};

onMounted(cargar_cjgp);
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Mis Materias — Carrera</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Materias de carrera inscritas en el período vigente (no incluye cursos extracurriculares)
    </div>

    <!-- Contexto completo: quién es el alumno y en qué período está -->
    <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" icon="person" />
        </div>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            {{ autenticacion_cjgp.nombreCompleto_ahbb }}
          </div>
          <div class="text-caption text-grey-8">
            Cédula: {{ autenticacion_cjgp.usuarioActivo_ahbb?.cedula ?? '—' }} ·
            Rol: Alumno ·
            Período activo:
            <strong>{{ periodoActivo_cjgp?.nombre_cjgp ?? 'sin período activo' }}</strong>
          </div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h5 text-primary">{{ creditosInscritos_cjgp }}</div>
          <div class="text-caption">créditos en curso</div>
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_cjgp" />

    <div v-if="!cargando_cjgp && inscripcionesPeriodo_cjgp.length" class="row q-col-gutter-md">
      <div
        v-for="inscripcion_cjgp in inscripcionesPeriodo_cjgp"
        :key="inscripcion_cjgp.id_inscripcion_materia_cjgp"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-subtitle2 text-weight-bold">
                  {{ inscripcion_cjgp.materia_cjgp.codigo_cjgp }} —
                  {{ inscripcion_cjgp.materia_cjgp.nombre_cjgp }}
                </div>
                <div class="text-caption text-grey-7">
                  Carrera: {{ inscripcion_cjgp.materia_cjgp.carrera_cjgp.nombre_cjgp }}
                </div>
              </div>
              <q-chip
                dense
                :color="COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.color"
                :text-color="COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.texto"
                :icon="COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.icono"
              >
                {{ inscripcion_cjgp.estatus_cjgp }}
              </q-chip>
            </div>

            <q-separator class="q-my-sm" />

            <div class="text-caption">
              <div>
                📚 Bloque:
                {{ inscripcion_cjgp.materia_cjgp.carrera_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
                {{ inscripcion_cjgp.materia_cjgp.nroBloque_cjgp }}
                · 🎯 {{ inscripcion_cjgp.materia_cjgp.creditos_cjgp }} créditos
              </div>
              <div>
                👨‍🏫
                {{
                  inscripcion_cjgp.materia_cjgp.profesor_cjgp
                    ? `Prof. ${inscripcion_cjgp.materia_cjgp.profesor_cjgp.nombre_ahbb} ${inscripcion_cjgp.materia_cjgp.profesor_cjgp.apellido_ahbb}`
                    : 'Profesor por asignar'
                }}
              </div>
              <div>🗓 Período: {{ inscripcion_cjgp.periodo_cjgp.nombre_cjgp }}</div>
              <div v-if="inscripcion_cjgp.notaFinal_cjgp !== null">
                🏁 Nota final: <strong>{{ Number(inscripcion_cjgp.notaFinal_cjgp) }}</strong>
              </div>
            </div>
          </q-card-section>

          <q-card-actions v-if="inscripcion_cjgp.estatus_cjgp === 'INSCRITO'" align="right">
            <q-btn
              flat
              dense
              color="negative"
              icon="logout"
              label="Retirar"
              @click="confirmarRetiro_cjgp(inscripcion_cjgp)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-else-if="!cargando_cjgp" class="text-center text-grey-6 q-pa-xl">
      No tienes materias inscritas en el período activo.<br />
      Ve a <strong>Inscripción de Materias</strong> para seleccionar las de este período.
    </div>
  </q-page>
</template>
