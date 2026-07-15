<!--
  HistorialCarreraView_cjgp.vue — Historial Académico de la CARRERA (Alumno).

  Recorrido completo del alumno en su(s) carrera(s): todas las materias
  cursadas agrupadas por período académico, con estatus, nota final y créditos.
  Es el historial "de carrera": el de cursos extracurriculares sigue estando
  en la sección de Cursos.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerHistorialMaterias_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const autenticacion_cjgp = useAutenticacionStore_ahbb();

const inscripciones_cjgp = ref([]);
const cargando_cjgp = ref(true);

// El historial es el expediente de lo YA CURSADO: las materias en curso
// (INSCRITO) se consultan en "Mis Materias" y sus notas en "Mis Notas".
const soloYaCursadas_cjgp = computed(() =>
  inscripciones_cjgp.value.filter(
    (inscripcion_cjgp) => inscripcion_cjgp.estatus_cjgp !== 'INSCRITO',
  ),
);

// Agrupar por período (más reciente primero) para leer el historial como expediente
const historialPorPeriodo_cjgp = computed(() => {
  const grupos_cjgp = new Map();
  for (const inscripcion_cjgp of soloYaCursadas_cjgp.value) {
    const clave_cjgp = inscripcion_cjgp.periodo_cjgp.nombre_cjgp;
    if (!grupos_cjgp.has(clave_cjgp)) {
      grupos_cjgp.set(clave_cjgp, {
        periodo_cjgp: inscripcion_cjgp.periodo_cjgp,
        inscripciones_cjgp: [],
      });
    }
    grupos_cjgp.get(clave_cjgp).inscripciones_cjgp.push(inscripcion_cjgp);
  }
  return [...grupos_cjgp.values()].sort(
    (a_cjgp, b_cjgp) =>
      new Date(b_cjgp.periodo_cjgp.fechaInicio_cjgp) -
      new Date(a_cjgp.periodo_cjgp.fechaInicio_cjgp),
  );
});

// Resumen global del expediente (solo materias ya cursadas)
const resumen_cjgp = computed(() => {
  const aprobadas_cjgp = soloYaCursadas_cjgp.value.filter(
    (i_cjgp) => i_cjgp.estatus_cjgp === 'APROBADO',
  );
  return {
    total: soloYaCursadas_cjgp.value.length,
    aprobadas: aprobadas_cjgp.length,
    reprobadas: soloYaCursadas_cjgp.value.filter((i) => i.estatus_cjgp === 'REPROBADO').length,
    retiradas: soloYaCursadas_cjgp.value.filter((i) => i.estatus_cjgp === 'RETIRADO').length,
    creditosAprobados: aprobadas_cjgp.reduce(
      (total_cjgp, i_cjgp) => total_cjgp + i_cjgp.materia_cjgp.creditos_cjgp,
      0,
    ),
  };
});

const COLOR_ESTATUS_CJGP = {
  INSCRITO: { color: 'blue-1', texto: 'blue-9', etiqueta: 'EN CURSO' },
  APROBADO: { color: 'green-1', texto: 'green-9', etiqueta: 'APROBADO' },
  REPROBADO: { color: 'red-1', texto: 'red-9', etiqueta: 'REPROBADO' },
  RETIRADO: { color: 'grey-3', texto: 'grey-8', etiqueta: 'RETIRADO' },
};

onMounted(async () => {
  try {
    inscripciones_cjgp.value = await obtenerHistorialMaterias_cjgp();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar tu historial de carrera.' });
  } finally {
    cargando_cjgp.value = false;
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Historial de Carrera</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Tu expediente académico completo por período (solo materias de carrera)
    </div>

    <!-- Identidad del alumno + resumen del expediente -->
    <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" icon="history_edu" />
        </div>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            {{ autenticacion_cjgp.nombreCompleto_ahbb }}
          </div>
          <div class="text-caption text-grey-8">
            Cédula: {{ autenticacion_cjgp.usuarioActivo_ahbb?.cedula ?? '—' }} · Alumno
          </div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-green-9">{{ resumen_cjgp.aprobadas }}</div>
          <div class="text-caption">aprobadas</div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-red-9">{{ resumen_cjgp.reprobadas }}</div>
          <div class="text-caption">reprobadas</div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-grey-8">{{ resumen_cjgp.retiradas }}</div>
          <div class="text-caption">retiradas</div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-primary">{{ resumen_cjgp.creditosAprobados }}</div>
          <div class="text-caption">créditos aprobados</div>
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_cjgp" />

    <template v-if="!cargando_cjgp && historialPorPeriodo_cjgp.length">
      <q-card
        v-for="grupo_cjgp in historialPorPeriodo_cjgp"
        :key="grupo_cjgp.periodo_cjgp.nombre_cjgp"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section class="bg-blue-1 q-py-sm row items-center">
          <div class="text-subtitle2 text-weight-bold text-blue-9">
            Período {{ grupo_cjgp.periodo_cjgp.nombre_cjgp }}
          </div>
          <q-chip v-if="grupo_cjgp.periodo_cjgp.activo_cjgp" dense color="green" text-color="white" class="q-ml-sm">
            ACTIVO
          </q-chip>
          <q-space />
          <div class="text-caption text-blue-9">
            {{ grupo_cjgp.inscripciones_cjgp.length }} materia(s)
          </div>
        </q-card-section>

        <q-markup-table flat dense>
          <thead>
            <tr class="bg-grey-2">
              <th class="text-left">Código</th>
              <th class="text-left">Materia</th>
              <th class="text-left">Carrera</th>
              <th class="text-left">Profesor</th>
              <th class="text-center">Bloque</th>
              <th class="text-center">Créditos</th>
              <th class="text-center">Nota final</th>
              <th class="text-center">Condición</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inscripcion_cjgp in grupo_cjgp.inscripciones_cjgp"
              :key="inscripcion_cjgp.id_inscripcion_materia_cjgp"
            >
              <td>{{ inscripcion_cjgp.materia_cjgp.codigo_cjgp }}</td>
              <td>{{ inscripcion_cjgp.materia_cjgp.nombre_cjgp }}</td>
              <td class="text-caption">
                {{ inscripcion_cjgp.materia_cjgp.carrera_cjgp.nombre_cjgp }}
              </td>
              <td class="text-caption">
                {{
                  inscripcion_cjgp.materia_cjgp.profesor_cjgp
                    ? `${inscripcion_cjgp.materia_cjgp.profesor_cjgp.nombre_ahbb} ${inscripcion_cjgp.materia_cjgp.profesor_cjgp.apellido_ahbb}`
                    : '—'
                }}
              </td>
              <td class="text-center">{{ inscripcion_cjgp.materia_cjgp.nroBloque_cjgp }}</td>
              <td class="text-center">{{ inscripcion_cjgp.materia_cjgp.creditos_cjgp }}</td>
              <td class="text-center text-weight-bold">
                {{ inscripcion_cjgp.notaFinal_cjgp !== null ? Number(inscripcion_cjgp.notaFinal_cjgp) : '—' }}
              </td>
              <td class="text-center">
                <q-chip
                  dense
                  size="sm"
                  :color="COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.color"
                  :text-color="COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.texto"
                >
                  {{ COLOR_ESTATUS_CJGP[inscripcion_cjgp.estatus_cjgp]?.etiqueta }}
                </q-chip>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
    </template>

    <div v-else-if="!cargando_cjgp" class="text-center text-grey-6 q-pa-xl">
      Aún no tienes materias culminadas en tu expediente.<br />
      Las materias que cursas actualmente se ven en <strong>Mis Materias</strong>
      y sus notas en <strong>Mis Notas</strong>.
    </div>
  </q-page>
</template>
