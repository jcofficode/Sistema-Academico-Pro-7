<!--
  InscripcionMateriasView_cjgp.vue — Vitrina de Materias del Estudiante.

  Épica 3: Inscripción sin fricción.
   - Vitrina clara: materias no cursables aparecen en gris con candado y el
     motivo exacto ("Requiere: Base de Datos I").
   - Calculadora reactiva: barra de créditos que suma en tiempo real.
   - Comunicación empática: si algo no está permitido, se muestra un modal
     limpio que explica qué ocurre — nunca un error rojo con códigos.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerCarreras_cjgp,
  obtenerVitrina_cjgp,
  inscribirMaterias_cjgp,
} from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();
const autenticacion_cjgp = useAutenticacionStore_ahbb();

const carreras_cjgp = ref([]);
const carreraSeleccionada_cjgp = ref(null);
const vitrina_cjgp = ref(null);
const cargando_cjgp = ref(false);
const inscribiendo_cjgp = ref(false);
const seleccionadas_cjgp = ref([]); // materias marcadas para inscribir

// Modal empático: explica en lenguaje claro qué ocurre
const dialogoEmpatico_cjgp = ref({ visible: false, titulo: '', mensajes: [] });

const mostrarModalEmpatico_cjgp = (titulo_cjgp, mensajes_cjgp) => {
  dialogoEmpatico_cjgp.value = {
    visible: true,
    titulo: titulo_cjgp,
    mensajes: Array.isArray(mensajes_cjgp) ? mensajes_cjgp : [mensajes_cjgp],
  };
};

// ─── Calculadora reactiva de créditos ─────────────────────────
const creditosSeleccionados_cjgp = computed(() =>
  seleccionadas_cjgp.value.reduce(
    (total_cjgp, materia_cjgp) => total_cjgp + materia_cjgp.creditos_cjgp,
    0,
  ),
);
const creditosTotales_cjgp = computed(
  () => (vitrina_cjgp.value?.creditosInscritos_cjgp ?? 0) + creditosSeleccionados_cjgp.value,
);
const limiteCreditos_cjgp = computed(
  () => vitrina_cjgp.value?.carrera?.limiteCreditos_cjgp ?? 21,
);
const progresoCreditos_cjgp = computed(() =>
  Math.min(creditosTotales_cjgp.value / limiteCreditos_cjgp.value, 1),
);
const colorProgreso_cjgp = computed(() => {
  if (creditosTotales_cjgp.value >= limiteCreditos_cjgp.value) return 'orange';
  if (progresoCreditos_cjgp.value > 0.75) return 'amber';
  return 'primary';
});

// ─── Carga de datos ───────────────────────────────────────────
const cargarVitrina_cjgp = async () => {
  if (!carreraSeleccionada_cjgp.value) return;
  cargando_cjgp.value = true;
  seleccionadas_cjgp.value = [];
  try {
    vitrina_cjgp.value = await obtenerVitrina_cjgp(
      carreraSeleccionada_cjgp.value.id_carrera_cjgp,
    );
  } catch (error_cjgp) {
    vitrina_cjgp.value = null;
    mostrarModalEmpatico_cjgp(
      'Inscripciones no disponibles',
      error_cjgp.response?.data?.mensaje ??
        'No hay un período académico activo en este momento. Consulta a la coordinación.',
    );
  } finally {
    cargando_cjgp.value = false;
  }
};

// ─── Selección con el Guardián del lado del cliente ───────────
const estaSeleccionada_cjgp = (materia_cjgp) =>
  seleccionadas_cjgp.value.some(
    (candidata_cjgp) => candidata_cjgp.id_materia_cjgp === materia_cjgp.id_materia_cjgp,
  );

const alternarMateria_cjgp = (materia_cjgp) => {
  if (materia_cjgp.condicion_cjgp === 'BLOQUEADA') {
    const nombres_cjgp = materia_cjgp.requisitosFaltantes_cjgp
      .map((requisito_cjgp) => requisito_cjgp.nombre_cjgp)
      .join(', ');
    mostrarModalEmpatico_cjgp(
      'Materia aún no disponible',
      `Para cursar "${materia_cjgp.nombre_cjgp}" primero debes aprobar: ${nombres_cjgp}. ¡Vas por buen camino!`,
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

  // Control de créditos en vivo: aviso ANTES de exceder el límite
  if (creditosTotales_cjgp.value + materia_cjgp.creditos_cjgp > limiteCreditos_cjgp.value) {
    mostrarModalEmpatico_cjgp(
      'Límite de créditos alcanzado',
      `Has alcanzado el límite máximo de ${limiteCreditos_cjgp.value} créditos para este período. Por favor, desmarca una materia para continuar.`,
    );
    return;
  }
  seleccionadas_cjgp.value.push(materia_cjgp);
};

// ─── Confirmación de inscripción ──────────────────────────────
const confirmarInscripcion_cjgp = async () => {
  inscribiendo_cjgp.value = true;
  const resultado_cjgp = await inscribirMaterias_cjgp(
    vitrina_cjgp.value.carrera.id_carrera_cjgp,
    vitrina_cjgp.value.periodo.id_periodo_cjgp,
    seleccionadas_cjgp.value.map((materia_cjgp) => materia_cjgp.id_materia_cjgp),
  );
  inscribiendo_cjgp.value = false;

  if (resultado_cjgp.exito) {
    $q.notify({ type: 'positive', message: resultado_cjgp.mensaje, timeout: 5000 });
    cargarVitrina_cjgp();
  } else {
    // El servidor re-audita: mostramos sus explicaciones con empatía
    mostrarModalEmpatico_cjgp(
      'Revisemos tu selección',
      resultado_cjgp.violaciones.length
        ? resultado_cjgp.violaciones
        : resultado_cjgp.mensaje,
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
    carreras_cjgp.value = await obtenerCarreras_cjgp();
    if (carreras_cjgp.value.length === 1) {
      carreraSeleccionada_cjgp.value = carreras_cjgp.value[0];
      cargarVitrina_cjgp();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la oferta de carreras.' });
  }
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Inscripción de Materias</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Selecciona tus materias del período — el sistema te guía en todo momento.
    </div>

    <q-select
      v-model="carreraSeleccionada_cjgp"
      :options="carreras_cjgp"
      option-label="nombre_cjgp"
      label="Carrera"
      outlined
      dense
      class="q-mb-md"
      style="max-width: 420px"
      @update:model-value="cargarVitrina_cjgp"
    />

    <q-inner-loading :showing="cargando_cjgp" label="Consultando tu historial académico..." />

    <template v-if="vitrina_cjgp && !cargando_cjgp">
      <!-- Contexto completo: quién se inscribe, en qué carrera y en qué período -->
      <q-card flat bordered class="q-pa-sm q-mb-sm bg-white">
        <div class="row items-center q-col-gutter-sm text-caption">
          <div class="col-auto">
            <q-avatar size="28px" color="primary" text-color="white" icon="person" />
          </div>
          <div class="col">
            <strong>Alumno:</strong> {{ autenticacion_cjgp.nombreCompleto_ahbb }}
            ({{ autenticacion_cjgp.usuarioActivo_ahbb?.cedula ?? '—' }})
            · <strong>Carrera:</strong> {{ vitrina_cjgp.carrera.nombre_cjgp }}
            ({{ vitrina_cjgp.carrera.regimen_cjgp }})
            · <strong>Período:</strong> {{ vitrina_cjgp.periodo.nombre_cjgp }}
            · <strong>Límite:</strong> {{ limiteCreditos_cjgp }} créditos
          </div>
        </div>
      </q-card>

      <!-- Banner de morosidad / falta de pago (_ap) -->
      <q-banner
        v-if="!vitrina_cjgp.solvente_ap"
        rounded
        class="bg-deep-orange-1 text-deep-orange-9 q-mb-md"
        style="border: 1px solid #ffab91"
      >
        <template #avatar>
          <q-icon name="warning" size="32px" color="deep-orange" />
        </template>
        <div class="text-weight-bold text-subtitle1">
          Debes cancelar el arancel del período para poder inscribirte
        </div>
        <div>
          No registras un pago confirmado para el período {{ vitrina_cjgp.periodo.nombre_cjgp }}.
          Por favor, realiza tu pago para poder continuar con la inscripción de tus materias.
        </div>
        <template #action>
          <q-btn
            id="btn-ir-a-pagos-vitrina"
            flat
            color="deep-orange"
            label="Ir a Mis Pagos"
            to="/alumno/mis-pagos"
          />
        </template>
      </q-banner>

      <!-- Calculadora reactiva de créditos (sticky) -->
      <q-card flat bordered class="q-pa-md q-mb-md bg-blue-grey-1 calculadora-fija_cjgp">
        <div class="row items-center q-col-gutter-md">
          <div class="col">
            <div class="text-caption text-weight-bold">
              Período {{ vitrina_cjgp.periodo.nombre_cjgp }} — Créditos:
              {{ creditosTotales_cjgp }} / {{ limiteCreditos_cjgp }}
              <span v-if="vitrina_cjgp.creditosInscritos_cjgp" class="text-grey-7">
                ({{ vitrina_cjgp.creditosInscritos_cjgp }} ya inscritos)
              </span>
            </div>
            <q-linear-progress
              :value="progresoCreditos_cjgp"
              :color="colorProgreso_cjgp"
              size="14px"
              rounded
              class="q-mt-xs"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="positive"
              icon="how_to_reg"
              :label="`Inscribir ${seleccionadas_cjgp.length} materia(s)`"
              :disable="!seleccionadas_cjgp.length || !vitrina_cjgp.solvente_ap"
              :loading="inscribiendo_cjgp"
              @click="confirmarInscripcion_cjgp"
            />
          </div>
        </div>
      </q-card>


      <!-- Leyenda -->
      <div class="row q-gutter-sm q-mb-md text-caption items-center">
        <q-chip dense color="white" text-color="primary" icon="radio_button_unchecked">Disponible</q-chip>
        <q-chip dense color="blue-1" text-color="blue-9" icon="check_circle">Seleccionada</q-chip>
        <q-chip dense color="grey-4" text-color="grey-8" icon="lock">Bloqueada por prelación</q-chip>
        <q-chip dense color="green-1" text-color="green-9" icon="verified">Aprobada</q-chip>
        <q-chip dense color="amber-1" text-color="orange-9" icon="pending">Ya inscrita</q-chip>
      </div>

      <!-- Vitrina por bloques -->
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
                      {{ materia_cjgp.codigo_cjgp }} · {{ materia_cjgp.creditos_cjgp }} créditos
                    </div>
                    <div class="text-body2">{{ materia_cjgp.nombre_cjgp }}</div>
                    <div class="text-caption text-grey-7">
                      👨‍🏫
                      {{
                        materia_cjgp.profesor_cjgp
                          ? `Prof. ${materia_cjgp.profesor_cjgp.nombre_ahbb} ${materia_cjgp.profesor_cjgp.apellido_ahbb}`
                          : 'Profesor por asignar'
                      }}
                    </div>
                  </div>
                  <q-icon
                    v-if="materia_cjgp.condicion_cjgp === 'BLOQUEADA'"
                    name="lock"
                    size="sm"
                    color="grey-6"
                  />
                  <q-icon
                    v-else-if="materia_cjgp.condicion_cjgp === 'APROBADA'"
                    name="verified"
                    size="sm"
                    color="green"
                  />
                  <q-icon
                    v-else-if="materia_cjgp.condicion_cjgp === 'INSCRITA'"
                    name="pending"
                    size="sm"
                    color="orange"
                  />
                  <q-checkbox
                    v-else
                    :model-value="estaSeleccionada_cjgp(materia_cjgp)"
                    dense
                    @click.stop="alternarMateria_cjgp(materia_cjgp)"
                  />
                </div>
                <div
                  v-if="materia_cjgp.condicion_cjgp === 'BLOQUEADA'"
                  class="text-caption text-grey-7 q-mt-xs"
                >
                  🔒 Requiere:
                  {{ materia_cjgp.requisitosFaltantes_cjgp.map((r) => r.codigo_cjgp).join(', ') }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal empático: lenguaje claro, sin códigos del sistema -->
    <q-dialog v-model="dialogoEmpatico_cjgp.visible">
      <q-card style="min-width: 360px; max-width: 480px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="emoji_objects" color="amber-2" text-color="orange-9" />
          <div class="text-h6 q-ml-sm">{{ dialogoEmpatico_cjgp.titulo }}</div>
        </q-card-section>
        <q-card-section>
          <p
            v-for="(mensaje_cjgp, indice_cjgp) in dialogoEmpatico_cjgp.mensajes"
            :key="indice_cjgp"
            class="q-mb-sm"
          >
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
  transform: translateY(-1px);
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
.calculadora-fija_cjgp {
  position: sticky;
  top: 60px;
  z-index: 5;
}
</style>
