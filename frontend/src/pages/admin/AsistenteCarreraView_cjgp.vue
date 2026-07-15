<!--
  AsistenteCarreraView_cjgp.vue — Asistente Paso a Paso de creación de carreras.

  Épica 1: en lugar de un formulario gigante, el administrador avanza en 4 pasos:
    1. Datos de la carrera (el sistema calcula y "dibuja" los bloques).
    2. Materias: se agregan al banco y se ARRASTRAN a cada bloque (drag & drop),
       o se importan masivamente desde un Excel institucional (botón mágico).
    3. Prelaciones visuales: se conecta una materia con su requisito con dos clics.
    4. Resumen y confirmación (guardado transaccional).
-->
<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  crearCarreraCompleta_cjgp,
  analizarPensumExcel_cjgp,
  descargarPlantillaPensum_cjgp,
} from '../../servicios/academicoServicio_cjgp';
import { obtenerProfesoresParaSelect_ahbb } from '../../servicios/usuariosServicio_ahbb';

const $q = useQuasar();
const router_cjgp = useRouter();

const paso_cjgp = ref(1);
const guardando_cjgp = ref(false);

// Profesores disponibles: se asignan a cada materia desde el propio asistente
const profesores_cjgp = ref([]);
const opcionesProfesores_cjgp = computed(() => [
  { etiqueta_cjgp: '— Sin profesor —', valor_cjgp: null },
  ...profesores_cjgp.value.map((profesor_cjgp) => ({
    etiqueta_cjgp: `${profesor_cjgp.nombre} ${profesor_cjgp.apellido}`,
    valor_cjgp: profesor_cjgp.id,
  })),
]);
const nombreProfesor_cjgp = (idProfesor_cjgp) => {
  const profesor_cjgp = profesores_cjgp.value.find((p_cjgp) => p_cjgp.id === idProfesor_cjgp);
  return profesor_cjgp ? `${profesor_cjgp.nombre} ${profesor_cjgp.apellido}` : null;
};

obtenerProfesoresParaSelect_ahbb()
  .then((lista_cjgp) => {
    profesores_cjgp.value = lista_cjgp;
  })
  .catch(() => {
    // El asistente funciona igual; los profesores podrán asignarse luego
  });

// ─── Paso 1: datos de la carrera ──────────────────────────────
const carrera_cjgp = ref({
  codigo_cjgp: '',
  nombre_cjgp: '',
  descripcion_cjgp: '',
  regimen_cjgp: 'SEMESTRAL',
  duracionAnios_cjgp: 3,
  limiteCreditos_cjgp: 21,
});

// El sistema dibuja los bloques automáticamente según régimen y duración
const totalBloques_cjgp = computed(
  () =>
    carrera_cjgp.value.duracionAnios_cjgp *
    (carrera_cjgp.value.regimen_cjgp === 'TRIMESTRAL' ? 3 : 2),
);
const nombreBloque_cjgp = computed(() =>
  carrera_cjgp.value.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre',
);

const paso1Valido_cjgp = computed(
  () =>
    carrera_cjgp.value.codigo_cjgp.trim() &&
    carrera_cjgp.value.nombre_cjgp.trim() &&
    carrera_cjgp.value.duracionAnios_cjgp >= 1,
);

// ─── Paso 2: materias (banco + drag & drop a bloques) ─────────
const materias_cjgp = ref([]); // { codigo, nombre, creditos, nroBloque (0 = banco), requisitos: [], id_profesor }
const nuevaMateria_cjgp = ref({
  codigo_cjgp: '',
  nombre_cjgp: '',
  creditos_cjgp: 3,
  id_profesor_cjgp: null,
});
const archivoExcel_cjgp = ref(null);
const analizandoExcel_cjgp = ref(false);

const materiasEnBanco_cjgp = computed(() =>
  materias_cjgp.value.filter((materia_cjgp) => materia_cjgp.nroBloque_cjgp === 0),
);
const materiasDeBloque_cjgp = (nroBloque_cjgp) =>
  materias_cjgp.value.filter(
    (materia_cjgp) => materia_cjgp.nroBloque_cjgp === nroBloque_cjgp,
  );
const materiasUbicadas_cjgp = computed(() =>
  materias_cjgp.value.filter((materia_cjgp) => materia_cjgp.nroBloque_cjgp > 0),
);

const agregarMateria_cjgp = () => {
  const codigo_cjgp = nuevaMateria_cjgp.value.codigo_cjgp.trim().toUpperCase();
  if (!codigo_cjgp || !nuevaMateria_cjgp.value.nombre_cjgp.trim()) {
    $q.notify({ type: 'warning', message: 'Indica código y nombre de la materia.' });
    return;
  }
  if (materias_cjgp.value.some((materia_cjgp) => materia_cjgp.codigo_cjgp === codigo_cjgp)) {
    $q.notify({ type: 'warning', message: `El código ${codigo_cjgp} ya existe en el pensum.` });
    return;
  }
  materias_cjgp.value.push({
    codigo_cjgp,
    nombre_cjgp: nuevaMateria_cjgp.value.nombre_cjgp.trim(),
    creditos_cjgp: Number(nuevaMateria_cjgp.value.creditos_cjgp) || 3,
    nroBloque_cjgp: 0,
    requisitos_cjgp: [],
    id_profesor_cjgp: nuevaMateria_cjgp.value.id_profesor_cjgp ?? null,
  });
  nuevaMateria_cjgp.value = {
    codigo_cjgp: '',
    nombre_cjgp: '',
    creditos_cjgp: 3,
    id_profesor_cjgp: nuevaMateria_cjgp.value.id_profesor_cjgp ?? null,
  };
};

const quitarMateria_cjgp = (codigo_cjgp) => {
  materias_cjgp.value = materias_cjgp.value.filter(
    (materia_cjgp) => materia_cjgp.codigo_cjgp !== codigo_cjgp,
  );
  // Limpiar prelaciones que apuntaban a la materia eliminada
  materias_cjgp.value.forEach((materia_cjgp) => {
    materia_cjgp.requisitos_cjgp = materia_cjgp.requisitos_cjgp.filter(
      (requisito_cjgp) => requisito_cjgp !== codigo_cjgp,
    );
  });
};

// Drag & drop nativo HTML5: arrastrar tarjetas del banco a los bloques
const alIniciarArrastre_cjgp = (evento_cjgp, codigo_cjgp) => {
  evento_cjgp.dataTransfer.setData('text/plain', codigo_cjgp);
  evento_cjgp.dataTransfer.effectAllowed = 'move';
};

const alSoltar_cjgp = (evento_cjgp, nroBloque_cjgp) => {
  const codigo_cjgp = evento_cjgp.dataTransfer.getData('text/plain');
  const materia_cjgp = materias_cjgp.value.find(
    (candidata_cjgp) => candidata_cjgp.codigo_cjgp === codigo_cjgp,
  );
  if (materia_cjgp) {
    materia_cjgp.nroBloque_cjgp = nroBloque_cjgp;
  }
};

// Descarga la plantilla del régimen elegido (semestral o trimestral)
const descargarPlantilla_cjgp = async (regimen_cjgp) => {
  const exito_cjgp = await descargarPlantillaPensum_cjgp(regimen_cjgp);
  $q.notify({
    type: exito_cjgp ? 'positive' : 'negative',
    message: exito_cjgp
      ? `Plantilla ${regimen_cjgp.toLowerCase()} descargada.`
      : 'No se pudo descargar la plantilla.',
  });
};

// "Botón mágico": importar el pensum completo desde Excel
const importarExcel_cjgp = async () => {
  if (!archivoExcel_cjgp.value) {
    $q.notify({ type: 'warning', message: 'Selecciona el archivo Excel del pensum.' });
    return;
  }
  analizandoExcel_cjgp.value = true;
  const resultado_cjgp = await analizarPensumExcel_cjgp(archivoExcel_cjgp.value);
  analizandoExcel_cjgp.value = false;

  if (resultado_cjgp.errores?.length) {
    $q.notify({
      type: 'negative',
      message: `El archivo tiene ${resultado_cjgp.errores.length} error(es): ${resultado_cjgp.errores[0]}`,
      timeout: 6000,
    });
    return;
  }

  // El sistema construye la malla curricular automáticamente
  materias_cjgp.value = resultado_cjgp.materias.map((materia_cjgp) => ({
    codigo_cjgp: materia_cjgp.codigo_cjgp,
    nombre_cjgp: materia_cjgp.nombre_cjgp,
    creditos_cjgp: materia_cjgp.creditos_cjgp,
    nroBloque_cjgp: Math.min(materia_cjgp.nroBloque_cjgp, totalBloques_cjgp.value),
    requisitos_cjgp: materia_cjgp.requisitos_cjgp ?? [],
    id_profesor_cjgp: null, // el admin los asigna en las tarjetas tras importar
  }));
  archivoExcel_cjgp.value = null;
  $q.notify({
    type: 'positive',
    message: `✨ ${materias_cjgp.value.length} materias importadas y ubicadas en sus bloques.`,
  });
};

// ─── Paso 3: prelaciones visuales (dos clics para conectar) ───
const materiaOrigen_cjgp = ref(null); // materia que REQUIERE (destino de la flecha)

const seleccionarParaConectar_cjgp = (materia_cjgp) => {
  if (!materiaOrigen_cjgp.value) {
    materiaOrigen_cjgp.value = materia_cjgp;
    return;
  }
  if (materiaOrigen_cjgp.value.codigo_cjgp === materia_cjgp.codigo_cjgp) {
    materiaOrigen_cjgp.value = null;
    return;
  }

  // La segunda materia clicada se convierte en REQUISITO de la primera
  const origen_cjgp = materiaOrigen_cjgp.value;
  if (materia_cjgp.nroBloque_cjgp >= origen_cjgp.nroBloque_cjgp) {
    $q.notify({
      type: 'warning',
      message: `El requisito debe estar en un bloque anterior al de ${origen_cjgp.codigo_cjgp}.`,
    });
    materiaOrigen_cjgp.value = null;
    return;
  }
  if (origen_cjgp.requisitos_cjgp.includes(materia_cjgp.codigo_cjgp)) {
    $q.notify({ type: 'info', message: 'Esa conexión ya existe.' });
  } else {
    origen_cjgp.requisitos_cjgp.push(materia_cjgp.codigo_cjgp);
    $q.notify({
      type: 'positive',
      message: `🔗 ${origen_cjgp.codigo_cjgp} ahora requiere ${materia_cjgp.codigo_cjgp}.`,
    });
  }
  materiaOrigen_cjgp.value = null;
};

const quitarPrelacion_cjgp = (materia_cjgp, requisito_cjgp) => {
  materia_cjgp.requisitos_cjgp = materia_cjgp.requisitos_cjgp.filter(
    (candidato_cjgp) => candidato_cjgp !== requisito_cjgp,
  );
};

const totalPrelaciones_cjgp = computed(() =>
  materias_cjgp.value.reduce(
    (total_cjgp, materia_cjgp) => total_cjgp + materia_cjgp.requisitos_cjgp.length,
    0,
  ),
);

// ─── Paso 4: guardar todo (transaccional) ─────────────────────
const guardarCarrera_cjgp = async () => {
  guardando_cjgp.value = true;
  const resultado_cjgp = await crearCarreraCompleta_cjgp({
    ...carrera_cjgp.value,
    codigo_cjgp: carrera_cjgp.value.codigo_cjgp.trim().toUpperCase(),
    duracionAnios_cjgp: Number(carrera_cjgp.value.duracionAnios_cjgp),
    limiteCreditos_cjgp: Number(carrera_cjgp.value.limiteCreditos_cjgp),
    materias_cjgp: materiasUbicadas_cjgp.value.map((materia_cjgp) => ({
      codigo_cjgp: materia_cjgp.codigo_cjgp,
      nombre_cjgp: materia_cjgp.nombre_cjgp,
      creditos_cjgp: Number(materia_cjgp.creditos_cjgp),
      nroBloque_cjgp: materia_cjgp.nroBloque_cjgp,
      requisitos_cjgp: materia_cjgp.requisitos_cjgp,
      id_profesor_cjgp: materia_cjgp.id_profesor_cjgp ?? null,
    })),
  });
  guardando_cjgp.value = false;

  if (resultado_cjgp.exito) {
    $q.notify({ type: 'positive', message: resultado_cjgp.mensaje, timeout: 5000 });
    router_cjgp.push('/admin/carreras');
  } else {
    const detalle_cjgp = resultado_cjgp.errores?.length
      ? ` (${resultado_cjgp.errores[0]})`
      : '';
    $q.notify({
      type: 'negative',
      message: `${resultado_cjgp.mensaje}${detalle_cjgp}`,
      timeout: 7000,
    });
  }
};
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Asistente de Nueva Carrera</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Crea la oferta académica completa en 4 pasos guiados — sin formularios gigantes.
    </div>

    <q-stepper v-model="paso_cjgp" color="primary" animated flat bordered header-nav>
      <!-- ════════ PASO 1: Definir la carrera ════════ -->
      <q-step :name="1" title="Definir la carrera" icon="school" :done="paso_cjgp > 1">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input v-model="carrera_cjgp.codigo_cjgp" label="Código *" outlined dense maxlength="20" hint="Ej: INF" />
          </div>
          <div class="col-12 col-md-9">
            <q-input v-model="carrera_cjgp.nombre_cjgp" label="Nombre de la carrera *" outlined dense maxlength="200" />
          </div>
          <div class="col-12">
            <q-input v-model="carrera_cjgp.descripcion_cjgp" label="Descripción" outlined dense type="textarea" autogrow />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="carrera_cjgp.regimen_cjgp"
              :options="['SEMESTRAL', 'TRIMESTRAL']"
              label="Régimen del período"
              outlined
              dense
            />
          </div>
          <div class="col-6 col-md-4">
            <q-input v-model.number="carrera_cjgp.duracionAnios_cjgp" type="number" min="1" max="7" label="Duración (años)" outlined dense />
          </div>
          <div class="col-6 col-md-4">
            <q-input
              v-model.number="carrera_cjgp.limiteCreditos_cjgp"
              type="number"
              min="1"
              max="60"
              label="Límite de créditos por período"
              outlined
              dense
              hint="Regla del Guardián (Épica 2)"
            />
          </div>
        </div>

        <!-- El sistema "dibuja" los bloques en vivo -->
        <q-banner class="bg-blue-1 text-blue-9 q-mt-md" rounded>
          <template #avatar><q-icon name="grid_view" /></template>
          El sistema dibujará <strong>{{ totalBloques_cjgp }} bloques</strong>
          ({{ nombreBloque_cjgp.toLowerCase() }}s) para esta carrera.
        </q-banner>

        <q-stepper-navigation>
          <q-btn color="primary" label="Continuar" :disable="!paso1Valido_cjgp" @click="paso_cjgp = 2" />
        </q-stepper-navigation>
      </q-step>

      <!-- ════════ PASO 2: Materias (banco + drag & drop + Excel) ════════ -->
      <q-step :name="2" title="Armar el pensum" icon="menu_book" :done="paso_cjgp > 2">
        <div class="row q-col-gutter-md">
          <!-- Banco de materias -->
          <div class="col-12 col-md-4">
            <q-card flat bordered>
              <q-card-section class="bg-grey-2 q-py-sm">
                <div class="text-subtitle2 text-weight-bold">
                  Banco de materias ({{ materiasEnBanco_cjgp.length }})
                </div>
                <div class="text-caption text-grey-7">Arrastra cada materia a su bloque →</div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-xs">
                  <div class="col-4"><q-input v-model="nuevaMateria_cjgp.codigo_cjgp" label="Código" dense outlined /></div>
                  <div class="col-8"><q-input v-model="nuevaMateria_cjgp.nombre_cjgp" label="Nombre" dense outlined @keyup.enter="agregarMateria_cjgp" /></div>
                  <div class="col-6"><q-input v-model.number="nuevaMateria_cjgp.creditos_cjgp" type="number" min="1" max="12" label="Créditos" dense outlined /></div>
                  <div class="col-6">
                    <!-- El profesor se asigna desde el propio asistente -->
                    <q-select
                      v-model="nuevaMateria_cjgp.id_profesor_cjgp"
                      :options="opcionesProfesores_cjgp"
                      option-label="etiqueta_cjgp"
                      option-value="valor_cjgp"
                      emit-value
                      map-options
                      dense
                      outlined
                      label="Profesor"
                    />
                  </div>
                  <div class="col-12"><q-btn color="primary" icon="add" label="Agregar" class="full-width" @click="agregarMateria_cjgp" /></div>
                </div>

                <q-separator class="q-my-md" />

                <!-- Carga masiva: el botón mágico -->
                <div class="text-caption text-weight-bold q-mb-xs">⚡ Carga masiva desde Excel</div>
                <q-file v-model="archivoExcel_cjgp" label="Pensum institucional (.xlsx)" dense outlined accept=".xlsx,.xls" clearable>
                  <template #prepend><q-icon name="upload_file" /></template>
                </q-file>
                <div class="row q-gutter-xs q-mt-xs">
                  <q-btn size="sm" color="secondary" icon="auto_fix_high" label="Importar pensum" :loading="analizandoExcel_cjgp" @click="importarExcel_cjgp" />
                  <!-- Plantilla adaptada al régimen: el admin elige semestral o trimestral -->
                  <q-btn-dropdown size="sm" flat color="primary" icon="download" label="Plantilla">
                    <q-list dense>
                      <q-item clickable v-close-popup @click="descargarPlantilla_cjgp('SEMESTRAL')">
                        <q-item-section avatar><q-icon name="calendar_view_month" color="blue-8" /></q-item-section>
                        <q-item-section>
                          <q-item-label>Plantilla Semestral</q-item-label>
                          <q-item-label caption>Ejemplo de 3 años · 6 semestres</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="descargarPlantilla_cjgp('TRIMESTRAL')">
                        <q-item-section avatar><q-icon name="view_module" color="purple-8" /></q-item-section>
                        <q-item-section>
                          <q-item-label>Plantilla Trimestral</q-item-label>
                          <q-item-label caption>Ejemplo de 3 años · 9 trimestres</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                </div>

                <q-separator class="q-my-md" />

                <div
                  v-for="materia_cjgp in materiasEnBanco_cjgp"
                  :key="materia_cjgp.codigo_cjgp"
                  class="materia-tarjeta_cjgp q-pa-sm q-mb-xs rounded-borders bg-amber-1"
                  draggable="true"
                  @dragstart="alIniciarArrastre_cjgp($event, materia_cjgp.codigo_cjgp)"
                >
                  <div class="row items-center no-wrap">
                    <q-icon name="drag_indicator" class="q-mr-xs text-grey-6" />
                    <div class="col">
                      <div class="text-caption text-weight-bold">{{ materia_cjgp.codigo_cjgp }} · {{ materia_cjgp.nombre_cjgp }}</div>
                      <div class="text-caption text-grey-7">{{ materia_cjgp.creditos_cjgp }} créditos</div>
                      <q-select
                        v-model="materia_cjgp.id_profesor_cjgp"
                        :options="opcionesProfesores_cjgp"
                        option-label="etiqueta_cjgp"
                        option-value="valor_cjgp"
                        emit-value
                        map-options
                        dense
                        options-dense
                        borderless
                        :display-value="materia_cjgp.id_profesor_cjgp ? `👨‍🏫 ${nombreProfesor_cjgp(materia_cjgp.id_profesor_cjgp)}` : '👨‍🏫 Asignar profesor…'"
                        class="text-caption"
                      />
                    </div>
                    <q-btn flat round dense size="sm" icon="close" color="negative" @click="quitarMateria_cjgp(materia_cjgp.codigo_cjgp)" />
                  </div>
                </div>
                <div v-if="!materiasEnBanco_cjgp.length" class="text-caption text-grey-6 text-center q-pa-sm">
                  Banco vacío: agrega materias o importa el Excel.
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Bloques dibujados por el sistema (zona de soltado) -->
          <div class="col-12 col-md-8">
            <div class="row q-col-gutter-sm">
              <div v-for="nroBloque_cjgp in totalBloques_cjgp" :key="nroBloque_cjgp" class="col-12 col-sm-6 col-lg-4">
                <q-card
                  flat
                  bordered
                  class="bloque-zona_cjgp"
                  @dragover.prevent
                  @drop="alSoltar_cjgp($event, nroBloque_cjgp)"
                >
                  <q-card-section class="bg-blue-1 q-py-xs">
                    <div class="text-caption text-weight-bold text-blue-9">
                      {{ nombreBloque_cjgp }} {{ nroBloque_cjgp }}
                    </div>
                  </q-card-section>
                  <q-card-section class="q-pa-sm" style="min-height: 70px">
                    <div
                      v-for="materia_cjgp in materiasDeBloque_cjgp(nroBloque_cjgp)"
                      :key="materia_cjgp.codigo_cjgp"
                      class="materia-tarjeta_cjgp q-pa-xs q-mb-xs rounded-borders bg-green-1"
                      draggable="true"
                      @dragstart="alIniciarArrastre_cjgp($event, materia_cjgp.codigo_cjgp)"
                    >
                      <div class="row items-center no-wrap">
                        <div class="col text-caption">
                          <strong>{{ materia_cjgp.codigo_cjgp }}</strong> ({{ materia_cjgp.creditos_cjgp }} cr.)
                          <q-select
                            v-model="materia_cjgp.id_profesor_cjgp"
                            :options="opcionesProfesores_cjgp"
                            option-label="etiqueta_cjgp"
                            option-value="valor_cjgp"
                            emit-value
                            map-options
                            dense
                            options-dense
                            borderless
                            :display-value="materia_cjgp.id_profesor_cjgp ? `👨‍🏫 ${nombreProfesor_cjgp(materia_cjgp.id_profesor_cjgp)}` : '👨‍🏫 Asignar…'"
                          />
                        </div>
                        <q-btn flat round dense size="xs" icon="undo" color="grey-7" @click="materia_cjgp.nroBloque_cjgp = 0">
                          <q-tooltip>Devolver al banco</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                    <div v-if="!materiasDeBloque_cjgp(nroBloque_cjgp).length" class="text-caption text-grey-5 text-center">
                      Suelta materias aquí
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn flat color="primary" label="Atrás" class="q-mr-sm" @click="paso_cjgp = 1" />
          <q-btn
            color="primary"
            label="Continuar"
            :disable="!materiasUbicadas_cjgp.length"
            @click="paso_cjgp = 3"
          />
          <span v-if="materiasEnBanco_cjgp.length" class="text-caption text-orange-9 q-ml-md">
            ⚠ Quedan {{ materiasEnBanco_cjgp.length }} materia(s) sin ubicar (no se guardarán).
          </span>
        </q-stepper-navigation>
      </q-step>

      <!-- ════════ PASO 3: Prelaciones visuales ════════ -->
      <q-step :name="3" title="Conectar prelaciones" icon="account_tree" :done="paso_cjgp > 3">
        <q-banner class="bg-purple-1 text-purple-9 q-mb-md" rounded>
          <template #avatar><q-icon name="touch_app" /></template>
          <strong>1er clic:</strong> la materia que tiene el requisito ·
          <strong>2do clic:</strong> la materia que debe aprobarse antes.
          <span v-if="materiaOrigen_cjgp">
            — Conectando <q-chip dense color="purple" text-color="white">{{ materiaOrigen_cjgp.codigo_cjgp }}</q-chip>
            → elige su requisito (bloque anterior)…
          </span>
        </q-banner>

        <div class="row q-col-gutter-sm items-start">
          <div v-for="nroBloque_cjgp in totalBloques_cjgp" :key="nroBloque_cjgp" class="col-6 col-sm-4 col-md-2">
            <div class="text-caption text-weight-bold text-center q-mb-xs">
              {{ nombreBloque_cjgp }} {{ nroBloque_cjgp }}
            </div>
            <q-card
              v-for="materia_cjgp in materiasDeBloque_cjgp(nroBloque_cjgp)"
              :key="materia_cjgp.codigo_cjgp"
              flat
              bordered
              class="q-mb-xs cursor-pointer"
              :class="{
                'bg-purple-2': materiaOrigen_cjgp?.codigo_cjgp === materia_cjgp.codigo_cjgp,
                'bg-white': materiaOrigen_cjgp?.codigo_cjgp !== materia_cjgp.codigo_cjgp,
              }"
              @click="seleccionarParaConectar_cjgp(materia_cjgp)"
            >
              <q-card-section class="q-pa-xs">
                <div class="text-caption text-weight-bold">{{ materia_cjgp.codigo_cjgp }}</div>
                <div class="text-caption ellipsis">{{ materia_cjgp.nombre_cjgp }}</div>
                <q-chip
                  v-for="requisito_cjgp in materia_cjgp.requisitos_cjgp"
                  :key="requisito_cjgp"
                  dense
                  removable
                  size="sm"
                  color="deep-purple-1"
                  text-color="deep-purple-9"
                  icon="lock"
                  @remove="quitarPrelacion_cjgp(materia_cjgp, requisito_cjgp)"
                >
                  {{ requisito_cjgp }}
                </q-chip>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn flat color="primary" label="Atrás" class="q-mr-sm" @click="paso_cjgp = 2" />
          <q-btn color="primary" label="Continuar" @click="paso_cjgp = 4" />
          <span class="text-caption text-grey-7 q-ml-md">{{ totalPrelaciones_cjgp }} prelación(es) definidas</span>
        </q-stepper-navigation>
      </q-step>

      <!-- ════════ PASO 4: Resumen y confirmación ════════ -->
      <q-step :name="4" title="Confirmar" icon="task_alt">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            {{ carrera_cjgp.codigo_cjgp.toUpperCase() }} — {{ carrera_cjgp.nombre_cjgp }}
          </div>
          <div class="row q-col-gutter-md text-center">
            <div class="col-6 col-md-3">
              <div class="text-h5 text-primary">{{ totalBloques_cjgp }}</div>
              <div class="text-caption">{{ nombreBloque_cjgp }}s</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-h5 text-primary">{{ materiasUbicadas_cjgp.length }}</div>
              <div class="text-caption">Materias</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-h5 text-primary">{{ totalPrelaciones_cjgp }}</div>
              <div class="text-caption">Prelaciones</div>
            </div>
            <div class="col-6 col-md-3">
              <div class="text-h5 text-primary">{{ carrera_cjgp.limiteCreditos_cjgp }}</div>
              <div class="text-caption">Límite créditos/período</div>
            </div>
          </div>
          <q-separator class="q-my-sm" />
          <div class="text-caption text-grey-7">
            👨‍🏫 Materias con profesor asignado:
            <strong>{{ materiasUbicadas_cjgp.filter((m) => m.id_profesor_cjgp).length }}</strong>
            de {{ materiasUbicadas_cjgp.length }}
            (las restantes pueden asignarse luego en Carreras y Pensums → ver malla)
          </div>
        </q-card>

        <q-stepper-navigation>
          <q-btn flat color="primary" label="Atrás" class="q-mr-sm" @click="paso_cjgp = 3" />
          <q-btn
            color="positive"
            icon="save"
            label="Registrar carrera completa"
            :loading="guardando_cjgp"
            @click="guardarCarrera_cjgp"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<style scoped>
.materia-tarjeta_cjgp {
  border: 1px dashed #b0bec5;
  cursor: grab;
}
.materia-tarjeta_cjgp:active {
  cursor: grabbing;
}
.bloque-zona_cjgp {
  transition: box-shadow 0.15s ease;
}
.bloque-zona_cjgp:hover {
  box-shadow: 0 0 0 2px #90caf9;
}
</style>
