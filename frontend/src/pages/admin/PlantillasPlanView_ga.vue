<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h5 q-my-none text-primary text-weight-bold">
        Plantillas de Plan de Estudio
      </h4>
      <q-btn
        color="primary"
        icon="add"
        label="Nueva Plantilla"
        @click="abrirCreacion_ga"
        unelevated
      />
    </div>

    <!-- Lista de plantillas -->
    <q-table
      :rows="plantillas_ga"
      :columns="columnas_ga"
      row-key="id_plantilla_ga"
      :loading="cargando_ga"
      flat
      bordered
    >
      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <q-chip
            :color="props.row.estado_ga === 'PUBLICADA' ? 'positive' : 'warning'"
            text-color="white"
            size="sm"
            class="text-weight-bold"
          >
            {{ props.row.estado_ga }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-acciones="props">
        <q-td :props="props" class="text-right">
          <!-- Solo editable si está en BORRADOR -->
          <q-btn
            v-if="props.row.estado_ga === 'BORRADOR'"
            flat
            round
            color="primary"
            icon="edit"
            @click="abrirEdicion_ga(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.estado_ga === 'BORRADOR'"
            flat
            round
            color="positive"
            icon="publish"
            @click="publicar_ga(props.row)"
          >
            <q-tooltip>Publicar (Irreversible)</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.estado_ga === 'BORRADOR'"
            flat
            round
            color="negative"
            icon="delete"
            @click="eliminar_ga(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
          
          <q-btn
            v-if="props.row.estado_ga === 'PUBLICADA'"
            flat
            round
            color="info"
            icon="visibility"
            @click="abrirEdicion_ga(props.row, true)"
          >
            <q-tooltip>Ver Detalles</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Modal Formulario Plantilla -->
    <q-dialog v-model="dialogo_ga" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column">
        <q-card-section class="row items-center q-pb-none bg-white text-primary shadow-2 z-top">
          <div class="text-h6 text-weight-bold">
            {{ vistaSoloLectura_ga ? 'Detalle de la' : (plantillaEdicion_ga ? 'Editar' : 'Nueva') }} Plantilla Institucional
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pt-md scroll">
          <div class="row q-col-gutter-md">
            <!-- Datos Generales -->
            <div class="col-12 col-md-6">
              <q-card flat bordered class="q-pa-md h-100">
                <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">Datos Generales</div>
                
                <q-input
                  v-model="formulario_ga.nombre_ga"
                  label="Nombre de la Plantilla *"
                  outlined
                  dense
                  class="q-mb-md"
                  :readonly="vistaSoloLectura_ga"
                />

                <q-select
                  v-model="formulario_ga.id_periodo_ga"
                  :options="periodos_ga"
                  option-value="id_periodo_cjgp"
                  option-label="nombre_cjgp"
                  label="Período Académico *"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="q-mb-md"
                  :readonly="vistaSoloLectura_ga || !!plantillaEdicion_ga"
                />

                <div class="text-subtitle1 text-weight-bold text-primary q-mt-md q-mb-sm">Sistema de Valoración</div>
                
                <div class="q-mb-md">
                  <q-radio v-model="formulario_ga.tipo_valoracion_ga" val="CUANTITATIVO" label="Cuantitativo (Escala Numérica)" :disable="vistaSoloLectura_ga" />
                  <q-radio v-model="formulario_ga.tipo_valoracion_ga" val="CUALITATIVO" label="Cualitativo (Niveles)" :disable="vistaSoloLectura_ga" />
                </div>

                <!-- Config Cuantitativa -->
                <div v-if="formulario_ga.tipo_valoracion_ga === 'CUANTITATIVO'" class="row q-col-gutter-sm bg-blue-grey-1 q-pa-sm rounded-borders">
                  <div class="col-6">
                    <q-input v-model.number="formulario_ga.escala_min_ga" type="number" label="Escala Mínima *" outlined dense :readonly="vistaSoloLectura_ga" />
                  </div>
                  <div class="col-6">
                    <q-input v-model.number="formulario_ga.escala_max_ga" type="number" label="Escala Máxima *" outlined dense :readonly="vistaSoloLectura_ga" />
                  </div>
                  <div class="col-12">
                    <q-toggle v-model="formulario_ga.ponderado_ga" label="Exigir que los indicadores sumen 100% (Ponderado)" :disable="vistaSoloLectura_ga" />
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Niveles Cualitativos -->
            <div class="col-12 col-md-6" v-if="formulario_ga.tipo_valoracion_ga === 'CUALITATIVO'">
              <q-card flat bordered class="q-pa-md h-100">
                <div class="row items-center justify-between q-mb-sm">
                  <div class="text-subtitle1 text-weight-bold text-primary">Niveles de Valoración</div>
                  <q-btn v-if="!vistaSoloLectura_ga" icon="add" size="sm" color="secondary" round flat @click="agregarNivel_ga" />
                </div>
                
                <q-list separator bordered class="rounded-borders">
                  <q-item v-for="(nivel_ga, index) in formulario_ga.niveles_ga" :key="index">
                    <q-item-section avatar>
                      <q-chip color="primary" text-color="white" size="sm">{{ index + 1 }}</q-chip>
                    </q-item-section>
                    <q-item-section>
                      <q-input v-model="nivel_ga.etiqueta_ga" label="Etiqueta (ej. En Proceso) *" dense borderless class="text-weight-bold" :readonly="vistaSoloLectura_ga" />
                      <q-input v-model="nivel_ga.descripcion_ga" label="Descripción (opcional)" dense borderless :readonly="vistaSoloLectura_ga" />
                    </q-item-section>
                    <q-item-section side v-if="!vistaSoloLectura_ga">
                      <q-btn icon="delete" color="negative" flat round dense @click="quitarNivel_ga(index)" />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="formulario_ga.niveles_ga.length === 0">
                    <q-item-section class="text-grey text-center">No hay niveles definidos.</q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
            <div class="col-12 col-md-6" v-else>
              <q-card flat bordered class="q-pa-md h-100 bg-grey-2 flex flex-center">
                <div class="text-grey-7 text-center">
                  <q-icon name="calculate" size="4xl" class="q-mb-sm" /><br>
                  Valoración Cuantitativa Seleccionada.<br>
                  Los profesores asignarán un valor numérico a cada indicador.
                </div>
              </q-card>
            </div>

            <!-- Secciones del Plan -->
            <div class="col-12">
              <q-card flat bordered class="q-pa-md">
                <div class="row items-center justify-between q-mb-md">
                  <div>
                    <div class="text-subtitle1 text-weight-bold text-primary">Estructura del Plan (Secciones)</div>
                    <div class="text-caption text-grey">Define qué apartados deberá llenar el profesor.</div>
                  </div>
                  <q-btn v-if="!vistaSoloLectura_ga" icon="add" label="Agregar Sección" color="secondary" unelevated @click="agregarSeccion_ga" />
                </div>

                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-6 col-lg-4" v-for="(seccion_ga, index) in formulario_ga.secciones_ga" :key="index">
                    <q-card class="bg-blue-grey-1" flat bordered>
                      <q-card-section class="q-pb-none row items-center justify-between">
                        <div class="text-weight-bold text-primary">Sección {{ index + 1 }}</div>
                        <q-btn v-if="!vistaSoloLectura_ga" icon="close" size="sm" flat round color="negative" @click="quitarSeccion_ga(index)" />
                      </q-card-section>
                      <q-card-section>
                        <q-input v-model="seccion_ga.nombre_ga" label="Nombre (ej. Justificación) *" dense outlined class="q-mb-sm bg-white" :readonly="vistaSoloLectura_ga" />
                        <q-select
                          v-model="seccion_ga.tipo_contenido_ga"
                          :options="['TEXTO', 'LISTA', 'ARCHIVO']"
                          label="Tipo de Contenido"
                          dense
                          outlined
                          class="q-mb-sm bg-white"
                          :readonly="vistaSoloLectura_ga"
                        />
                        <q-toggle v-model="seccion_ga.obligatoria_ga" label="Obligatoria" size="sm" :disable="vistaSoloLectura_ga" />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-primary shadow-up-2 q-pa-md" v-if="!vistaSoloLectura_ga">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar Plantilla" @click="guardar_ga" :loading="guardando_ga" unelevated />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerPlantillas_ga,
  crearPlantilla_ga,
  actualizarPlantilla_ga,
  publicarPlantilla_ga,
  eliminarPlantilla_ga,
} from '../../servicios/planEstudioServicio_ga';
import { obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';

const $q = useQuasar();

const plantillas_ga = ref([]);
const periodos_ga = ref([]);
const cargando_ga = ref(true);
const dialogo_ga = ref(false);
const guardando_ga = ref(false);
const plantillaEdicion_ga = ref(null);
const vistaSoloLectura_ga = ref(false);

const columnas_ga = [
  { name: 'periodo', label: 'Período', field: row => row.periodo_ga?.nombre_cjgp, align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre_ga', align: 'left', sortable: true },
  { name: 'valoracion', label: 'Valoración', field: 'tipo_valoracion_ga', align: 'left' },
  { name: 'secciones', label: 'Secciones', field: row => row.secciones_ga?.length || 0, align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estado_ga', align: 'center' },
  { name: 'acciones', label: 'Acciones', align: 'right' },
];

const formulario_ga = ref({
  nombre_ga: '',
  id_periodo_ga: null,
  tipo_valoracion_ga: 'CUANTITATIVO',
  escala_min_ga: 0,
  escala_max_ga: 20,
  ponderado_ga: false,
  secciones_ga: [],
  niveles_ga: [],
});

const cargarDatos_ga = async () => {
  cargando_ga.value = true;
  try {
    [plantillas_ga.value, periodos_ga.value] = await Promise.all([
      obtenerPlantillas_ga(),
      obtenerPeriodos_cjgp(),
    ]);
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar los datos.' });
  } finally {
    cargando_ga.value = false;
  }
};

const abrirCreacion_ga = () => {
  plantillaEdicion_ga.value = null;
  vistaSoloLectura_ga.value = false;
  formulario_ga.value = {
    nombre_ga: 'Plantilla Institucional',
    id_periodo_ga: periodos_ga.value.find(p => p.estado_cjgp === 'ACTIVO')?.id_periodo_cjgp || null,
    tipo_valoracion_ga: 'CUANTITATIVO',
    escala_min_ga: 0,
    escala_max_ga: 20,
    ponderado_ga: false,
    secciones_ga: [
      { nombre_ga: 'Justificación', orden_ga: 1, obligatoria_ga: true, tipo_contenido_ga: 'TEXTO' },
      { nombre_ga: 'Objetivos', orden_ga: 2, obligatoria_ga: true, tipo_contenido_ga: 'LISTA' },
    ],
    niveles_ga: [
      { etiqueta_ga: 'Iniciado', descripcion_ga: '', orden_ga: 1 },
      { etiqueta_ga: 'En Proceso', descripcion_ga: '', orden_ga: 2 },
      { etiqueta_ga: 'Consolidado', descripcion_ga: '', orden_ga: 3 },
    ],
  };
  dialogo_ga.value = true;
};

const abrirEdicion_ga = (plantilla_ga, soloLectura = false) => {
  plantillaEdicion_ga.value = plantilla_ga;
  vistaSoloLectura_ga.value = soloLectura;
  formulario_ga.value = {
    nombre_ga: plantilla_ga.nombre_ga,
    id_periodo_ga: plantilla_ga.id_periodo_ga,
    tipo_valoracion_ga: plantilla_ga.tipo_valoracion_ga,
    escala_min_ga: plantilla_ga.escala_min_ga != null ? Number(plantilla_ga.escala_min_ga) : 0,
    escala_max_ga: plantilla_ga.escala_max_ga != null ? Number(plantilla_ga.escala_max_ga) : 20,
    ponderado_ga: plantilla_ga.ponderado_ga,
    secciones_ga: plantilla_ga.secciones_ga.map(s => ({ ...s })),
    niveles_ga: plantilla_ga.niveles_ga ? plantilla_ga.niveles_ga.map(n => ({ ...n })) : [],
  };
  dialogo_ga.value = true;
};

const agregarSeccion_ga = () => {
  formulario_ga.value.secciones_ga.push({
    nombre_ga: '',
    orden_ga: formulario_ga.value.secciones_ga.length + 1,
    obligatoria_ga: true,
    tipo_contenido_ga: 'TEXTO',
  });
};

const quitarSeccion_ga = (index) => {
  formulario_ga.value.secciones_ga.splice(index, 1);
  formulario_ga.value.secciones_ga.forEach((s, i) => s.orden_ga = i + 1);
};

const agregarNivel_ga = () => {
  formulario_ga.value.niveles_ga.push({
    etiqueta_ga: '',
    descripcion_ga: '',
    orden_ga: formulario_ga.value.niveles_ga.length + 1,
  });
};

const quitarNivel_ga = (index) => {
  formulario_ga.value.niveles_ga.splice(index, 1);
  formulario_ga.value.niveles_ga.forEach((n, i) => n.orden_ga = i + 1);
};

const guardar_ga = async () => {
  if (!formulario_ga.value.nombre_ga.trim() || !formulario_ga.value.id_periodo_ga) {
    return $q.notify({ type: 'warning', message: 'Complete los campos obligatorios.' });
  }
  if (formulario_ga.value.secciones_ga.length === 0) {
    return $q.notify({ type: 'warning', message: 'Agregue al menos una sección.' });
  }
  
  if (formulario_ga.value.tipo_valoracion_ga === 'CUALITATIVO' && formulario_ga.value.niveles_ga.length === 0) {
    return $q.notify({ type: 'warning', message: 'Agregue al menos un nivel cualitativo.' });
  }

  guardando_ga.value = true;
  let res_ga;

  const payload = {
    ...formulario_ga.value,
    escala_min_ga: formulario_ga.value.tipo_valoracion_ga === 'CUANTITATIVO' ? formulario_ga.value.escala_min_ga : null,
    escala_max_ga: formulario_ga.value.tipo_valoracion_ga === 'CUANTITATIVO' ? formulario_ga.value.escala_max_ga : null,
  };

  if (plantillaEdicion_ga.value) {
    res_ga = await actualizarPlantilla_ga(plantillaEdicion_ga.value.id_plantilla_ga, payload);
  } else {
    res_ga = await crearPlantilla_ga(payload);
  }

  guardando_ga.value = false;

  if (res_ga.exito) {
    $q.notify({ type: 'positive', message: res_ga.mensaje });
    dialogo_ga.value = false;
    cargarDatos_ga();
  } else {
    $q.notify({ type: 'negative', message: res_ga.mensaje });
  }
};

const publicar_ga = (plantilla_ga) => {
  $q.dialog({
    title: 'Publicar Plantilla',
    message: `¿Seguro que deseas publicar "${plantilla_ga.nombre_ga}"? Una vez publicada, los profesores podrán usarla y no podrás modificar su estructura.`,
    cancel: true,
    persistent: true,
    ok: { color: 'positive', label: 'Sí, Publicar' },
  }).onOk(async () => {
    const res_ga = await publicarPlantilla_ga(plantilla_ga.id_plantilla_ga);
    if (res_ga.exito) {
      $q.notify({ type: 'positive', message: res_ga.mensaje });
      cargarDatos_ga();
    } else {
      $q.notify({ type: 'negative', message: res_ga.mensaje });
    }
  });
};

const eliminar_ga = (plantilla_ga) => {
  $q.dialog({
    title: 'Eliminar Plantilla',
    message: `¿Eliminar la plantilla "${plantilla_ga.nombre_ga}" permanentemente?`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Eliminar' },
  }).onOk(async () => {
    const res_ga = await eliminarPlantilla_ga(plantilla_ga.id_plantilla_ga);
    if (res_ga.exito) {
      $q.notify({ type: 'positive', message: res_ga.mensaje });
      cargarDatos_ga();
    } else {
      $q.notify({ type: 'negative', message: res_ga.mensaje });
    }
  });
};

onMounted(cargarDatos_ga);
</script>
