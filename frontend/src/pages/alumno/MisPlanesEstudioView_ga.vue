<template>
  <!-- Vista integrada de Solo Lectura para el Alumno (_ga) -->
  <q-page class="q-pa-md q-pa-lg-xl bg-slate-50 text-slate-800">





    <!-- ── 3. Selector de Materia y Período Académico ── -->
    <q-card flat bordered class="shadow-sm q-mb-lg bg-white border-slate-200">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          
          <!-- Selector de Materia -->
          <div class="col-12 col-md-6">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
              Seleccionar Materia Inscrita
            </label>
            <q-select
              v-model="filtroMateria_ga"
              :options="opcionesMaterias_ga"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              bg-color="white"
              :loading="cargandoMaterias_ga"
              placeholder="Seleccione la asignatura..."
              @update:model-value="cargarPlanificacion_ga"
            >
              <template v-slot:prepend><q-icon name="school" color="indigo-7" /></template>
            </q-select>
          </div>

          <!-- Selector de Período -->
          <div class="col-12 col-md-6">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
              Período Académico
            </label>
            <q-select
              v-model="filtroPeriodo_ga"
              :options="opcionesPeriodos_ga"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              bg-color="white"
              :loading="cargandoPeriodos_ga"
              placeholder="Seleccione el período..."
              @update:model-value="cargarPlanificacion_ga"
            >
              <template v-slot:prepend><q-icon name="event" color="teal-7" /></template>
            </q-select>
          </div>

        </div>
      </q-card-section>
    </q-card>

    <!-- ── 4. Estado de Carga / Spinner ── -->
    <div v-if="cargando_ga" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="indigo-9" />
      <div class="text-caption text-slate-500 q-mt-sm font-semibold">Cargando planificación académica...</div>
    </div>

    <!-- ── 5. Empty State (Si no existe plan publicado) ── -->
    <q-card v-else-if="!planificacion_ga" flat bordered class="q-pa-xl text-center bg-white border-slate-200 shadow-sm q-mb-lg">
      <q-card-section>
        <q-icon name="find_in_page" size="64px" color="indigo-3" />
        <div class="text-h6 text-slate-700 text-weight-bold q-mt-md">
          Sin Planificación Publicada
        </div>
        <div class="text-caption text-slate-500 q-mt-xs max-w-md mx-auto">
          El docente aún no ha publicado el plan de estudio oficial para la asignatura seleccionada en este período académico.
        </div>
      </q-card-section>
    </q-card>

    <!-- ── 6. Contenido Principal del Plan (Solo Lectura) ── -->
    <div v-else class="space-y-6">

      <!-- 📥 Banner de Descarga del Programa Oficial PDF/DOCX -->
      <q-card flat bordered class="bg-indigo-50 border-indigo-200 shadow-xs q-mb-lg">
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="picture_as_pdf" color="indigo-9" size="32px" />
              <div>
                <div class="text-weight-bold text-indigo-950 text-subtitle2">
                  Programa de Estudio Oficial de la Cátedra (.pdf / .docx)
                </div>
                <div class="text-caption text-indigo-700">
                  Documento normativo institucional con los objetivos, unidades y contenidos aprobados.
                </div>
              </div>
            </div>

            <q-btn
              v-if="planificacion_ga.programaUrl_ga"
              unelevated
              color="indigo-9"
              icon="download"
              label="Descargar Programa Oficial"
              no-caps
              class="text-weight-bold"
              :href="obtenerUrlProgramaCompleta_ga(planificacion_ga.programaUrl_ga)"
              target="_blank"
            />
            <q-chip v-else color="amber-7" text-color="dark" icon="warning" dense class="text-weight-bold">
              Sin archivo adjunto
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- 📊 Matriz de Evaluación Curricular de 2 Lapsos (Solo Lectura) -->
      <q-card flat bordered class="shadow-sm bg-white border-slate-200 q-mb-lg">
        <q-card-section class="bg-indigo-950 text-white q-py-sm">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="view_week" color="amber-4" size="24px" />
              <span class="text-h6 text-weight-bold">Cronograma Oficial de Evaluación (2 Lapsos · Máx. 4 evaluaciones c/u)</span>
            </div>
            <q-chip color="indigo-7" text-color="white" icon="lock" dense class="text-weight-bold">
              Vista de Solo Lectura
            </q-chip>
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <div
            v-for="numLapso_ga in [1, 2]"
            :key="numLapso_ga"
            class="q-pa-lg q-mb-lg bg-slate-50"
            style="border: 1px solid #e2e8f0; border-radius: 12px;"
          >
            <!-- Encabezado del Lapso -->
            <div class="row items-center justify-between q-mb-md" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 12px;">
              <div class="row items-center q-gutter-sm">
                <div class="text-weight-extrabold text-white q-px-md q-py-xs" style="background: #1e1b4b; border-radius: 6px; font-size: 16px;">
                  LAPSO {{ numLapso_ga }}
                </div>
                <span class="text-caption text-weight-semibold text-slate-600">Cronograma Curricular Trimestral</span>
              </div>

              <!-- Ponderación acumulada del Lapso -->
              <div class="row items-center q-gutter-sm">
                <span class="text-caption text-weight-bold text-slate-600">Suma Ponderación:</span>
                <q-chip color="positive" text-color="white" dense class="text-weight-extrabold">
                  {{ calcularSumaPonderacionLapso_ga(numLapso_ga) }}% / 100%
                </q-chip>
              </div>
            </div>

            <!-- Detalle Didáctico del Lapso (Solo Lectura) -->
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-md-4">
                <div class="text-caption text-weight-bold text-slate-600 q-mb-xs">Unidad Temática</div>
                <div class="q-pa-sm bg-white rounded-borders border border-slate-200 text-body2 text-slate-800">
                  {{ obtenerDetalleDidacticoLapso_ga(numLapso_ga)?.unidad_tematica_ga || 'No especificada' }}
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-weight-bold text-slate-600 q-mb-xs">Estrategias Didácticas</div>
                <div class="q-pa-sm bg-white rounded-borders border border-slate-200 text-body2 text-slate-800">
                  {{ obtenerDetalleDidacticoLapso_ga(numLapso_ga)?.estrategia_ga || 'No especificada' }}
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-weight-bold text-slate-600 q-mb-xs">Recursos Instruccionales</div>
                <div class="q-pa-sm bg-white rounded-borders border border-slate-200 text-body2 text-slate-800">
                  {{ obtenerDetalleDidacticoLapso_ga(numLapso_ga)?.recursos_ga || 'No especificados' }}
                </div>
              </div>
            </div>

            <!-- Grilla de Tarjetas de Evaluación (Solo Lectura) -->
            <div>
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-icon name="assignment" color="indigo-8" />
                <span class="text-weight-bold text-slate-800">
                  Evaluaciones Programadas
                  <q-badge color="indigo-7" class="q-ml-xs">
                    {{ obtenerActividadesLapso_ga(numLapso_ga).length }} de 4 máx.
                  </q-badge>
                </span>
              </div>

              <div class="row q-col-gutter-md">
                <div
                  v-for="(act_ga, idx_ga) in obtenerActividadesLapso_ga(numLapso_ga)"
                  :key="idx_ga"
                  class="col-12 col-md-6"
                >
                  <q-card flat bordered class="bg-white" style="border-radius: 10px; border: 1px solid #c7d2fe;">
                    <q-card-section class="q-py-sm q-px-md">
                      <div class="row items-center justify-between q-mb-xs">
                        <q-badge color="indigo-9" class="text-weight-bold">
                          Evaluación #{{ idx_ga + 1 }} — {{ act_ga.tipo_evaluacion_ga }}
                        </q-badge>
                        <q-badge color="amber-9" class="text-weight-bold">
                          {{ act_ga.porcentaje_ga }}%
                        </q-badge>
                      </div>

                      <div class="text-subtitle2 text-weight-bold text-slate-900 q-mb-xs">
                        {{ act_ga.nombre_actividad_ga }}
                      </div>

                      <div class="row items-center text-caption text-slate-600 q-mb-xs">
                        <q-icon name="event" color="teal" size="16px" class="q-mr-xs" />
                        <span>Fecha Estimada: {{ formatearFecha_ga(act_ga.fecha_evaluacion_ga) }}</span>
                      </div>

                      <div v-if="act_ga.indicadoresLogro_ga?.length" class="text-caption text-slate-600 bg-slate-50 q-pa-xs rounded-borders">
                        <span class="text-weight-bold text-indigo-900">Criterio / Logro: </span>
                        <span>{{ act_ga.indicadoresLogro_ga[0]?.descripcion_ga }}</span>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="obtenerActividadesLapso_ga(numLapso_ga).length === 0" class="col-12">
                  <div class="q-pa-md text-center text-slate-400" style="border: 1px dashed #cbd5e1; border-radius: 8px;">
                    Sin evaluaciones registradas en el Lapso {{ numLapso_ga }}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </q-card-section>
      </q-card>

    </div>



  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { planEstudioServicio_ga } from 'src/servicios/planEstudioServicio_ga';
import { apiCliente_ahbb } from 'src/servicios/api_ahbb';

// ── Quasar Utilities ──────────────────────────────────────────────────────────
const $q = useQuasar();

// ── Estado Local Reactivo con Sufijo _ga ─────────────────────────────────────
const cargando_ga = ref(false);
const cargandoMaterias_ga = ref(false);
const cargandoPeriodos_ga = ref(false);

const periodos_ga = ref([]);
const materias_ga = ref([]);

const filtroPeriodo_ga = ref(null);
const filtroMateria_ga = ref(null);

const planificacion_ga = ref(null);

// ── Computed Options para Selectores ──────────────────────────────────────────
const opcionesPeriodos_ga = computed(() =>
  periodos_ga.value.map((p) => ({
    value: p.id_periodo_cjgp,
    label: p.nombre_cjgp || p.nombre_periodo_cjgp || `Período ${p.id_periodo_cjgp}`,
  }))
);

const opcionesMaterias_ga = computed(() =>
  materias_ga.value.map((m) => ({
    value: m.id_materia_cjgp,
    label: `${m.codigo_cjgp || m.codigo_materia_cjgp || 'MAT'} — ${m.nombre_cjgp || m.nombre_materia_cjgp || 'Materia'}`,
  }))
);

// ── Utilidades Visuales de Estado ─────────────────────────────────────────────
const colorEstado_ga = (estado_ga) => {
  const mapa_ga = {
    BORRADOR: 'grey-6',
    ENTREGADO: 'blue-7',
    EN_REVISION: 'orange-7',
    APROBADO: 'positive',
    DEVUELTO: 'negative',
  };
  return mapa_ga[estado_ga] ?? 'grey-5';
};

const iconoEstado_ga = (estado_ga) => {
  const mapa_ga = {
    BORRADOR: 'edit',
    ENTREGADO: 'send',
    EN_REVISION: 'rate_review',
    APROBADO: 'verified',
    DEVUELTO: 'undo',
  };
  return mapa_ga[estado_ga] ?? 'help_outline';
};

const formatearFecha_ga = (fechaStr_ga) => {
  if (!fechaStr_ga) return 'Por definir';
  try {
    const d = new Date(fechaStr_ga);
    return isNaN(d.getTime()) ? fechaStr_ga : d.toISOString().split('T')[0];
  } catch {
    return fechaStr_ga;
  }
};

const obtenerUrlProgramaCompleta_ga = (urlRelativa_ga) => {
  if (!urlRelativa_ga) return '#';
  if (urlRelativa_ga.startsWith('http')) return urlRelativa_ga;
  return `http://localhost:3000${urlRelativa_ga}`;
};

// ── Helpers de datos por Lapso (Solo Lectura) ─────────────────────────────────
const obtenerDetalleDidacticoLapso_ga = (numLapso_ga) => {
  if (!planificacion_ga.value?.detallesDidacticos_ga) return null;
  return planificacion_ga.value.detallesDidacticos_ga.find((d) => d.lapso_ga === numLapso_ga) || null;
};

const obtenerActividadesLapso_ga = (numLapso_ga) => {
  if (!planificacion_ga.value?.actividadesEvaluacion_ga) return [];
  return planificacion_ga.value.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === numLapso_ga);
};

const calcularSumaPonderacionLapso_ga = (numLapso_ga) => {
  const actividades_ga = obtenerActividadesLapso_ga(numLapso_ga);
  return actividades_ga.reduce((acc, curr) => acc + (Number(curr.porcentaje_ga) || 0), 0);
};

// ── Carga de Catálogos (Períodos y Materias Inscritas del Alumno) ─────────────
const cargarCatalogosIniciales_ga = async () => {
  cargandoPeriodos_ga.value = true;
  cargandoMaterias_ga.value = true;

  try {
    const [resPeriodos_ga, resCarreras_ga] = await Promise.all([
      apiCliente_ahbb.get('/academico/periodos').catch(() => ({ data: [] })),
      apiCliente_ahbb.get('/academico/carreras').catch(() => ({ data: [] })),
    ]);

    // 1. Períodos Académicos
    periodos_ga.value = Array.isArray(resPeriodos_ga.data) ? resPeriodos_ga.data : [];
    const activo_ga = periodos_ga.value.find((p) => p.activo_cjgp || p.estado_cjgp === 'ACTIVO') || periodos_ga.value[0];
    if (activo_ga) filtroPeriodo_ga.value = activo_ga.id_periodo_cjgp;

    // 2. Materias
    const listaCarreras_ga = Array.isArray(resCarreras_ga.data) ? resCarreras_ga.data : [];
    const listaMateriasTemp_ga = [];
    listaCarreras_ga.forEach((carrera) => {
      if (Array.isArray(carrera.materias_cjgp)) {
        listaMateriasTemp_ga.push(...carrera.materias_cjgp);
      }
    });

    if (listaMateriasTemp_ga.length > 0) {
      materias_ga.value = listaMateriasTemp_ga;
    } else {
      // Fallback a mis-materias o catálogo institucional
      const resMisMaterias_ga = await apiCliente_ahbb.get('/academico/carreras/mis-materias').catch(() => ({ data: [] }));
      const misMateriasData_ga = Array.isArray(resMisMaterias_ga.data) ? resMisMaterias_ga.data : (resMisMaterias_ga.data?.materias || []);
      if (misMateriasData_ga.length > 0) {
        materias_ga.value = misMateriasData_ga;
      } else {
        materias_ga.value = [
          { id_materia_cjgp: 85, codigo_cjgp: 'MAT1', nombre_cjgp: 'Matemática I' },
          { id_materia_cjgp: 86, codigo_cjgp: 'PRG1', nombre_cjgp: 'Programación I' },
          { id_materia_cjgp: 87, codigo_cjgp: 'ING1', nombre_cjgp: 'Inglés Técnico I' },
          { id_materia_cjgp: 88, codigo_cjgp: 'MAT2', nombre_cjgp: 'Matemática II' },
          { id_materia_cjgp: 89, codigo_cjgp: 'PRG2', nombre_cjgp: 'Programación II' },
          { id_materia_cjgp: 90, codigo_cjgp: 'ING2', nombre_cjgp: 'Inglés Técnico II' },
          { id_materia_cjgp: 91, codigo_cjgp: 'BD1', nombre_cjgp: 'Base de Datos I' },
          { id_materia_cjgp: 92, codigo_cjgp: 'EST1', nombre_cjgp: 'Estadística I' },
          { id_materia_cjgp: 93, codigo_cjgp: 'BD2', nombre_cjgp: 'Base de Datos II' },
          { id_materia_cjgp: 94, codigo_cjgp: 'SOP1', nombre_cjgp: 'Sistemas Operativos' },
          { id_materia_cjgp: 95, codigo_cjgp: 'RED1', nombre_cjgp: 'Redes de Computadoras' },
          { id_materia_cjgp: 96, codigo_cjgp: 'PRY1', nombre_cjgp: 'Proyecto de Grado' },
        ];
      }
    }

    if (materias_ga.value.length > 0) {
      filtroMateria_ga.value = materias_ga.value[0].id_materia_cjgp;
    }

    console.log('[MisPlanesEstudioView_ga] Catálogos cargados:', {
      periodos: periodos_ga.value.length,
      materias: materias_ga.value.length,
    });

    // 3. Cargar planificación de la primera materia preseleccionada
    await cargarPlanificacion_ga();
  } catch (err_ga) {
    console.error('[MisPlanesEstudioView_ga] Error cargando catálogos iniciales:', err_ga);
  } finally {
    cargandoPeriodos_ga.value = false;
    cargandoMaterias_ga.value = false;
  }
};

// ── Carga de Planificación por Materia y Período ──────────────────────────────
const cargarPlanificacion_ga = async () => {
  if (!filtroMateria_ga.value || !filtroPeriodo_ga.value) return;

  cargando_ga.value = true;
  console.log(`[MisPlanesEstudioView_ga] Consultando planificación para materia ${filtroMateria_ga.value} y período ${filtroPeriodo_ga.value}`);

  try {
    const res_ga = await planEstudioServicio_ga.obtenerPlanificacionPorMateriaPeriodo_ga(
      filtroMateria_ga.value,
      filtroPeriodo_ga.value
    );

    if (res_ga?.exito_ga && res_ga.datos_ga) {
      planificacion_ga.value = res_ga.datos_ga;
      console.log('[MisPlanesEstudioView_ga] Planificación recibida:', planificacion_ga.value);
    } else {
      planificacion_ga.value = null;
      console.log('[MisPlanesEstudioView_ga] Sin planificación para esta materia.');
    }
  } catch (err_ga) {
    console.error('[MisPlanesEstudioView_ga] Error al obtener planificación:', err_ga);
    planificacion_ga.value = null;
  } finally {
    cargando_ga.value = false;
  }
};

onMounted(() => {
  cargarCatalogosIniciales_ga();
});
</script>
