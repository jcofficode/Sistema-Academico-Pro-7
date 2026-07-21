<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <h4 class="text-h5 q-my-none text-primary text-weight-bold">
        Elaborar Plan de Estudio
      </h4>
    </div>

    <!-- Selección de Materia y Período -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            v-model="filtro_ga.id_periodo_ga"
            :options="periodos_ga"
            option-value="id_periodo_cjgp"
            option-label="nombre_cjgp"
            label="Período Académico"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="cargarPlanes_ga"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            v-model="filtro_ga.id_materia_ga"
            :options="materias_ga"
            option-value="id_materia_cjgp"
            option-label="nombre_cjgp"
            label="Materia Asignada"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="iniciarPlan_ga"
            :disable="!filtro_ga.id_periodo_ga || cargandoPlantilla_ga"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.codigo_cjgp }} - {{ scope.opt.nombre_cjgp }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.carrera_cjgp?.nombre_cjgp }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </div>
    </q-card>

    <div v-if="cargandoPlantilla_ga" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey q-mt-md">Cargando formato institucional...</div>
    </div>

    <div v-else-if="!plantilla_ga && filtro_ga.id_materia_ga" class="text-center q-pa-xl">
      <q-icon name="warning" size="4xl" color="warning" class="q-mb-md" />
      <div class="text-h6">No hay formato disponible</div>
      <div class="text-grey">La coordinación aún no ha publicado la plantilla de planificación para este período.</div>
    </div>

    <!-- Formulario Dinámico (Metadatos) -->
    <template v-else-if="plantilla_ga && planActual_ga">
      <!-- Status del Plan -->
      <div class="row items-center q-mb-md">
        <div class="text-subtitle1 text-weight-bold q-mr-md">Estado del Plan:</div>
        <q-chip
          :color="colorEstado_ga(planActual_ga.estado_ga)"
          text-color="white"
          class="text-weight-bold"
        >
          {{ planActual_ga.estado_ga }}
        </q-chip>
        <q-space />
        <q-btn
          v-if="['BORRADOR', 'DEVUELTO'].includes(planActual_ga.estado_ga)"
          color="secondary"
          icon="save"
          label="Guardar Borrador"
          @click="guardarPlan_ga(false)"
          :loading="guardando_ga"
          class="q-mr-sm"
          unelevated
        />
        <q-btn
          v-if="['BORRADOR', 'DEVUELTO'].includes(planActual_ga.estado_ga)"
          color="positive"
          icon="send"
          label="Entregar a Coordinación"
          @click="entregarPlanConfirmar_ga"
          :loading="guardando_ga"
          unelevated
        />
        <q-btn
          v-if="['APROBADO', 'ENTREGADO'].includes(planActual_ga.estado_ga)"
          color="info"
          icon="print"
          label="Imprimir PDF"
          @click="imprimirPdf_ga(planActual_ga.id_plan_estudio_ga)"
          unelevated
        />
      </div>

      <!-- Observación si fue devuelto -->
      <q-banner v-if="planActual_ga.estado_ga === 'DEVUELTO'" class="bg-negative text-white q-mb-md rounded-borders">
        <template v-slot:avatar>
          <q-icon name="error_outline" />
        </template>
        <div class="text-weight-bold">Plan devuelto por coordinación:</div>
        <div>{{ observacionDevolucion_ga }}</div>
      </q-banner>

      <div class="row q-col-gutter-md">
        <!-- 1. Secciones Dinámicas -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="h-100">
            <q-card-section class="bg-grey-2">
              <div class="text-subtitle1 text-weight-bold text-primary">Información General</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div v-for="seccion in plantilla_ga.secciones_ga" :key="seccion.id_seccion_ga" class="q-mb-md">
                <div class="row items-center q-mb-xs">
                  <div class="text-weight-bold">{{ seccion.nombre_ga }}</div>
                  <q-chip v-if="seccion.obligatoria_ga" size="xs" color="negative" text-color="white" class="q-ml-sm">Obligatorio</q-chip>
                </div>
                
                <q-input
                  v-if="seccion.tipo_contenido_ga === 'TEXTO'"
                  v-model="obtenerContenido_ga(seccion.id_seccion_ga).texto_ga"
                  type="textarea"
                  outlined
                  dense
                  rows="3"
                  :readonly="soloLectura_ga"
                />
                <q-input
                  v-else-if="seccion.tipo_contenido_ga === 'LISTA'"
                  v-model="obtenerContenido_ga(seccion.id_seccion_ga).texto_ga"
                  type="textarea"
                  outlined
                  dense
                  rows="3"
                  placeholder="Ingrese un elemento por línea"
                  :readonly="soloLectura_ga"
                />
                <div v-else class="text-grey italic">
                  (Subida de archivos en desarrollo)
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 2. Cronograma y Unidades -->
        <div class="col-12 col-md-8">
          <q-card flat bordered class="h-100">
            <q-card-section class="bg-grey-2 row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-primary">Cronograma y Unidades</div>
              <q-btn v-if="!soloLectura_ga" icon="add" label="Agregar Unidad" color="secondary" size="sm" @click="agregarUnidad_ga" unelevated />
            </q-card-section>
            <q-separator />
            
            <q-list separator>
              <q-expansion-item
                v-for="(unidad, indexU) in formulario_ga.unidades_ga"
                :key="indexU"
                icon="view_timeline"
                :label="unidad.nombre_ga || `Unidad ${indexU + 1}`"
                :caption="`${unidad.fecha_inicio_ga} a ${unidad.fecha_fin_ga}`"
                header-class="bg-blue-grey-1 text-weight-bold"
                default-opened
              >
                <q-card>
                  <q-card-section>
                    <div class="row q-col-gutter-sm q-mb-md items-end">
                      <div class="col-12 col-md-4">
                        <q-input v-model="unidad.nombre_ga" label="Nombre de Unidad/Tema *" outlined dense :readonly="soloLectura_ga" />
                      </div>
                      <div class="col-6 col-md-3">
                        <q-input v-model="unidad.fecha_inicio_ga" type="date" label="Inicio *" outlined dense :readonly="soloLectura_ga" />
                      </div>
                      <div class="col-6 col-md-3">
                        <q-input v-model="unidad.fecha_fin_ga" type="date" label="Fin *" outlined dense :readonly="soloLectura_ga" />
                      </div>
                      <div class="col-12 col-md-2 text-right">
                        <q-btn v-if="!soloLectura_ga" icon="delete" color="negative" flat dense @click="quitarUnidad_ga(indexU)">
                          <q-tooltip>Eliminar Unidad</q-tooltip>
                        </q-btn>
                      </div>
                    </div>

                    <!-- Indicadores -->
                    <div class="bg-grey-1 q-pa-sm rounded-borders">
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="text-weight-bold text-secondary">Indicadores de Logro</div>
                        <q-btn v-if="!soloLectura_ga" icon="add" size="sm" color="primary" flat @click="agregarIndicador_ga(indexU)">Añadir Indicador</q-btn>
                      </div>
                      
                      <div v-for="(indicador, indexI) in unidad.indicadores_ga" :key="indexI" class="row q-col-gutter-sm q-mb-xs items-center">
                        <div class="col-1">
                          <q-chip size="sm" color="grey-4">{{ indexI + 1 }}</q-chip>
                        </div>
                        <div class="col">
                          <q-input v-model="indicador.descripcion_ga" label="Descripción del indicador" dense outlined :readonly="soloLectura_ga" />
                        </div>
                        
                        <!-- Valoración Cuantitativa -->
                        <div class="col-3" v-if="plantilla_ga.tipo_valoracion_ga === 'CUANTITATIVO'">
                          <q-input
                            v-model.number="indicador.valor_ga"
                            type="number"
                            :label="plantilla_ga.ponderado_ga ? 'Peso (%)' : 'Valor'"
                            dense
                            outlined
                            :readonly="soloLectura_ga"
                          />
                        </div>
                        
                        <!-- Valoración Cualitativa -->
                        <div class="col-3" v-else>
                          <q-select
                            v-model="indicador.id_nivel_ga"
                            :options="plantilla_ga.niveles_ga"
                            option-value="id_nivel_ga"
                            option-label="etiqueta_ga"
                            label="Nivel"
                            dense
                            outlined
                            emit-value
                            map-options
                            :readonly="soloLectura_ga"
                          />
                        </div>

                        <div class="col-1 text-right" v-if="!soloLectura_ga">
                          <q-btn icon="close" color="negative" size="sm" flat round @click="quitarIndicador_ga(indexU, indexI)" />
                        </div>
                      </div>
                      <div v-if="!unidad.indicadores_ga || unidad.indicadores_ga.length === 0" class="text-caption text-grey text-center q-my-sm">
                        No hay indicadores definidos para esta unidad.
                      </div>
                    </div>

                  </q-card-section>
                </q-card>
              </q-expansion-item>
              
              <q-item v-if="formulario_ga.unidades_ga.length === 0">
                <q-item-section class="text-center text-grey q-pa-md">
                  Agregue unidades temáticas para formar el cronograma.
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { obtenerMisMateriasProfesor_cjgp, obtenerPeriodos_cjgp } from '../../servicios/academicoServicio_cjgp';
import {
  obtenerPlantillaVigente_ga,
  obtenerMisPlanes_ga,
  crearPlan_ga,
  actualizarPlan_ga,
  entregarPlan_ga,
  descargarPlanPdf_ga
} from '../../servicios/planEstudioServicio_ga';

const $q = useQuasar();

const periodos_ga = ref([]);
const materias_ga = ref([]);
const planes_ga = ref([]);
const plantilla_ga = ref(null);
const planActual_ga = ref(null);

const cargandoPlantilla_ga = ref(false);
const guardando_ga = ref(false);

const filtro_ga = ref({
  id_periodo_ga: null,
  id_materia_ga: null,
});

const formulario_ga = ref({
  contenidos_ga: [],
  unidades_ga: [],
});

const soloLectura_ga = computed(() => {
  return planActual_ga.value && !['BORRADOR', 'DEVUELTO'].includes(planActual_ga.value.estado_ga);
});

const observacionDevolucion_ga = computed(() => {
  if (planActual_ga.value?.estado_ga !== 'DEVUELTO') return '';
  const rev = planActual_ga.value.revisiones_ga?.find(r => r.accion_ga === 'DEVUELTO');
  return rev ? rev.observacion_ga : 'Revisar observaciones en bandeja.';
});

const colorEstado_ga = (estado) => {
  switch (estado) {
    case 'APROBADO': return 'positive';
    case 'ENTREGADO': return 'info';
    case 'DEVUELTO': return 'negative';
    default: return 'grey';
  }
};

const cargarInicial_ga = async () => {
  try {
    [periodos_ga.value, materias_ga.value] = await Promise.all([
      obtenerPeriodos_cjgp(),
      obtenerMisMateriasProfesor_cjgp(),
    ]);
    
    // Seleccionar período activo por defecto
    const activo = periodos_ga.value.find(p => p.estado_cjgp === 'ACTIVO');
    if (activo) {
      filtro_ga.value.id_periodo_ga = activo.id_periodo_cjgp;
      await cargarPlanes_ga();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Error cargando datos iniciales.' });
  }
};

const cargarPlanes_ga = async () => {
  if (!filtro_ga.value.id_periodo_ga) return;
  try {
    planes_ga.value = await obtenerMisPlanes_ga(filtro_ga.value.id_periodo_ga);
    if (filtro_ga.value.id_materia_ga) {
      await iniciarPlan_ga();
    }
  } catch (error) {
    console.error(error);
  }
};

const iniciarPlan_ga = async () => {
  if (!filtro_ga.value.id_periodo_ga || !filtro_ga.value.id_materia_ga) return;
  
  cargandoPlantilla_ga.value = true;
  plantilla_ga.value = null;
  planActual_ga.value = null;

  try {
    // Buscar si ya existe un plan
    const planExistente = planes_ga.value.find(p => p.id_materia_ga === filtro_ga.value.id_materia_ga);
    
    // Obtener plantilla vigente
    plantilla_ga.value = await obtenerPlantillaVigente_ga(filtro_ga.value.id_periodo_ga);

    if (planExistente) {
      planActual_ga.value = planExistente;
      
      // Mapear a formulario
      formulario_ga.value.contenidos_ga = plantilla_ga.value.secciones_ga.map(sec => {
        const existente = planExistente.contenidos_ga.find(c => c.id_seccion_contenido_ga === sec.id_seccion_ga);
        return {
          id_seccion_ga: sec.id_seccion_ga,
          texto_ga: existente ? existente.texto_ga : ''
        };
      });
      
      formulario_ga.value.unidades_ga = planExistente.unidades_ga.map(u => ({
        nombre_ga: u.nombre_ga,
        orden_ga: u.orden_ga,
        fecha_inicio_ga: u.fecha_inicio_ga.slice(0, 10),
        fecha_fin_ga: u.fecha_fin_ga.slice(0, 10),
        indicadores_ga: u.indicadores_ga.map(i => ({
          descripcion_ga: i.descripcion_ga,
          orden_ga: i.orden_ga,
          valor_ga: i.valor_ga != null ? Number(i.valor_ga) : null,
          id_nivel_ga: i.id_nivel_ga,
        }))
      }));
    } else {
      // Plan nuevo (inicializado virtualmente en UI)
      planActual_ga.value = { estado_ga: 'BORRADOR', isNew: true };
      
      formulario_ga.value.contenidos_ga = plantilla_ga.value.secciones_ga.map(sec => ({
        id_seccion_ga: sec.id_seccion_ga,
        texto_ga: ''
      }));
      
      formulario_ga.value.unidades_ga = [];
    }

  } catch (error) {
    if (error.response?.status === 400) {
      // Plantilla no encontrada
      plantilla_ga.value = null;
    } else {
      $q.notify({ type: 'negative', message: 'Error al cargar la estructura del plan.' });
    }
  } finally {
    cargandoPlantilla_ga.value = false;
  }
};

const obtenerContenido_ga = (idSeccion) => {
  return formulario_ga.value.contenidos_ga.find(c => c.id_seccion_ga === idSeccion) || {};
};

const agregarUnidad_ga = () => {
  formulario_ga.value.unidades_ga.push({
    nombre_ga: '',
    orden_ga: formulario_ga.value.unidades_ga.length + 1,
    fecha_inicio_ga: '',
    fecha_fin_ga: '',
    indicadores_ga: []
  });
};

const quitarUnidad_ga = (index) => {
  formulario_ga.value.unidades_ga.splice(index, 1);
  formulario_ga.value.unidades_ga.forEach((u, i) => u.orden_ga = i + 1);
};

const agregarIndicador_ga = (unidadIndex) => {
  const unidad = formulario_ga.value.unidades_ga[unidadIndex];
  unidad.indicadores_ga.push({
    descripcion_ga: '',
    orden_ga: unidad.indicadores_ga.length + 1,
    valor_ga: null,
    id_nivel_ga: null
  });
};

const quitarIndicador_ga = (unidadIndex, indIndex) => {
  const unidad = formulario_ga.value.unidades_ga[unidadIndex];
  unidad.indicadores_ga.splice(indIndex, 1);
  unidad.indicadores_ga.forEach((ind, i) => ind.orden_ga = i + 1);
};

const guardarPlan_ga = async (silencioso = false) => {
  guardando_ga.value = true;
  
  const payload = {
    id_materia_ga: filtro_ga.value.id_materia_ga,
    id_periodo_ga: filtro_ga.value.id_periodo_ga,
    contenidos_ga: formulario_ga.value.contenidos_ga,
    unidades_ga: formulario_ga.value.unidades_ga
  };

  let res;
  if (planActual_ga.value.isNew) {
    res = await crearPlan_ga(payload);
  } else {
    res = await actualizarPlan_ga(planActual_ga.value.id_plan_estudio_ga, payload);
  }

  guardando_ga.value = false;

  if (res.exito) {
    if (!silencioso) $q.notify({ type: 'positive', message: res.mensaje });
    await cargarPlanes_ga(); // Recarga e hidrata
  } else {
    $q.notify({ type: 'negative', message: res.mensaje });
  }
  return res.exito;
};

const entregarPlanConfirmar_ga = () => {
  $q.dialog({
    title: 'Entregar Plan',
    message: '¿Estás seguro de entregar el plan? Ya no podrás editarlo a menos que la coordinación te lo devuelva con observaciones.',
    cancel: true,
    persistent: true,
    ok: { color: 'positive', label: 'Sí, Entregar' }
  }).onOk(async () => {
    // Primero guardamos
    const guardado = await guardarPlan_ga(true);
    if (!guardado) return;

    guardando_ga.value = true;
    const res = await entregarPlan_ga(planActual_ga.value.id_plan_estudio_ga);
    guardando_ga.value = false;

    if (res.exito) {
      $q.notify({ type: 'positive', message: res.mensaje });
      await cargarPlanes_ga();
    } else {
      $q.notify({ type: 'negative', message: res.mensaje });
    }
  });
};

const imprimirPdf_ga = async (id) => {
  $q.notify({ type: 'info', message: 'Generando PDF...' });
  await descargarPlanPdf_ga(id);
};

onMounted(cargarInicial_ga);
</script>
