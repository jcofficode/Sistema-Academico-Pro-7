<!--
  CargaNotasView_jc.vue — Carga de notas (profesor y Control de Estudios).

  Las columnas de entrada se generan DINÁMICAMENTE según el plan de evaluación
  definido por la administración: quien carga solo introduce el resultado final
  de cada corte configurado, sin importar cuántos sean.

  Sobre esa matriz se registran las REPARACIONES: cualquier corte puede
  repararse durante la carga (no se configuran en el plan), y la nota que entra
  en la ponderación es la mejor entre la original y la de reparación.

  Desde aquí también se emite el acta oficial en PDF y se cierra el acta, lo que
  además dispara los Certificados de Sobresaliente (17 a 20 puntos).
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerMateriasConInscritos_jc,
  obtenerMatrizNotas_jc,
  guardarNotas_jc,
  cerrarActa_jc,
  descargarActaPdf_jc,
  registrarReparacion_jc,
  eliminarReparacion_jc,
} from '../../servicios/controlEstudiosServicio_jc';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const autenticacion_jc = useAutenticacionStore_ahbb();

const periodos_jc = ref([]);
const periodoSeleccionado_jc = ref(null);
const materias_jc = ref([]);
const materiaSeleccionada_jc = ref(null);
const matriz_jc = ref(null);
const cargando_jc = ref(false);
const guardando_jc = ref(false);
const descargando_jc = ref(false);

// Notas editadas en pantalla: clave "idInscripcion:idItem" → valor
const notasEditadas_jc = ref({});

// Diálogo de reparaciones del alumno seleccionado
const dialogoReparacion_jc = ref(false);
const filaReparacion_jc = ref(null);
const formularioReparacion_jc = ref({ id_item_jc: null, valor_jc: null, observacion_jc: '' });
const guardandoReparacion_jc = ref(false);

const claveNota_jc = (idInscripcion_jc, idItem_jc) => `${idInscripcion_jc}:${idItem_jc}`;

const valorNota_jc = (fila_jc, item_jc) => {
  const clave_jc = claveNota_jc(fila_jc.id_inscripcion_materia_jc, item_jc.id_item_jc);
  if (clave_jc in notasEditadas_jc.value) return notasEditadas_jc.value[clave_jc];
  return fila_jc.notas_jc[item_jc.id_item_jc] ?? null;
};

const asignarNota_jc = (fila_jc, item_jc, valor_jc) => {
  const clave_jc = claveNota_jc(fila_jc.id_inscripcion_materia_jc, item_jc.id_item_jc);
  notasEditadas_jc.value[clave_jc] = valor_jc === '' || valor_jc === null ? null : Number(valor_jc);
};

/** Reparación registrada para un corte de un alumno (si existe). */
const reparacionDe_jc = (fila_jc, item_jc) =>
  (fila_jc.reparaciones_jc ?? []).find(
    (reparacion_jc) => reparacion_jc.id_item_jc === item_jc.id_item_jc,
  ) ?? null;

/** Nota que realmente pondera: la mejor entre la original y la reparación. */
const notaEfectiva_jc = (fila_jc, item_jc) => {
  const nota_jc = valorNota_jc(fila_jc, item_jc);
  const reparacion_jc = reparacionDe_jc(fila_jc, item_jc);
  if (!reparacion_jc) return nota_jc;
  return Math.max(Number(nota_jc) || 0, Number(reparacion_jc.valor_jc));
};

/** Definitiva calculada EN VIVO con la misma regla de metadatos del backend. */
const definitivaEnVivo_jc = (fila_jc) => {
  if (!matriz_jc.value) return 0;
  let definitiva_jc = 0;
  for (const item_jc of matriz_jc.value.plan.items_jc) {
    const valor_jc = notaEfectiva_jc(fila_jc, item_jc);
    definitiva_jc += ((Number(valor_jc) || 0) * Number(item_jc.peso_jc)) / 100;
  }
  return Math.round(definitiva_jc * 100) / 100;
};

const notaMinimaSobresaliente_jc = computed(
  () => matriz_jc.value?.notaMinimaSobresaliente_jc ?? 17,
);

const hayCambios_jc = computed(() => Object.keys(notasEditadas_jc.value).length > 0);

const cargarMaterias_jc = async () => {
  materiaSeleccionada_jc.value = null;
  matriz_jc.value = null;
  if (!periodoSeleccionado_jc.value) return;
  try {
    materias_jc.value = await obtenerMateriasConInscritos_jc(
      periodoSeleccionado_jc.value.id_periodo_cjgp,
    );
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las materias del período.' });
  }
};

const cargarMatriz_jc = async () => {
  if (!materiaSeleccionada_jc.value) return;
  cargando_jc.value = true;
  notasEditadas_jc.value = {};
  try {
    matriz_jc.value = await obtenerMatrizNotas_jc(
      materiaSeleccionada_jc.value.id_materia_cjgp,
      periodoSeleccionado_jc.value.id_periodo_cjgp,
    );
  } catch (error_jc) {
    matriz_jc.value = null;
    $q.notify({
      type: 'warning',
      message:
        error_jc.response?.data?.mensaje ??
        'No hay un plan de evaluación publicado para este período.',
      timeout: 6000,
    });
  } finally {
    cargando_jc.value = false;
  }
};

const guardar_jc = async () => {
  const notas_jc = Object.entries(notasEditadas_jc.value)
    .filter(([, valor_jc]) => valor_jc !== null && !Number.isNaN(valor_jc))
    .map(([clave_jc, valor_jc]) => {
      const [idInscripcion_jc, idItem_jc] = clave_jc.split(':').map(Number);
      return {
        id_inscripcion_materia_jc: idInscripcion_jc,
        id_item_jc: idItem_jc,
        valor_jc,
      };
    });

  if (!notas_jc.length) {
    $q.notify({ type: 'info', message: 'No hay notas nuevas por guardar.' });
    return;
  }

  // Validación en el cliente contra la escala del plan (el servidor re-valida):
  // avisamos ANTES de enviar, con un mensaje claro por cada nota fuera de rango.
  const escala_jc = Number(matriz_jc.value.plan.notaMaxima_jc);
  const fueraDeEscala_jc = notas_jc.filter(
    (nota_jc) => nota_jc.valor_jc < 0 || nota_jc.valor_jc > escala_jc,
  );
  if (fueraDeEscala_jc.length) {
    $q.notify({
      type: 'warning',
      icon: 'straighten',
      message: `Hay ${fueraDeEscala_jc.length} nota(s) fuera de la escala del plan (0 a ${escala_jc}). Corrígelas antes de guardar (ej: ${fueraDeEscala_jc[0].valor_jc}).`,
      timeout: 6000,
    });
    return;
  }

  guardando_jc.value = true;
  const resultado_jc = await guardarNotas_jc({
    id_materia_jc: materiaSeleccionada_jc.value.id_materia_cjgp,
    id_periodo_jc: periodoSeleccionado_jc.value.id_periodo_cjgp,
    notas_jc,
  });
  guardando_jc.value = false;

  if (resultado_jc.exito) {
    $q.notify({ type: 'positive', message: resultado_jc.mensaje });
    cargarMatriz_jc();
  } else {
    const detalle_jc = resultado_jc.errores?.length ? ` ${resultado_jc.errores[0]}` : '';
    $q.notify({ type: 'negative', message: `${resultado_jc.mensaje}${detalle_jc}`, timeout: 6000 });
  }
};

// ─── Reparaciones ─────────────────────────────────────────────

const abrirReparacion_jc = (fila_jc) => {
  filaReparacion_jc.value = fila_jc;
  formularioReparacion_jc.value = {
    id_item_jc: matriz_jc.value.plan.items_jc[0]?.id_item_jc ?? null,
    valor_jc: null,
    observacion_jc: '',
  };
  dialogoReparacion_jc.value = true;
};

const guardarReparacion_jc = async () => {
  const escala_jc = Number(matriz_jc.value.plan.notaMaxima_jc);
  const valor_jc = Number(formularioReparacion_jc.value.valor_jc);

  if (!formularioReparacion_jc.value.id_item_jc) {
    $q.notify({ type: 'warning', message: 'Selecciona el corte que se va a reparar.' });
    return;
  }
  if (Number.isNaN(valor_jc) || valor_jc < 0 || valor_jc > escala_jc) {
    $q.notify({
      type: 'warning',
      message: `La nota de la reparación debe estar entre 0 y ${escala_jc}.`,
    });
    return;
  }

  guardandoReparacion_jc.value = true;
  const resultado_jc = await registrarReparacion_jc({
    id_inscripcion_materia_jc: filaReparacion_jc.value.id_inscripcion_materia_jc,
    id_item_jc: formularioReparacion_jc.value.id_item_jc,
    valor_jc,
    observacion_jc: formularioReparacion_jc.value.observacion_jc || undefined,
  });
  guardandoReparacion_jc.value = false;

  $q.notify({
    type: resultado_jc.exito ? 'positive' : 'negative',
    message: resultado_jc.mensaje,
    timeout: 5000,
  });
  if (resultado_jc.exito) {
    dialogoReparacion_jc.value = false;
    cargarMatriz_jc();
  }
};

const quitarReparacion_jc = (reparacion_jc) => {
  $q.dialog({
    title: 'Eliminar reparación',
    message: `Se eliminará la reparación de ${Number(reparacion_jc.valor_jc)} puntos. La definitiva volverá a calcularse con la nota original. ¿Continuar?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
  }).onOk(async () => {
    const resultado_jc = await eliminarReparacion_jc(reparacion_jc.id_reparacion_jc);
    $q.notify({
      type: resultado_jc.exito ? 'positive' : 'negative',
      message: resultado_jc.mensaje,
    });
    if (resultado_jc.exito) cargarMatriz_jc();
  });
};

// ─── Actas ────────────────────────────────────────────────────

const descargarActa_jc = async () => {
  descargando_jc.value = true;
  const exito_jc = await descargarActaPdf_jc(
    materiaSeleccionada_jc.value.id_materia_cjgp,
    periodoSeleccionado_jc.value.id_periodo_cjgp,
  );
  descargando_jc.value = false;
  $q.notify({
    type: exito_jc ? 'positive' : 'negative',
    message: exito_jc
      ? 'Acta generada y registrada con su hash de verificación.'
      : 'No se pudo generar el acta.',
  });
};

const confirmarCierre_jc = () => {
  $q.dialog({
    title: 'Cerrar acta definitiva',
    message: `Se calcularán las definitivas con el plan vigente (reparaciones incluidas) y cada alumno quedará APROBADO o REPROBADO en su historial. Quienes cierren con ${notaMinimaSobresaliente_jc.value} puntos o más recibirán el Certificado de Sobresaliente. ¿Continuar?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Cerrar acta', color: 'positive' },
    persistent: true,
  }).onOk(async () => {
    const resultado_jc = await cerrarActa_jc(
      materiaSeleccionada_jc.value.id_materia_cjgp,
      periodoSeleccionado_jc.value.id_periodo_cjgp,
    );
    $q.notify({
      type: resultado_jc.exito ? 'positive' : 'negative',
      message: resultado_jc.mensaje,
      timeout: 8000,
    });
    if (resultado_jc.exito) cargarMatriz_jc();
  });
};

onMounted(async () => {
  try {
    periodos_jc.value = await obtenerPeriodos_cjgp();
    const activo_jc = periodos_jc.value.find((periodo_jc) => periodo_jc.activo_cjgp);
    if (activo_jc) {
      periodoSeleccionado_jc.value = activo_jc;
      cargarMaterias_jc();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los períodos.' });
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Carga de Notas y Actas</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Las columnas se generan según el plan de evaluación del período — Control de Estudios (JC)
      <q-chip
        v-if="autenticacion_jc.esControlEstudios_ahbb"
        dense
        size="sm"
        color="teal-1"
        text-color="teal-9"
        icon="fact_check"
      >
        Control de Estudios · acceso a todas las materias
      </q-chip>
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="periodoSeleccionado_jc"
          :options="periodos_jc"
          option-label="nombre_cjgp"
          label="Período académico"
          outlined
          dense
          @update:model-value="cargarMaterias_jc"
        />
      </div>
      <div class="col-12 col-md-5">
        <q-select
          v-model="materiaSeleccionada_jc"
          :options="materias_jc"
          :option-label="(materia_jc) =>
            `${materia_jc.codigo_cjgp} — ${materia_jc.nombre_cjgp} (${materia_jc.totalInscritos_jc} alumnos)` +
            (materia_jc.profesor_cjgp
              ? ` · Prof. ${materia_jc.profesor_cjgp.nombre_ahbb} ${materia_jc.profesor_cjgp.apellido_ahbb}`
              : ' · sin profesor asignado')"
          label="Materia con inscritos"
          outlined
          dense
          :disable="!periodoSeleccionado_jc"
          @update:model-value="cargarMatriz_jc"
        />
      </div>
    </div>

    <q-inner-loading :showing="cargando_jc" label="Construyendo matriz según el plan vigente..." />

    <template v-if="matriz_jc && !cargando_jc">
      <!-- Contexto completo del acta: docente, carrera, materia y período -->
      <q-card flat bordered class="q-pa-md q-mb-sm bg-blue-grey-1">
        <div class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-avatar color="primary" text-color="white" icon="co_present" />
          </div>
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">
              {{ matriz_jc.materia.codigo_cjgp }} — {{ matriz_jc.materia.nombre_cjgp }}
            </div>
            <div class="text-caption text-grey-8">
              <strong>Carrera:</strong> {{ matriz_jc.materia.carrera_cjgp.nombre_cjgp }}
              ({{ matriz_jc.materia.carrera_cjgp.regimen_cjgp }}) ·
              <strong>Bloque:</strong>
              {{ matriz_jc.materia.carrera_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
              {{ matriz_jc.materia.nroBloque_cjgp }} ·
              <strong>Créditos:</strong> {{ matriz_jc.materia.creditos_cjgp }} ·
              <strong>Período:</strong> {{ matriz_jc.periodo.nombre_cjgp }}
            </div>
            <div class="text-caption text-grey-8">
              <strong>Profesor asignado:</strong>
              {{
                matriz_jc.materia.profesor_cjgp
                  ? `${matriz_jc.materia.profesor_cjgp.nombre_ahbb} ${matriz_jc.materia.profesor_cjgp.apellido_ahbb} (${matriz_jc.materia.profesor_cjgp.cedula_ahbb})`
                  : 'sin asignar (el admin lo asigna en Carreras y Pensums)'
              }}
              · <strong>Quien carga:</strong> {{ autenticacion_jc.nombreCompleto_ahbb }}
              ({{ autenticacion_jc.usuarioActivo_ahbb?.cedula ?? '—' }})
            </div>
          </div>
          <div class="col-auto text-center">
            <div class="text-h5 text-primary">{{ matriz_jc.filas.length }}</div>
            <div class="text-caption">alumnos inscritos</div>
          </div>
        </div>
      </q-card>

      <!-- Información del plan que rige la matriz -->
      <q-banner class="bg-indigo-1 text-indigo-9 q-mb-md" rounded dense>
        <template #avatar><q-icon name="rule" /></template>
        Plan vigente: <strong>{{ matriz_jc.plan.nombre_jc }}</strong> · Escala 0–{{ Number(matriz_jc.plan.notaMaxima_jc) }}
        · Aprobatoria {{ Number(matriz_jc.plan.notaAprobatoria_jc) }} ·
        {{ matriz_jc.plan.items_jc.length }} cortes configurados por la coordinación ·
        Sobresaliente desde {{ notaMinimaSobresaliente_jc }} puntos.
      </q-banner>

      <q-markup-table flat bordered dense>
        <thead>
          <tr class="bg-blue-grey-1">
            <th class="text-left">Cédula</th>
            <th class="text-left">Apellidos y Nombres</th>
            <!-- Columnas DINÁMICAS: una por cada corte del plan -->
            <th v-for="item_jc in matriz_jc.plan.items_jc" :key="item_jc.id_item_jc" class="text-center">
              {{ item_jc.nombre_jc }}<br />
              <span class="text-caption text-grey-7">{{ Number(item_jc.peso_jc) }}%</span>
            </th>
            <th class="text-center">Reparaciones</th>
            <th class="text-center">Definitiva</th>
            <th class="text-center">Condición</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila_jc in matriz_jc.filas" :key="fila_jc.id_inscripcion_materia_jc">
            <td>{{ fila_jc.alumno_jc.cedula_ahbb }}</td>
            <td>{{ fila_jc.alumno_jc.apellido_ahbb }}, {{ fila_jc.alumno_jc.nombre_ahbb }}</td>

            <td
              v-for="item_jc in matriz_jc.plan.items_jc"
              :key="item_jc.id_item_jc"
              class="text-center"
              style="width: 96px"
            >
              <q-input
                :model-value="valorNota_jc(fila_jc, item_jc)"
                type="number"
                dense
                outlined
                :min="0"
                :max="Number(matriz_jc.plan.notaMaxima_jc)"
                step="0.25"
                :disable="fila_jc.estatus_jc !== 'INSCRITO'"
                @update:model-value="(valor_jc) => asignarNota_jc(fila_jc, item_jc, valor_jc)"
              />
              <!-- Si el corte fue reparado, se muestra la nota que realmente pondera -->
              <q-chip
                v-if="reparacionDe_jc(fila_jc, item_jc)"
                dense
                size="sm"
                color="blue-1"
                text-color="blue-9"
                icon="autorenew"
                class="q-mt-xs"
                clickable
                @click="quitarReparacion_jc(reparacionDe_jc(fila_jc, item_jc))"
              >
                R: {{ Number(reparacionDe_jc(fila_jc, item_jc).valor_jc) }}
                <q-tooltip>
                  Reparación registrada por
                  {{ reparacionDe_jc(fila_jc, item_jc).registradoPor_jc?.nombre_ahbb ?? '—' }}
                  {{ reparacionDe_jc(fila_jc, item_jc).registradoPor_jc?.apellido_ahbb ?? '' }}.
                  Cuenta {{ notaEfectiva_jc(fila_jc, item_jc) }}. Clic para eliminarla.
                </q-tooltip>
              </q-chip>
            </td>

            <td class="text-center">
              <q-btn
                flat
                dense
                size="sm"
                color="blue-8"
                icon="autorenew"
                :label="String((fila_jc.reparaciones_jc ?? []).length)"
                :disable="fila_jc.estatus_jc !== 'INSCRITO'"
                @click="abrirReparacion_jc(fila_jc)"
              >
                <q-tooltip>Registrar la reparación de un corte</q-tooltip>
              </q-btn>
            </td>

            <td class="text-center text-weight-bold">
              {{ definitivaEnVivo_jc(fila_jc) }}
              <q-icon
                v-if="definitivaEnVivo_jc(fila_jc) >= notaMinimaSobresaliente_jc"
                name="military_tech"
                color="amber-8"
                size="18px"
              >
                <q-tooltip>Rango de excelencia: recibirá el Certificado de Sobresaliente al cerrar el acta.</q-tooltip>
              </q-icon>
            </td>

            <td class="text-center">
              <q-chip
                v-if="fila_jc.estatus_jc !== 'INSCRITO'"
                dense
                :color="fila_jc.estatus_jc === 'APROBADO' ? 'green-1' : 'red-1'"
                :text-color="fila_jc.estatus_jc === 'APROBADO' ? 'green-9' : 'red-9'"
              >
                {{ fila_jc.estatus_jc }} ({{ Number(fila_jc.notaFinal_jc) }})
              </q-chip>
              <q-chip
                v-else
                dense
                :color="definitivaEnVivo_jc(fila_jc) >= Number(matriz_jc.plan.notaAprobatoria_jc) ? 'green-1' : 'orange-1'"
                :text-color="definitivaEnVivo_jc(fila_jc) >= Number(matriz_jc.plan.notaAprobatoria_jc) ? 'green-9' : 'orange-9'"
              >
                {{ definitivaEnVivo_jc(fila_jc) >= Number(matriz_jc.plan.notaAprobatoria_jc) ? 'Aprobando' : 'En riesgo' }}
              </q-chip>
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          color="primary"
          icon="save"
          label="Guardar notas"
          :disable="!hayCambios_jc"
          :loading="guardando_jc"
          @click="guardar_jc"
        />
        <q-space />
        <q-btn
          outline
          color="blue-grey-8"
          icon="description"
          label="Acta oficial (PDF)"
          :loading="descargando_jc"
          @click="descargarActa_jc"
        />
        <q-btn
          color="positive"
          icon="task_alt"
          label="Cerrar acta definitiva"
          @click="confirmarCierre_jc"
        />
      </div>
    </template>

    <div
      v-else-if="!cargando_jc && periodoSeleccionado_jc && !materias_jc.length"
      class="text-center text-grey-6 q-pa-xl"
    >
      <template v-if="autenticacion_jc.esProfesor_ahbb">
        No tienes materias asignadas con alumnos inscritos en este período.<br />
        El administrador asigna los profesores en
        <strong>Carreras y Pensums → ver malla</strong>; al asignarte una
        materia, aparecerá aquí automáticamente.
      </template>
      <template v-else>
        No hay materias con alumnos inscritos en este período.
      </template>
    </div>

    <!-- Diálogo: registrar la reparación de un corte -->
    <q-dialog v-model="dialogoReparacion_jc">
      <q-card style="min-width: 460px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar color="blue-8" text-color="white" icon="autorenew" size="34px" class="q-mr-sm" />
          <div>
            <div class="text-subtitle1 text-weight-bold">Registrar reparación</div>
            <div class="text-caption text-grey-7" v-if="filaReparacion_jc">
              {{ filaReparacion_jc.alumno_jc.apellido_ahbb }},
              {{ filaReparacion_jc.alumno_jc.nombre_ahbb }}
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md">
            <template #avatar><q-icon name="info" /></template>
            Puedes reparar el corte que necesites. La nota que cuenta para la definitiva será
            la <strong>mejor</strong> entre la original y la de reparación.
          </q-banner>

          <q-select
            v-model="formularioReparacion_jc.id_item_jc"
            :options="matriz_jc?.plan.items_jc ?? []"
            option-label="nombre_jc"
            option-value="id_item_jc"
            emit-value
            map-options
            label="Corte a reparar *"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model.number="formularioReparacion_jc.valor_jc"
            type="number"
            :min="0"
            :max="Number(matriz_jc?.plan.notaMaxima_jc ?? 20)"
            step="0.25"
            :label="`Nota de la reparación (0 a ${Number(matriz_jc?.plan.notaMaxima_jc ?? 20)}) *`"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="formularioReparacion_jc.observacion_jc"
            label="Observación (opcional)"
            outlined
            dense
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Registrar reparación"
            :loading="guardandoReparacion_jc"
            @click="guardarReparacion_jc"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
