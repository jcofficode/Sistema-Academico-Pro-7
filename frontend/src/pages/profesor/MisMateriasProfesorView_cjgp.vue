<!--
  MisMateriasProfesorView_cjgp.vue — Materias asignadas al docente.

  El profesor ve las materias de carrera que el administrador le asignó,
  con su carrera, bloque, créditos y cuántos alumnos las cursan en el
  período activo, y salta directo a la carga de notas de cada una.
  La asignación vive en la BD: si el admin lo cambia de materia, esta
  vista (y su Carga de Notas) se actualizan al recargar.
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerMisMateriasProfesor_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const router_cjgp = useRouter();
const autenticacion_cjgp = useAutenticacionStore_ahbb();

const datos_cjgp = ref(null);
const cargando_cjgp = ref(true);

onMounted(async () => {
  try {
    datos_cjgp.value = await obtenerMisMateriasProfesor_cjgp();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar tus materias asignadas.' });
  } finally {
    cargando_cjgp.value = false;
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Mis Materias — Docente</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Materias de carrera que tienes asignadas (las asigna el administrador en Carreras y Pensums)
    </div>

    <!-- Identidad del docente + período -->
    <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" icon="co_present" />
        </div>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            Prof. {{ autenticacion_cjgp.nombreCompleto_ahbb }}
          </div>
          <div class="text-caption text-grey-8">
            Cédula: {{ autenticacion_cjgp.usuarioActivo_ahbb?.cedula ?? '—' }} ·
            Período activo:
            <strong>{{ datos_cjgp?.periodoActivo?.nombre_cjgp ?? 'sin período activo' }}</strong>
          </div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h5 text-primary">{{ datos_cjgp?.materias?.length ?? 0 }}</div>
          <div class="text-caption">materias asignadas</div>
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_cjgp" />

    <div v-if="datos_cjgp?.materias?.length" class="row q-col-gutter-md">
      <div
        v-for="materia_cjgp in datos_cjgp.materias"
        :key="materia_cjgp.id_materia_cjgp"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold">
              {{ materia_cjgp.codigo_cjgp }} — {{ materia_cjgp.nombre_cjgp }}
            </div>
            <div class="text-caption text-grey-7">
              {{ materia_cjgp.carrera_cjgp.nombre_cjgp }} ·
              {{ materia_cjgp.carrera_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
              {{ materia_cjgp.nroBloque_cjgp }} ·
              {{ materia_cjgp.creditos_cjgp }} créditos
            </div>
            <q-chip
              dense
              class="q-mt-sm"
              :color="materia_cjgp.alumnosEnCurso_cjgp > 0 ? 'blue-1' : 'grey-3'"
              :text-color="materia_cjgp.alumnosEnCurso_cjgp > 0 ? 'blue-9' : 'grey-8'"
              icon="groups"
            >
              {{ materia_cjgp.alumnosEnCurso_cjgp }} alumno(s) cursando
            </q-chip>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              dense
              color="primary"
              icon="grading"
              label="Cargar notas"
              :disable="!materia_cjgp.alumnosEnCurso_cjgp"
              @click="router_cjgp.push('/control-estudios/carga-notas')"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-else-if="!cargando_cjgp" class="text-center text-grey-6 q-pa-xl">
      Aún no tienes materias asignadas.<br />
      El administrador las asigna en <strong>Carreras y Pensums → ver malla</strong>.
    </div>
  </q-page>
</template>
