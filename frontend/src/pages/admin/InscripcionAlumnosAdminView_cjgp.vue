<!--
  InscripcionAlumnosAdminView_cjgp.vue — Inscripción de Alumnos (Administrador).

  El admin inscribe materias EN NOMBRE de un alumno: elige al estudiante y la
  carrera, ve exactamente la misma vitrina que vería el alumno (mismo Motor de
  Reglas: candados por prelación, créditos, condiciones) y procesa la
  inscripción. El Guardián re-audita en el servidor: ni siquiera el admin
  puede saltarse el reglamento académico.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerCarreras_cjgp,
  obtenerVitrinaAdmin_cjgp,
  inscribirMateriasAdmin_cjgp,
} from '../../servicios/academicoServicio_cjgp';
import { obtenerUsuariosPorRol_ahbb } from '../../servicios/usuariosServicio_ahbb';

const $q = useQuasar();

const alumnos_cjgp = ref([]);
const carreras_cjgp = ref([]);
const alumnoSeleccionado_cjgp = ref(null);
const carreraSeleccionada_cjgp = ref(null);
const vitrina_cjgp = ref(null);
const cargando_cjgp = ref(false);
const inscribiendo_cjgp = ref(false);
const seleccionadas_cjgp = ref([]);

const dialogoAviso_cjgp = ref({ visible: false, titulo: '', mensajes: [] });

const mostrarAviso_cjgp = (titulo_cjgp, mensajes_cjgp) => {
  dialogoAviso_cjgp.value = {
    visible: true,
    titulo: titulo_cjgp,
    mensajes: Array.isArray(mensajes_cjgp) ? mensajes_cjgp : [mensajes_cjgp],
  };
};

// ─── Calculadora de créditos (misma lógica que la vitrina del alumno) ───
const creditosSeleccionados_cjgp = computed(() =>
  seleccionadas_cjgp.value.reduce((total_cjgp, m_cjgp) => total_cjgp + m_cjgp.creditos_cjgp, 0),
);
const creditosTotales_cjgp = computed(
  () => (vitrina_cjgp.value?.creditosInscritos_cjgp ?? 0) + creditosSeleccionados_cjgp.value,
);
const limiteCreditos_cjgp = computed(
  () => vitrina_cjgp.value?.carrera?.limiteCreditos_cjgp ?? 21,
);

const cargarVitrina_cjgp = async () => {
  if (!alumnoSeleccionado_cjgp.value || !carreraSeleccionada_cjgp.value) return;
  cargando_cjgp.value = true;
  seleccionadas_cjgp.value = [];
  try {
    vitrina_cjgp.value = await obtenerVitrinaAdmin_cjgp(
      alumnoSeleccionado_cjgp.value.id,
      carreraSeleccionada_cjgp.value.id_carrera_cjgp,
    );
  } catch (error_cjgp) {
    vitrina_cjgp.value = null;
    mostrarAviso_cjgp(
      'No se pudo cargar la vitrina',
      error_cjgp.response?.data?.mensaje ??
        'No hay un período académico activo. Actívalo en Períodos Académicos.',
    );
  } finally {
    cargando_cjgp.value = false;
  }
};

const estaSeleccionada_cjgp = (materia_cjgp) =>
  seleccionadas_cjgp.value.some(
    (candidata_cjgp) => candidata_cjgp.id_materia_cjgp === materia_cjgp.id_materia_cjgp,
  );

const alternarMateria_cjgp = (materia_cjgp) => {
  if (materia_cjgp.condicion_cjgp === 'BLOQUEADA') {
    mostrarAviso_cjgp(
      'Materia bloqueada para este alumno',
      `"${materia_cjgp.nombre_cjgp}" requiere aprobar antes: ${materia_cjgp.requisitosFaltantes_cjgp
        .map((r_cjgp) => r_cjgp.nombre_cjgp)
        .join(', ')}.`,
    );
    return;
  }
  if (materia_cjgp.condicion_cjgp !== 'ELEGIBLE') return;

  if (estaSeleccionada_cjgp(materia_cjgp)) {
    seleccionadas_cjgp.value = seleccionadas_cjgp.value.filter(
      (candidata_cjgp) => candidata_cjgp.id_materia_cjgp !== materia_cjgp.id_materia_cjgp,
    );
    return;
  }
  if (creditosTotales_cjgp.value + materia_cjgp.creditos_cjgp > limiteCreditos_cjgp.value) {
    mostrarAviso_cjgp(
      'Límite de créditos del alumno',
      `El alumno alcanzaría ${creditosTotales_cjgp.value + materia_cjgp.creditos_cjgp} créditos y el límite del período es ${limiteCreditos_cjgp.value}.`,
    );
    return;
  }
  seleccionadas_cjgp.value.push(materia_cjgp);
};

const confirmarInscripcion_cjgp = async () => {
  inscribiendo_cjgp.value = true;
  const resultado_cjgp = await inscribirMateriasAdmin_cjgp(
    alumnoSeleccionado_cjgp.value.id,
    vitrina_cjgp.value.carrera.id_carrera_cjgp,
    vitrina_cjgp.value.periodo.id_periodo_cjgp,
    seleccionadas_cjgp.value.map((materia_cjgp) => materia_cjgp.id_materia_cjgp),
  );
  inscribiendo_cjgp.value = false;

  if (resultado_cjgp.exito) {
    $q.notify({ type: 'positive', message: resultado_cjgp.mensaje, timeout: 5000 });
    cargarVitrina_cjgp();
  } else {
    mostrarAviso_cjgp(
      'El Guardián rechazó la inscripción',
      resultado_cjgp.violaciones?.length ? resultado_cjgp.violaciones : resultado_cjgp.mensaje,
    );
  }
};

const estiloTarjeta_cjgp = (materia_cjgp) => ({
  BLOQUEADA: 'materia-bloqueada_cjgp',
  APROBADA: 'materia-aprobada_cjgp',
  INSCRITA: 'materia-inscrita_cjgp',
  ELEGIBLE: estaSeleccionada_cjgp(materia_cjgp)
    ? 'materia-seleccionada_cjgp'
    : 'materia-elegible_cjgp',
}[materia_cjgp.condicion_cjgp]);

onMounted(async () => {
  try {
    [alumnos_cjgp.value, carreras_cjgp.value] = await Promise.all([
      obtenerUsuariosPorRol_ahbb('alumno'),
      obtenerCarreras_cjgp(),
    ]);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar alumnos y carreras.' });
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Inscripción de Alumnos — Materias</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Inscribe materias en nombre de un estudiante — el Motor de Reglas aplica igual
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="alumnoSeleccionado_cjgp"
          :options="alumnos_cjgp"
          :option-label="(alumno_cjgp) => `${alumno_cjgp.nombre} ${alumno_cjgp.apellido} (${alumno_cjgp.cedula})`"
          label="Alumno"
          outlined
          dense
          use-input
          input-debounce="0"
          @update:model-value="cargarVitrina_cjgp"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="carreraSeleccionada_cjgp"
          :options="carreras_cjgp"
          option-label="nombre_cjgp"
          label="Carrera"
          outlined
          dense
          @update:model-value="cargarVitrina_cjgp"
        />
      </div>
    </div>

    <q-inner-loading :showing="cargando_cjgp" label="Evaluando el historial del alumno..." />

    <template v-if="vitrina_cjgp && !cargando_cjgp">
      <!-- Contexto: a quién se inscribe y su estado de créditos -->
      <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1">
        <div class="row items-center q-col-gutter-md">
          <div class="col">
            <div class="text-caption">
              <strong>Alumno:</strong> {{ alumnoSeleccionado_cjgp.nombre }}
              {{ alumnoSeleccionado_cjgp.apellido }} ({{ alumnoSeleccionado_cjgp.cedula }})
              · <strong>Carrera:</strong> {{ vitrina_cjgp.carrera.nombre_cjgp }}
              · <strong>Período:</strong> {{ vitrina_cjgp.periodo.nombre_cjgp }}
              · <strong>Créditos:</strong> {{ creditosTotales_cjgp }} / {{ limiteCreditos_cjgp }}
            </div>
            <q-linear-progress
              :value="Math.min(creditosTotales_cjgp / limiteCreditos_cjgp, 1)"
              color="primary"
              size="10px"
              rounded
              class="q-mt-xs"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="positive"
              icon="how_to_reg"
              :label="`Inscribir ${seleccionadas_cjgp.length} materia(s)`"
              :disable="!seleccionadas_cjgp.length"
              :loading="inscribiendo_cjgp"
              @click="confirmarInscripcion_cjgp"
            />
          </div>
        </div>
      </q-card>

      <!-- Vitrina del alumno tal como la ve él -->
      <div v-for="bloque_cjgp in vitrina_cjgp.bloques_cjgp" :key="bloque_cjgp.nroBloque_cjgp" class="q-mb-md">
        <div class="text-subtitle2 text-weight-bold text-blue-9 q-mb-xs">
          {{ vitrina_cjgp.carrera.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
          {{ bloque_cjgp.nroBloque_cjgp }}
        </div>
        <div class="row q-col-gutter-sm">
          <div
            v-for="materia_cjgp in bloque_cjgp.materias_cjgp"
            :key="materia_cjgp.id_materia_cjgp"
            class="col-12 col-sm-6 col-md-3"
          >
            <q-card
              flat
              bordered
              class="materia-vitrina_cjgp"
              :class="estiloTarjeta_cjgp(materia_cjgp)"
              @click="alternarMateria_cjgp(materia_cjgp)"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-caption text-weight-bold">
                      {{ materia_cjgp.codigo_cjgp }} · {{ materia_cjgp.creditos_cjgp }} cr.
                    </div>
                    <div class="text-body2">{{ materia_cjgp.nombre_cjgp }}</div>
                    <div class="text-caption text-grey-7">
                      👨‍🏫
                      {{
                        materia_cjgp.profesor_cjgp
                          ? `Prof. ${materia_cjgp.profesor_cjgp.nombre_ahbb} ${materia_cjgp.profesor_cjgp.apellido_ahbb}`
                          : 'Por asignar'
                      }}
                    </div>
                  </div>
                  <q-icon v-if="materia_cjgp.condicion_cjgp === 'BLOQUEADA'" name="lock" size="sm" color="grey-6" />
                  <q-icon v-else-if="materia_cjgp.condicion_cjgp === 'APROBADA'" name="verified" size="sm" color="green" />
                  <q-icon v-else-if="materia_cjgp.condicion_cjgp === 'INSCRITA'" name="pending" size="sm" color="orange" />
                  <q-checkbox
                    v-else
                    :model-value="estaSeleccionada_cjgp(materia_cjgp)"
                    dense
                    @click.stop="alternarMateria_cjgp(materia_cjgp)"
                  />
                </div>
                <div v-if="materia_cjgp.condicion_cjgp === 'BLOQUEADA'" class="text-caption text-grey-7 q-mt-xs">
                  🔒 Requiere: {{ materia_cjgp.requisitosFaltantes_cjgp.map((r) => r.codigo_cjgp).join(', ') }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!cargando_cjgp" class="text-center text-grey-6 q-pa-xl">
      Selecciona un alumno y una carrera para ver su vitrina.
    </div>

    <q-dialog v-model="dialogoAviso_cjgp.visible">
      <q-card style="min-width: 360px; max-width: 480px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="shield" color="amber-2" text-color="orange-9" />
          <div class="text-h6 q-ml-sm">{{ dialogoAviso_cjgp.titulo }}</div>
        </q-card-section>
        <q-card-section>
          <p v-for="(mensaje_cjgp, indice_cjgp) in dialogoAviso_cjgp.mensajes" :key="indice_cjgp" class="q-mb-sm">
            {{ mensaje_cjgp }}
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Entendido" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.materia-vitrina_cjgp {
  transition: all 0.15s ease;
  cursor: pointer;
}
.materia-elegible_cjgp:hover {
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.25);
}
.materia-seleccionada_cjgp {
  border: 2px solid #1976d2;
  background: #e3f2fd;
}
.materia-bloqueada_cjgp {
  background: #eceff1;
  opacity: 0.75;
  cursor: not-allowed;
}
.materia-aprobada_cjgp {
  background: #e8f5e9;
  cursor: default;
}
.materia-inscrita_cjgp {
  background: #fff8e1;
  cursor: default;
}
</style>
