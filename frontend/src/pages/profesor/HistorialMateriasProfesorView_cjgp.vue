<!--
  HistorialMateriasProfesorView_cjgp.vue — Historial docente.

  Todo lo que el profesor ha dictado, agrupado por período académico, con
  el resultado de cada materia: alumnos en curso, aprobados, reprobados,
  retirados y el promedio de las notas finales (cuando el acta se cerró).
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { obtenerHistorialMisMaterias_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const autenticacion_cjgp = useAutenticacionStore_ahbb();

const historial_cjgp = ref([]);
const cargando_cjgp = ref(true);

onMounted(async () => {
  try {
    historial_cjgp.value = await obtenerHistorialMisMaterias_cjgp();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar tu historial docente.' });
  } finally {
    cargando_cjgp.value = false;
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Mi Historial de Materias</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Materias dictadas por período con sus resultados académicos
    </div>

    <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" icon="history_edu" />
        </div>
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">
            Prof. {{ autenticacion_cjgp.nombreCompleto_ahbb }}
          </div>
          <div class="text-caption text-grey-8">
            Cédula: {{ autenticacion_cjgp.usuarioActivo_ahbb?.cedula ?? '—' }} · Docente
          </div>
        </div>
        <div class="col-auto text-center">
          <div class="text-h6 text-primary">{{ historial_cjgp.length }}</div>
          <div class="text-caption">período(s) dictados</div>
        </div>
      </div>
    </q-card>

    <q-inner-loading :showing="cargando_cjgp" />

    <template v-if="!cargando_cjgp && historial_cjgp.length">
      <q-card
        v-for="grupo_cjgp in historial_cjgp"
        :key="grupo_cjgp.periodo_cjgp.id_periodo_cjgp"
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
            {{ grupo_cjgp.materias_cjgp.length }} materia(s)
          </div>
        </q-card-section>

        <q-markup-table flat dense>
          <thead>
            <tr class="bg-grey-2">
              <th class="text-left">Código</th>
              <th class="text-left">Materia</th>
              <th class="text-left">Carrera</th>
              <th class="text-center">En curso</th>
              <th class="text-center">Aprobados</th>
              <th class="text-center">Reprobados</th>
              <th class="text-center">Retirados</th>
              <th class="text-center">Promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="resumen_cjgp in grupo_cjgp.materias_cjgp"
              :key="resumen_cjgp.materia_cjgp.id_materia_cjgp"
            >
              <td>{{ resumen_cjgp.materia_cjgp.codigo_cjgp }}</td>
              <td>{{ resumen_cjgp.materia_cjgp.nombre_cjgp }}</td>
              <td class="text-caption">{{ resumen_cjgp.materia_cjgp.carrera_cjgp.nombre_cjgp }}</td>
              <td class="text-center">
                <q-chip dense size="sm" color="blue-1" text-color="blue-9">{{ resumen_cjgp.enCurso_cjgp }}</q-chip>
              </td>
              <td class="text-center">
                <q-chip dense size="sm" color="green-1" text-color="green-9">{{ resumen_cjgp.aprobados_cjgp }}</q-chip>
              </td>
              <td class="text-center">
                <q-chip dense size="sm" color="red-1" text-color="red-9">{{ resumen_cjgp.reprobados_cjgp }}</q-chip>
              </td>
              <td class="text-center">
                <q-chip dense size="sm" color="grey-3" text-color="grey-8">{{ resumen_cjgp.retirados_cjgp }}</q-chip>
              </td>
              <td class="text-center text-weight-bold">
                {{ resumen_cjgp.promedio_cjgp ?? '—' }}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
    </template>

    <div v-else-if="!cargando_cjgp" class="text-center text-grey-6 q-pa-xl">
      Aún no has dictado materias con alumnos inscritos.
    </div>
  </q-page>
</template>
