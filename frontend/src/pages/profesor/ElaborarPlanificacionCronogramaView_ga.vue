<template>
  <!-- Vista integrada en MainLayout — Sin q-layout/q-header/q-drawer/q-footer propios -->
  <q-page class="q-pa-md bg-slate-50 text-slate-800">



    <!-- ── Banner estado del archivo ── -->
    <q-banner
      rounded class="q-mb-md"
      :class="store_ga.programaUrl_ga
        ? 'bg-emerald-50 text-emerald-900'
        : 'bg-amber-50 text-amber-900'"
      style="border: 1px solid"
      :style="store_ga.programaUrl_ga ? 'border-color: #6ee7b7' : 'border-color: #fcd34d'"
    >
      <template v-slot:avatar>
        <q-icon
          :name="store_ga.programaUrl_ga ? 'check_circle' : 'upload_file'"
          :color="store_ga.programaUrl_ga ? 'positive' : 'warning'"
          size="24px"
        />
      </template>
      <span class="text-caption text-weight-bold">
        Estado del Programa Oficial:
        {{ store_ga.programaUrl_ga
          ? '✅ Cargado — ' + store_ga.nombreArchivoPrograma_ga
          : '⏳ Pendiente de carga (.pdf / .docx obligatorio).' }}
      </span>
    </q-banner>

    <!-- ── Banner validación porcentual (tiempo real) ── -->
    <q-banner
      v-if="store_ga.formato_evaluacion_ga === 'CUANTITATIVO' && !store_ga.esValidoLapso1_ga || store_ga.formato_evaluacion_ga === 'CUANTITATIVO' && !store_ga.esValidoLapso2_ga"
      rounded
      class="bg-red-600 text-white shadow-md q-mb-md"
    >
      <template v-slot:avatar>
        <q-icon name="warning" color="white" size="32px" />
      </template>
      <div class="text-weight-bold">⚠️ Los porcentajes no cuadran — guardado bloqueado</div>
      <div class="text-caption q-mt-xs">
        <span v-if="!store_ga.esValidoLapso1_ga" class="block">
          • Lapso 1 suma {{ store_ga.sumaPorcentajeLapso1_ga }}% (debe ser exactamente 100%)
        </span>
        <span v-if="!store_ga.esValidoLapso2_ga" class="block">
          • Lapso 2 suma {{ store_ga.sumaPorcentajeLapso2_ga }}% (debe ser exactamente 100%)
        </span>
      </div>
    </q-banner>

    <!-- ── BARRA DE HERRAMIENTAS EXCEL (_ga) ── -->
    <q-card flat bordered class="q-mb-md bg-indigo-50" style="border: 1px solid #c7d2fe; border-radius: 10px;">
      <q-card-section class="q-py-sm q-px-md">
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-xs">
            <q-icon name="table_chart" color="indigo-9" size="24px" />
            <span class="text-subtitle2 text-weight-bold text-indigo-950">
              Integración Excel — Carga y Descarga de Cronogramas (.xlsx)
            </span>
          </div>

          <div class="row q-gutter-sm items-center">
            <!-- Botón Descargar Plantilla Excel -->
            <q-btn
              outline dense no-caps
              color="indigo-9"
              icon="file_download"
              label="Plantilla Excel (.xlsx)"
              :loading="descargandoPlantilla_ga"
              @click="alDescargarPlantillaExcel_ga"
            />

            <!-- Botón Importar desde Excel -->
            <q-btn
              unelevated dense no-caps
              color="teal-8"
              icon="file_upload"
              label="Cargar desde Excel"
              :loading="importandoExcel_ga"
              @click="abrirSelectorExcel_ga"
            />
            <input
              ref="inputExcelRef_ga"
              type="file"
              accept=".xlsx, .xls"
              style="display: none;"
              @change="alSeleccionarExcel_ga"
            />

            <!-- Botón Exportar Plan Actual -->
            <q-btn
              outline dense no-caps
              color="green-9"
              icon="output"
              label="Exportar a Excel"
              :disable="!idMateriaSeleccionada_ga || !idPeriodoSeleccionado_ga"
              :loading="exportandoExcel_ga"
              @click="alExportarPlanExcel_ga"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ── TARJETA 1: Cátedra y Programa ── -->
    <q-card flat bordered class="shadow-sm q-mb-lg bg-white">
      <q-card-section class="bg-slate-900 text-white q-py-sm">
        <div class="row items-center q-gutter-sm">
          <q-icon name="menu_book" color="amber-4" size="24px" />
          <span class="text-h6 text-weight-bold">1. Identificación de la Cátedra y Programa Oficial</span>
          <q-chip color="amber-5" text-color="dark" icon="star" dense class="text-weight-bold q-ml-auto">
            Obligatorio
          </q-chip>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">

          <!-- Selector de Materia -->
          <div class="col-12 col-md-4">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Materia Asignada</label>
            <q-select
              v-model="idMateriaSeleccionada_ga"
              :options="opcionesMaterias_ga"
              option-value="value" option-label="label"
              emit-value map-options outlined dense bg-color="white"
              :loading="cargandoMaterias_ga"
              placeholder="Selecciona una materia..."
              @update:model-value="alCambiarMateriaOPeriodo_ga"
            >
              <template v-slot:prepend><q-icon name="school" color="primary" /></template>
              <template v-slot:no-option>
                <q-item><q-item-section class="text-grey">Sin materias asignadas</q-item-section></q-item>
              </template>
            </q-select>
          </div>

          <!-- Selector de Período -->
          <div class="col-12 col-md-3">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Período Académico</label>
            <q-select
              v-model="idPeriodoSeleccionado_ga"
              :options="opcionesPeriodos_ga"
              option-value="value" option-label="label"
              emit-value map-options outlined dense bg-color="white"
              :loading="cargandoPeriodos_ga"
              placeholder="Selecciona el período..."
              @update:model-value="alCambiarMateriaOPeriodo_ga"
            >
              <template v-slot:prepend><q-icon name="event" color="teal" /></template>
            </q-select>
          </div>

          <!-- Selector de Formato -->
          <div class="col-12 col-md-2">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Formato de Evaluación</label>
            <q-select
              v-model="store_ga.formato_evaluacion_ga"
              :options="[
                { label: 'Cuantitativo (%)', value: 'CUANTITATIVO' },
                { label: 'Cualitativo (Logro)', value: 'CUALITATIVO' }
              ]"
              emit-value map-options outlined dense bg-color="white"
              @update:model-value="store_ga.persistirEstadoTemp_ga()"
            >
              <template v-slot:prepend><q-icon name="tune" color="deep-purple" /></template>
            </q-select>
          </div>

          <!-- Estado del plan actual -->
          <div class="col-12 col-md-3 flex items-end">
            <q-chip
              v-if="estadoPlanActual_ga"
              :color="colorEstado_ga(estadoPlanActual_ga)"
              text-color="white"
              :icon="iconoEstado_ga(estadoPlanActual_ga)"
              class="text-weight-bold full-width justify-center"
            >
              {{ estadoPlanActual_ga }}
            </q-chip>
            <div v-else class="text-caption text-slate-500 full-width">
              Plan nuevo — sin entregas previas
            </div>
          </div>
        </div>

        <!-- Subida del Programa Oficial -->
        <q-separator class="q-my-md" />
        <div class="row q-col-gutter-md items-start">
          <div class="col-12 col-md-8">
            <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
              Adjuntar Programa de Estudio Oficial (.pdf o .docx) — Obligatorio
            </label>
            <q-uploader
              url=""
              auto-upload
              label="Arrastrar o seleccionar archivo (.pdf, .docx)"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              max-files="1" flat bordered
              class="full-width bg-slate-50"
              style="border: 2px dashed #6366f1; border-radius: 12px;"
              :disable="!idMateriaSeleccionada_ga || !idPeriodoSeleccionado_ga"
              :factory="subirArchivoFactory_ga"
              @added="alSeleccionarArchivo_ga"
            >
              <template v-slot:header="scope">
                <div class="row no-wrap items-center q-pa-sm bg-indigo-900 text-white" style="border-radius: 10px 10px 0 0;">
                  <q-spinner v-if="scope.isUploading" class="q-mr-sm" />
                  <div class="col text-weight-bold text-caption">Programa Oficial UNE — PDF / DOCX</div>
                  <q-btn v-if="scope.canAddFiles" type="a" icon="attach_file" flat round dense>
                    <q-uploader-add-trigger />
                  </q-btn>
                </div>
              </template>
            </q-uploader>
            <div v-if="!idMateriaSeleccionada_ga || !idPeriodoSeleccionado_ga" class="text-caption text-amber-700 q-mt-xs">
              ⚠️ Selecciona primero la materia y el período para habilitar la carga del archivo.
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div
              v-if="store_ga.programaUrl_ga"
              class="q-pa-md bg-emerald-50"
              style="border: 1px solid #6ee7b7; border-radius: 8px;"
            >
              <div class="text-caption text-weight-bold text-emerald-800 q-mb-xs">
                <q-icon name="picture_as_pdf" color="positive" /> Archivo cargado:
              </div>
              <div class="text-caption text-emerald-700" style="word-break: break-all;">
                {{ store_ga.nombreArchivoPrograma_ga }}
              </div>
              <q-btn
                flat dense no-caps size="sm" color="positive"
                icon="open_in_new" label="Ver documento"
                class="q-mt-xs"
                :href="`http://localhost:3000${store_ga.programaUrl_ga}`"
                target="_blank"
              />
            </div>
            <div
              v-else
              class="q-pa-md bg-amber-50 text-amber-800 text-caption"
              style="border: 1px solid #fcd34d; border-radius: 8px;"
            >
              <q-icon name="info" /> Sin programa cargado aún.
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ── TARJETA 2: Cronograma de 2 Lapsos ── -->
    <q-card flat bordered class="shadow-sm bg-white">
      <q-card-section class="bg-indigo-950 text-white q-py-sm">
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-icon name="view_week" color="amber-4" size="24px" />
            <span class="text-h6 text-weight-bold">2. Cronograma (2 Lapsos · Máx. 4 evaluaciones por lapso)</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-icon name="cloud_sync" color="indigo-2" size="16px" />
            <span class="text-caption text-indigo-300">Anti-pérdida: guardado automático en cada pulsación</span>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">

        <div
          v-for="numLapso_ga in [1, 2]"
          :key="numLapso_ga"
          class="q-pa-lg q-mb-md bg-slate-50"
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
            <div v-if="store_ga.formato_evaluacion_ga === 'CUANTITATIVO'" class="row items-center q-gutter-sm">
              <span class="text-caption text-weight-bold text-slate-600">Suma:</span>
              <q-chip
                :color="numLapso_ga === 1 ? (store_ga.esValidoLapso1_ga ? 'positive' : 'negative') : (store_ga.esValidoLapso2_ga ? 'positive' : 'negative')"
                text-color="white" dense class="text-weight-extrabold"
              >
                {{ numLapso_ga === 1 ? store_ga.sumaPorcentajeLapso1_ga : store_ga.sumaPorcentajeLapso2_ga }}% / 100%
              </q-chip>
            </div>
          </div>

          <!-- Detalle Didáctico -->
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Unidad Temática</label>
              <q-input
                v-model="obtenerDetalleDidactico_ga(numLapso_ga).unidad_tematica_ga"
                outlined dense bg-color="white"
                placeholder="Ej. Unidad I: Fundamentos"
                :rules="[val => !!val || 'Requerido']"
                @update:model-value="store_ga.persistirEstadoTemp_ga()"
              />
            </div>
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Estrategias Didácticas</label>
              <q-input
                v-model="obtenerDetalleDidactico_ga(numLapso_ga).estrategia_ga"
                outlined dense bg-color="white"
                placeholder="Ej. Clases magistrales, talleres"
                :rules="[val => !!val || 'Requerido']"
                @update:model-value="store_ga.persistirEstadoTemp_ga()"
              />
            </div>
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">Recursos Instruccionales</label>
              <q-input
                v-model="obtenerDetalleDidactico_ga(numLapso_ga).recursos_ga"
                outlined dense bg-color="white"
                placeholder="Ej. Proyector, Guías PDF"
                :rules="[val => !!val || 'Requerido']"
                @update:model-value="store_ga.persistirEstadoTemp_ga()"
              />
            </div>
          </div>

          <!-- Actividades de Evaluación -->
          <div>
            <div class="row items-center justify-between q-mb-sm">
              <div class="row items-center q-gutter-xs">
                <q-icon name="assignment" color="indigo-8" />
                <span class="text-weight-bold text-slate-800">
                  Actividades de Evaluación
                  <q-badge
                    :color="obtenerActividadesPorLapso_ga(numLapso_ga).length >= 4 ? 'orange-8' : 'indigo-7'"
                    class="q-ml-xs"
                  >
                    {{ obtenerActividadesPorLapso_ga(numLapso_ga).length }} de 4 máx.
                  </q-badge>
                </span>
              </div>
              <q-btn
                unelevated no-caps dense color="indigo-7"
                icon="add" label="Agregar Evaluación"
                :disabled="obtenerActividadesPorLapso_ga(numLapso_ga).length >= 4"
                @click="agregarActividad_ga(numLapso_ga)"
              />
            </div>

            <div class="row q-col-gutter-md">
              <div
                v-for="(act_ga, idx_ga) in obtenerActividadesPorLapso_ga(numLapso_ga)"
                :key="idx_ga"
                class="col-12 col-md-6"
              >
                <q-card flat bordered class="bg-white" style="border-radius: 10px; border: 1px solid #c7d2fe;">
                  <q-card-section class="q-py-sm q-px-md">
                    <div class="row items-center justify-between q-mb-sm">
                      <q-badge color="indigo-9" class="text-weight-bold">Evaluación #{{ idx_ga + 1 }}</q-badge>
                      <q-btn flat round dense color="negative" icon="delete_forever" size="sm" @click="eliminarActividad_ga(act_ga)" />
                    </div>

                    <div class="row q-col-gutter-sm q-mb-sm">
                      <div class="col-12 col-sm-7">
                        <label class="block text-caption text-weight-semibold text-slate-600">Nombre de la Actividad</label>
                        <q-input
                          v-model="act_ga.nombre_actividad_ga"
                          outlined dense bg-color="white"
                          placeholder="Ej. Examen Parcial I"
                          :rules="[val => !!val || 'Requerido']"
                          @update:model-value="store_ga.persistirEstadoTemp_ga()"
                        />
                      </div>
                      <div class="col-12 col-sm-5">
                        <label class="block text-caption text-weight-semibold text-slate-600">Tipo</label>
                        <q-select
                          v-model="act_ga.tipo_evaluacion_ga"
                          :options="['EXAMEN', 'TALLER', 'EXPOSICION', 'PROYECTO', 'INVESTIGACION', 'PRACTICA']"
                          outlined dense bg-color="white"
                          @update:model-value="store_ga.persistirEstadoTemp_ga()"
                        />
                      </div>
                    </div>

                    <div class="row q-col-gutter-sm q-mb-sm">
                      <div v-if="store_ga.formato_evaluacion_ga === 'CUANTITATIVO'" class="col-12 col-sm-5">
                        <label class="block text-caption text-weight-semibold text-slate-600">Porcentaje (%)</label>
                        <q-input
                          v-model.number="act_ga.porcentaje_ga"
                          type="number" outlined dense bg-color="white" suffix="%"
                          min="0" max="100"
                          :rules="[
                            val => (val !== null && val !== '') || 'Requerido',
                            val => validarNumero_ga(val) || 'Solo números 0-100',
                            val => Number(val) >= 0 || 'Mínimo 0%',
                            val => Number(val) <= 100 || 'Máximo 100%'
                          ]"
                          @update:model-value="store_ga.persistirEstadoTemp_ga()"
                        />
                      </div>
                      <div class="col">
                        <label class="block text-caption text-weight-semibold text-slate-600">Fecha Estimada</label>
                        <q-input
                          v-model="act_ga.fecha_evaluacion_ga"
                          type="date" outlined dense bg-color="white"
                          :rules="[val => !!val || 'Requerida']"
                          @update:model-value="store_ga.persistirEstadoTemp_ga()"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-caption text-weight-semibold text-slate-600">Indicador de Logro / Criterio</label>
                      <q-input
                        v-model="act_ga.descripcion_indicador_ga"
                        outlined dense bg-color="white" type="textarea" rows="2"
                        placeholder="Ej. El estudiante demuestra dominio técnico del tema"
                        @update:model-value="store_ga.persistirEstadoTemp_ga()"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Placeholder sin actividades -->
              <div v-if="obtenerActividadesPorLapso_ga(numLapso_ga).length === 0" class="col-12">
                <div class="q-pa-lg text-center text-slate-400" style="border: 2px dashed #c7d2fe; border-radius: 10px;">
                  <q-icon name="add_circle_outline" size="40px" color="indigo-3" />
                  <div class="text-caption q-mt-sm">Sin evaluaciones — haz clic en "Agregar Evaluación"</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </q-card-section>

      <!-- Acciones de guardado -->
      <q-card-actions align="right" class="q-pa-lg bg-slate-100" style="border-top: 1px solid #e2e8f0;">
        <div class="row full-width items-center justify-between">
          <div class="text-caption text-slate-500 row items-center q-gutter-xs">
            <q-icon name="save" color="indigo-4" />
            <span>Borrador activo — guardado automático en cada pulsación</span>
          </div>
          <div class="row q-gutter-sm items-center">
            <q-btn outline color="grey-7" icon="cleaning_services" label="Limpiar Borrador" no-caps @click="confirmarLimpiarBorrador_ga" />
            <div class="relative-position">
              <q-btn
                unelevated color="indigo-9" icon="send"
                label="Guardar y Entregar Planificación"
                size="md" class="text-weight-bold" no-caps
                :disabled="!puedeGuardar_ga"
                :loading="guardando_ga"
                @click="guardarPlanificacion_ga"
              >
                <template v-slot:loading><q-spinner-dots /></template>
              </q-btn>
              <q-tooltip v-if="!puedeGuardar_ga" class="bg-indigo-950 text-white text-caption shadow-4" max-width="320px">
                <div class="text-weight-bold text-amber-4 q-mb-xs">⚠️ Requisitos pendientes para guardar:</div>
                <div v-for="(item_ga, idx_ga) in requisitosPendientes_ga" :key="idx_ga" class="q-mb-xs">• {{ item_ga }}</div>
              </q-tooltip>
            </div>
          </div>
        </div>
        <div v-if="!puedeGuardar_ga" class="text-caption text-amber-9 text-right q-mt-xs font-semibold">
          ⚠️ Requisitos pendientes: {{ requisitosPendientes_ga.join(' | ') }}
        </div>
      </q-card-actions>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePlanificacionStore_ga } from 'src/stores/planificacionStore_ga';
import { planEstudioServicio_ga } from 'src/servicios/planEstudioServicio_ga';
import { apiCliente_ahbb } from 'src/servicios/api_ahbb';

// ── Quasar y Store ────────────────────────────────────────────────────────────
const $q = useQuasar();
const store_ga = usePlanificacionStore_ga();

// ── Estado de UI ──────────────────────────────────────────────────────────────
const mostrarBienvenida_ga = ref(true);
const guardando_ga = ref(false);
const cargandoMaterias_ga = ref(false);
const cargandoPeriodos_ga = ref(false);

// Catálogos dinámicos
const materias_ga = ref([]);
const periodos_ga = ref([]);

// IDs seleccionados (dinámicos — nunca hardcodeados)
const idMateriaSeleccionada_ga = ref(null);
const idPeriodoSeleccionado_ga = ref(null);

// Estado del plan existente
const estadoPlanActual_ga = ref(null);

// ── Estado y Manejo de Excel (_ga) ───────────────────────────────────────────
const inputExcelRef_ga = ref(null);
const descargandoPlantilla_ga = ref(false);
const importandoExcel_ga = ref(false);
const exportandoExcel_ga = ref(false);

const alDescargarPlantillaExcel_ga = async () => {
  descargandoPlantilla_ga.value = true;
  try {
    await planEstudioServicio_ga.descargarPlantillaExcel_ga();
    $q.notify({ type: 'positive', icon: 'file_download', message: 'Plantilla Excel descargada correctamente.' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al descargar plantilla Excel.' });
  } finally {
    descargandoPlantilla_ga.value = false;
  }
};

const abrirSelectorExcel_ga = () => {
  if (inputExcelRef_ga.value) inputExcelRef_ga.value.click();
};

const alSeleccionarExcel_ga = async (evt_ga) => {
  const archivo_ga = evt_ga.target?.files?.[0];
  if (!archivo_ga) return;

  importandoExcel_ga.value = true;
  try {
    const res_ga = await planEstudioServicio_ga.importarCronogramaExcel_ga(archivo_ga);
    if (res_ga?.exito_ga) {
      if (res_ga.detallesDidacticos_ga?.length) {
        store_ga.detallesDidacticos_ga = res_ga.detallesDidacticos_ga;
      }
      if (res_ga.actividadesEvaluacion_ga?.length) {
        store_ga.actividadesEvaluacion_ga = res_ga.actividadesEvaluacion_ga;
      }
      store_ga.formato_evaluacion_ga = res_ga.formato_evaluacion_ga || 'CUANTITATIVO';
      store_ga.persistirEstadoTemp_ga();

      $q.notify({
        type: 'positive',
        icon: 'task_alt',
        message: '✅ Cronograma importado desde Excel. Revisa los campos y presiona Guardar.',
        timeout: 5000,
      });
    }
  } catch (error) {
    console.error('[ElaborarPlan_ga] Error al importar Excel:', error);
    const msj_ga = error.response?.data?.message || 'Fallo al procesar el archivo Excel. Verifica el formato.';
    $q.notify({ type: 'negative', message: msj_ga, timeout: 6000 });
  } finally {
    importandoExcel_ga.value = false;
    evt_ga.target.value = '';
  }
};

const alExportarPlanExcel_ga = async () => {
  if (!idMateriaSeleccionada_ga.value || !idPeriodoSeleccionado_ga.value) return;
  exportandoExcel_ga.value = true;
  try {
    await planEstudioServicio_ga.exportarPlanExcel_ga(idMateriaSeleccionada_ga.value, idPeriodoSeleccionado_ga.value);
    $q.notify({ type: 'positive', icon: 'output', message: 'Cronograma exportado a Excel exitosamente.' });
  } catch (error) {
    console.error('[ElaborarPlan_ga] Error al exportar Excel:', error);
    $q.notify({ type: 'negative', message: 'No existe un plan guardado en servidor para exportar.' });
  } finally {
    exportandoExcel_ga.value = false;
  }
};

// ── Expresión Regular anti-inyección para campos numéricos ───────────────────
// Permite enteros y hasta 2 decimales: "25", "33.33"
const REGEX_NUMERO_GA = /^[0-9]+(\.[0-9]{1,2})?$/;

const validarNumero_ga = (valor_ga) => {
  if (valor_ga === null || valor_ga === undefined || valor_ga === '') return false;
  return REGEX_NUMERO_GA.test(String(valor_ga));
};

// Sanitiza texto de etiquetas HTML antes de enviar al backend
const sanitizarTexto_ga = (texto_ga) =>
  String(texto_ga ?? '').trim().replace(/<[^>]*>?/gm, '');

// ── Computed: opciones para selectores ───────────────────────────────────────
const opcionesMaterias_ga = computed(() =>
  materias_ga.value.map((m) => ({
    value: m.id_materia_cjgp,
    label: `${m.codigo_cjgp || m.codigo_materia_cjgp || 'MAT'} — ${m.nombre_cjgp || m.nombre_materia_cjgp || 'Materia'}`,
  }))
);

const opcionesPeriodos_ga = computed(() =>
  periodos_ga.value.map((p) => ({
    value: p.id_periodo_cjgp,
    label: p.nombre_cjgp || p.nombre_periodo_cjgp || `Período ${p.id_periodo_cjgp}`,
  }))
);

// ── Computed: control del botón Guardar ──────────────────────────────────────
// Habilitado solo si: materia + período seleccionados, programa subido, porcentajes válidos
const puedeGuardar_ga = computed(() =>
  !!idMateriaSeleccionada_ga.value &&
  !!idPeriodoSeleccionado_ga.value &&
  !!store_ga.programaUrl_ga &&
  store_ga.esPlanificacionValida_ga
);

// ── Computed: lista de requisitos pendientes para habilitar el guardado ────────
const requisitosPendientes_ga = computed(() => {
  const pendientes_ga = [];
  if (!idMateriaSeleccionada_ga.value) pendientes_ga.push('Seleccionar materia asignada');
  if (!idPeriodoSeleccionado_ga.value) pendientes_ga.push('Seleccionar período académico');
  if (!store_ga.programaUrl_ga) pendientes_ga.push('Subir archivo del Programa Oficial (.pdf o .docx)');
  if (store_ga.formato_evaluacion_ga === 'CUANTITATIVO') {
    if (!store_ga.esValidoLapso1_ga) pendientes_ga.push(`Lapso 1 debe sumar 100% (actual: ${store_ga.sumaPorcentajeLapso1_ga}%)`);
    if (!store_ga.esValidoLapso2_ga) pendientes_ga.push(`Lapso 2 debe sumar 100% (actual: ${store_ga.sumaPorcentajeLapso2_ga}%)`);
  }
  if (store_ga.actividadesLapso1_ga.length === 0) pendientes_ga.push('Agregar al menos 1 evaluación en Lapso 1');
  if (store_ga.actividadesLapso2_ga.length === 0) pendientes_ga.push('Agregar al menos 1 evaluación en Lapso 2');
  return pendientes_ga;
});

// ── Helpers de estado visual del plan ────────────────────────────────────────
const colorEstado_ga = (estado_ga) =>
  ({ BORRADOR: 'grey-6', ENTREGADO: 'blue-7', EN_REVISION: 'orange-7', APROBADO: 'positive', DEVUELTO: 'negative' }[estado_ga] ?? 'grey-5');

const iconoEstado_ga = (estado_ga) =>
  ({ BORRADOR: 'edit', ENTREGADO: 'send', EN_REVISION: 'rate_review', APROBADO: 'verified', DEVUELTO: 'undo' }[estado_ga] ?? 'help_outline');

// ── Utilidades de datos por lapso ─────────────────────────────────────────────

/**
 * Obtiene (o crea) el detalle didáctico de un lapso dentro del store.
 * Reactivo: enlazado directamente con v-model.
 */
const obtenerDetalleDidactico_ga = (numLapso_ga) => {
  let det_ga = store_ga.detallesDidacticos_ga.find((d) => d.lapso_ga === numLapso_ga);
  if (!det_ga) {
    det_ga = { lapso_ga: numLapso_ga, unidad_tematica_ga: '', estrategia_ga: '', recursos_ga: '', orden_ga: 1 };
    store_ga.detallesDidacticos_ga.push(det_ga);
  }
  return det_ga;
};

/** Filtra las actividades del store por número de lapso. */
const obtenerActividadesPorLapso_ga = (numLapso_ga) =>
  store_ga.actividadesEvaluacion_ga.filter((a) => a.lapso_ga === numLapso_ga);

// ── Manejo de Actividades ─────────────────────────────────────────────────────
const agregarActividad_ga = (numLapso_ga) => {
  const ok_ga = store_ga.agregarActividad_ga(numLapso_ga);
  if (!ok_ga) $q.notify({ type: 'warning', message: 'Máximo 4 actividades de evaluación por lapso.' });
};

const eliminarActividad_ga = (actividad_ga) => {
  const idx_ga = store_ga.actividadesEvaluacion_ga.indexOf(actividad_ga);
  if (idx_ga !== -1) store_ga.eliminarActividad_ga(idx_ga);
};

// ── Carga de catálogos ────────────────────────────────────────────────────────

/**
 * Carga las materias asignadas al docente autenticado.
 * Endpoint: GET /academico/carreras/mis-materias
 */
const cargarMaterias_ga = async () => {
  cargandoMaterias_ga.value = true;
  try {
    const res_ga = await apiCliente_ahbb.get('/academico/carreras/mis-materias');
    const datosMaterias_ga = Array.isArray(res_ga.data) ? res_ga.data : (res_ga.data?.materias || []);
    materias_ga.value = datosMaterias_ga;
    console.log('[ElaborarPlan_ga] Materias cargadas:', materias_ga.value.length);
    // Preseleccionar la primera materia disponible si no hay una seleccionada
    if (materias_ga.value.length > 0 && !idMateriaSeleccionada_ga.value) {
      idMateriaSeleccionada_ga.value = materias_ga.value[0].id_materia_cjgp;
    }
  } catch (e_ga) {
    console.error('[ElaborarPlan_ga] Error al cargar materias:', e_ga);
    $q.notify({ type: 'warning', message: 'No se pudieron cargar las materias asignadas.' });
  } finally {
    cargandoMaterias_ga.value = false;
  }
};

/**
 * Carga todos los períodos y preselecciona el activo.
 * Endpoint: GET /academico/periodos
 */
const cargarPeriodos_ga = async () => {
  cargandoPeriodos_ga.value = true;
  try {
    const res_ga = await apiCliente_ahbb.get('/academico/periodos');
    periodos_ga.value = Array.isArray(res_ga.data) ? res_ga.data : [];
    // Preseleccionar período activo (activo_cjgp=true o estado_cjgp='ACTIVO')
    const activo_ga = periodos_ga.value.find((p) => p.activo_cjgp || p.estado_cjgp === 'ACTIVO') || periodos_ga.value[0];
    if (activo_ga) idPeriodoSeleccionado_ga.value = activo_ga.id_periodo_cjgp;
    console.log('[ElaborarPlan_ga] Períodos cargados:', periodos_ga.value.length);
  } catch (e_ga) {
    console.error('[ElaborarPlan_ga] Error al cargar períodos:', e_ga);
    $q.notify({ type: 'warning', message: 'No se pudieron cargar los períodos académicos.' });
  } finally {
    cargandoPeriodos_ga.value = false;
  }
};

/**
 * Al cambiar materia o período: consulta si ya existe plan (modo edición).
 * Si existe, carga sus datos en el store para edición; si no, deja el store vacío.
 */
const alCambiarMateriaOPeriodo_ga = async () => {
  if (!idMateriaSeleccionada_ga.value || !idPeriodoSeleccionado_ga.value) return;
  console.log(`[ElaborarPlan_ga] Consultando plan: materia=${idMateriaSeleccionada_ga.value} período=${idPeriodoSeleccionado_ga.value}`);

  try {
    const res_ga = await planEstudioServicio_ga.obtenerPlanificacionPorMateriaPeriodo_ga(
      idMateriaSeleccionada_ga.value,
      idPeriodoSeleccionado_ga.value
    );

    if (res_ga?.exito_ga && res_ga.datos_ga) {
      // Modo edición: cargar datos existentes en el store
      const plan_ga = res_ga.datos_ga;
      estadoPlanActual_ga.value = plan_ga.estado_ga;
      store_ga.programaUrl_ga = plan_ga.programaUrl_ga || '';
      store_ga.nombreArchivoPrograma_ga = plan_ga.programaUrl_ga?.split('/').pop() || '';
      store_ga.formato_evaluacion_ga = plan_ga.formato_evaluacion_ga || 'CUANTITATIVO';

      if (plan_ga.detallesDidacticos_ga?.length) {
        store_ga.detallesDidacticos_ga = plan_ga.detallesDidacticos_ga.map((d) => ({
          lapso_ga: d.lapso_ga,
          unidad_tematica_ga: d.unidad_tematica_ga,
          estrategia_ga: d.estrategia_ga,
          recursos_ga: d.recursos_ga,
          orden_ga: d.orden_ga,
        }));
      }

      if (plan_ga.actividadesEvaluacion_ga?.length) {
        store_ga.actividadesEvaluacion_ga = plan_ga.actividadesEvaluacion_ga.map((a) => ({
          lapso_ga: a.lapso_ga,
          nombre_actividad_ga: a.nombre_actividad_ga,
          tipo_evaluacion_ga: a.tipo_evaluacion_ga,
          porcentaje_ga: Number(a.porcentaje_ga) || 0,
          fecha_evaluacion_ga: a.fecha_evaluacion_ga?.split('T')[0] || '',
          orden_ga: a.orden_ga,
          descripcion_indicador_ga: a.indicadoresLogro_ga?.[0]?.descripcion_ga || '',
        }));
      }

      $q.notify({ type: 'info', icon: 'edit', message: `Plan encontrado (${plan_ga.estado_ga}) — modo edición activo.`, timeout: 3000 });
    } else {
      // Modo creación
      estadoPlanActual_ga.value = null;
      console.log('[ElaborarPlan_ga] Sin plan previo — modo creación.');
    }
  } catch (e_ga) {
    console.error('[ElaborarPlan_ga] Error al consultar plan existente:', e_ga);
  }
};

// ── Subida de archivo (q-uploader factory con Axios) ─────────────────────────

const alSeleccionarArchivo_ga = async (archivos_ga) => {
  const archivo_ga = archivos_ga[0];
  if (!archivo_ga) return;

  console.log('[ElaborarPlan_ga] Subiendo archivo seleccionado inmediatamente:', archivo_ga.name);

  try {
    const res_ga = await planEstudioServicio_ga.subirProgramaOficial_ga(archivo_ga);
    store_ga.programaUrl_ga = res_ga.programaUrl_ga;
    store_ga.nombreArchivoPrograma_ga = res_ga.nombreOriginal_ga;
    store_ga.persistirEstadoTemp_ga();
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Programa "${res_ga.nombreOriginal_ga}" subido y registrado correctamente.`,
      timeout: 4000,
    });
  } catch (e_ga) {
    console.error('[ElaborarPlan_ga] Error al subir archivo:', e_ga);
    $q.notify({
      type: 'negative',
      message: e_ga?.response?.data?.message || 'Error al subir el archivo.',
    });
  }
};

/**
 * Factory del q-uploader: controla manualmente la subida del archivo
 * via Axios multipart/form-data al endpoint POST /planes-estudio_ga/upload-programa.
 */
const subirArchivoFactory_ga = (archivos_ga) =>
  new Promise((resolve) => {
    const archivo_ga = archivos_ga[0];
    if (!archivo_ga) {
      $q.notify({ type: 'negative', message: 'No se detectó el archivo para subir.' });
      return resolve({ url: '' });
    }

    console.log(`[ElaborarPlan_ga] Subiendo: ${archivo_ga.name} (${archivo_ga.size} bytes)`);

    planEstudioServicio_ga
      .subirProgramaOficial_ga(archivo_ga)
      .then((res_ga) => {
        // Persistir URL en store + localStorage (anti-pérdida)
        store_ga.programaUrl_ga = res_ga.programaUrl_ga;
        store_ga.nombreArchivoPrograma_ga = res_ga.nombreOriginal_ga;
        store_ga.persistirEstadoTemp_ga();
        $q.notify({ type: 'positive', icon: 'check_circle', message: `"${res_ga.nombreOriginal_ga}" cargado correctamente.`, timeout: 4000 });
        resolve({ url: '' });
      })
      .catch((e_ga) => {
        console.error('[ElaborarPlan_ga] Error al subir archivo:', e_ga);
        $q.notify({ type: 'negative', message: e_ga?.response?.data?.message || 'Error al subir el archivo.' });
        resolve({ url: '' });
      });
  });

// ── Guardado integral de la planificación ────────────────────────────────────

/**
 * Construye el payload con datos sanitizados del store y llama al backend.
 * El backend usa prisma.$transaction para persistencia atómica (ACID).
 */
const guardarPlanificacion_ga = async () => {
  if (!puedeGuardar_ga.value) {
    $q.notify({ type: 'warning', message: 'Completa todos los campos y verifica que los porcentajes sumen 100%.' });
    return;
  }

  guardando_ga.value = true;
  try {
    const payload_ga = {
      id_materia_ga: idMateriaSeleccionada_ga.value,
      id_periodo_ga: idPeriodoSeleccionado_ga.value,
      programaUrl_ga: store_ga.programaUrl_ga,
      formato_evaluacion_ga: store_ga.formato_evaluacion_ga,
      detallesDidacticos_ga: store_ga.detallesDidacticos_ga.map((d) => ({
        lapso_ga: d.lapso_ga,
        unidad_tematica_ga: sanitizarTexto_ga(d.unidad_tematica_ga) || `Unidad Temática Lapso ${d.lapso_ga}`,
        estrategia_ga: sanitizarTexto_ga(d.estrategia_ga) || 'Estrategias didácticas de la asignatura',
        recursos_ga: sanitizarTexto_ga(d.recursos_ga) || 'Recursos instruccionales',
        orden_ga: Number(d.orden_ga) || 1,
      })),
      actividadesEvaluacion_ga: store_ga.actividadesEvaluacion_ga.map((a) => {
        const fechaValida_ga = (a.fecha_evaluacion_ga && !isNaN(Date.parse(a.fecha_evaluacion_ga)))
          ? a.fecha_evaluacion_ga
          : new Date().toISOString().split('T')[0];
        return {
          lapso_ga: a.lapso_ga,
          nombre_actividad_ga: sanitizarTexto_ga(a.nombre_actividad_ga) || `Evaluación Lapso ${a.lapso_ga}`,
          tipo_evaluacion_ga: a.tipo_evaluacion_ga || 'TALLER',
          porcentaje_ga: Number(a.porcentaje_ga) || 0,
          fecha_evaluacion_ga: fechaValida_ga,
          orden_ga: Number(a.orden_ga) || 1,
          indicadores_ga: a.descripcion_indicador_ga
            ? [{ descripcion_ga: sanitizarTexto_ga(a.descripcion_indicador_ga) }]
            : [],
        };
      }),
    };

    // Debug: verificar payload antes de enviar
    console.log('[ElaborarPlan_ga] Payload:', JSON.stringify(payload_ga, null, 2));

    const res_ga = await planEstudioServicio_ga.guardarPlanificacionCompleta_ga(payload_ga);

    $q.notify({ type: 'positive', icon: 'verified', message: res_ga.mensaje_ga || '✅ Planificación entregada. El admin la revisará.', timeout: 5000 });
    estadoPlanActual_ga.value = 'ENTREGADO';
    localStorage.removeItem('planificacion_temp_ga');
    // Recargar el plan guardado desde el servidor para mantener todos los datos en pantalla
    await alCambiarMateriaOPeriodo_ga();
  } catch (e_ga) {
    console.error('[ElaborarPlan_ga] Error al guardar:', e_ga);
    const msj_ga = Array.isArray(e_ga?.response?.data?.message)
      ? e_ga.response.data.message.join(' | ')
      : (e_ga?.response?.data?.message || e_ga?.message || 'Fallo al guardar la planificación.');
    $q.notify({ type: 'negative', message: msj_ga, timeout: 7000 });
  } finally {
    guardando_ga.value = false;
  }
};

// ── Limpiar borrador con confirmación ─────────────────────────────────────────
const confirmarLimpiarBorrador_ga = () => {
  $q.dialog({
    title: 'Limpiar Borrador',
    message: '¿Borrar el borrador local? Los datos ya guardados en el servidor NO se eliminan.',
    cancel: { label: 'Cancelar', flat: true, color: 'grey' },
    ok: { label: 'Limpiar', color: 'negative', unelevated: true },
  }).onOk(() => {
    store_ga.limpiarEstado_ga();
    estadoPlanActual_ga.value = null;
    $q.notify({ type: 'info', message: 'Borrador local eliminado.' });
  });
};

// ── Ciclo de vida ─────────────────────────────────────────────────────────────
onMounted(async () => {
  // 1. Restaurar borrador local (anti-pérdida de datos)
  store_ga.cargarEstadoTemp_ga();

  // 2. Cargar catálogos en paralelo para reducir espera
  await Promise.all([cargarMaterias_ga(), cargarPeriodos_ga()]);

  // 3. Si el store tiene IDs del borrador, preseleccionar
  if (store_ga.idMateria_ga && store_ga.idPeriodo_ga) {
    idMateriaSeleccionada_ga.value = store_ga.idMateria_ga;
    idPeriodoSeleccionado_ga.value = store_ga.idPeriodo_ga;
  }

  // 4. Cargar planificación existente para los IDs seleccionados
  if (idMateriaSeleccionada_ga.value && idPeriodoSeleccionado_ga.value) {
    await alCambiarMateriaOPeriodo_ga();
  }
});
</script>
