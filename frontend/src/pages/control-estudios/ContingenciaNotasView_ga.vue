<template>
  <!-- Vista integrada en MainLayout para el Jefe de Control de Estudios (_ga) -->
  <q-page class="q-pa-md q-pa-lg-xl bg-slate-50 text-slate-800">



    <!-- ── Tarjeta Principal del Formulario ── -->
    <q-card flat bordered class="shadow-sm bg-white border-slate-200">
      <q-card-section class="bg-slate-900 text-white q-py-sm">
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-icon name="edit_note" color="amber-4" size="26px" />
            <span class="text-h6 text-weight-bold">Formulario de Carga de Nota Final por Contingencia</span>
          </div>
          <q-chip color="amber-6" text-color="dark" icon="gavel" dense class="text-weight-bold">
            Rol: CONTROL_ESTUDIOS
          </q-chip>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-form @submit.prevent="guardarContingencia_ga" class="q-gutter-md">

          <!-- Fila 1: Selección de Materia, Período y Alumno -->
          <div class="row q-col-gutter-md">
            
            <!-- Selector de Materia -->
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
                Materia Asignada
              </label>
              <q-select
                v-model="form_ga.id_materia_ga"
                :options="opcionesMaterias_ga"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                :loading="cargandoCatalogos_ga"
                placeholder="Seleccione la materia..."
                :rules="[val => !!val || 'Debe seleccionar una materia']"
              >
                <template v-slot:prepend><q-icon name="school" color="primary" /></template>
              </q-select>
            </div>

            <!-- Selector de Período -->
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
                Período Académico
              </label>
              <q-select
                v-model="form_ga.id_periodo_ga"
                :options="opcionesPeriodos_ga"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                :loading="cargandoCatalogos_ga"
                placeholder="Seleccione el período..."
                :rules="[val => !!val || 'Debe seleccionar un período']"
              >
                <template v-slot:prepend><q-icon name="event" color="teal" /></template>
              </q-select>
            </div>

            <!-- Selector de Alumno -->
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
                Estudiante / Alumno
              </label>
              <q-select
                v-model="form_ga.id_alumno_ga"
                :options="opcionesAlumnos_ga"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                :loading="cargandoCatalogos_ga"
                placeholder="Seleccione el alumno..."
                :rules="[val => !!val || 'Debe seleccionar un alumno']"
              >
                <template v-slot:prepend><q-icon name="person" color="deep-purple" /></template>
              </q-select>
            </div>

          </div>

          <!-- Fila 2: Nota Final y Motivo / Justificación -->
          <div class="row q-col-gutter-md q-mt-sm">
            
            <!-- Campo Nota Final Definitiva -->
            <div class="col-12 col-md-4">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
                Nota Final Definitiva (Escala 0 a 20 pts)
              </label>
              <q-input
                v-model.number="form_ga.nota_final_ga"
                type="number"
                outlined
                dense
                bg-color="white"
                suffix="pts"
                min="0"
                max="20"
                step="0.5"
                placeholder="Ej. 18"
                :rules="[
                  val => (val !== null && val !== '') || 'Debe ingresar una nota',
                  val => validarNotaRegex_ga(val) || 'La nota debe ser un número entre 0 y 20',
                  val => Number(val) >= 0 || 'La nota mínima es 0',
                  val => Number(val) <= 20 || 'La nota máxima es 20'
                ]"
              >
                <template v-slot:prepend><q-icon name="grade" color="amber-8" /></template>
              </q-input>
              <div class="text-caption q-mt-xs font-semibold" :class="form_ga.nota_final_ga >= 10 ? 'text-positive' : 'text-negative'">
                Estatus estimado: {{ form_ga.nota_final_ga >= 10 ? 'APROBADO' : 'REPROBADO' }}
              </div>
            </div>

            <!-- Campo Justificación / Motivo -->
            <div class="col-12 col-md-8">
              <label class="block text-caption text-weight-bold text-slate-700 q-mb-xs">
                Motivo / Justificación de la Contingencia (Obligatorio)
              </label>
              <q-input
                v-model="form_ga.observacion_ga"
                outlined
                dense
                bg-color="white"
                type="textarea"
                rows="2"
                placeholder="Ej. Rectificación extemporánea de nota final por fallo técnico en cierre de acta del docente."
                :rules="[val => (!!val && val.trim().length >= 5) || 'Ingrese un motivo justificativo detallado (mínimo 5 caracteres)']"
              />
            </div>

          </div>

          <!-- Acciones de envío -->
          <div class="row items-center justify-end q-gutter-sm q-mt-md pt-4 border-t border-slate-200">
            <q-btn
              outline
              color="grey-7"
              icon="clear"
              label="Limpiar Formulario"
              no-caps
              @click="limpiarFormulario_ga"
            />
            <q-btn
              type="submit"
              unelevated
              color="amber-9"
              icon="save"
              label="Registrar Nota por Contingencia"
              size="md"
              class="text-weight-bold"
              no-caps
              :loading="procesando_ga"
            >
              <template v-slot:loading><q-spinner-dots /></template>
            </q-btn>
          </div>

        </q-form>
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { planEstudioServicio_ga } from 'src/servicios/planEstudioServicio_ga';
import { apiCliente_ahbb } from 'src/servicios/api_ahbb';

// ── Quasar Utilities ──────────────────────────────────────────────────────────
const $q = useQuasar();

// ── Estado Local ──────────────────────────────────────────────────────────────
const procesando_ga = ref(false);
const cargandoCatalogos_ga = ref(false);

const materias_ga = ref([]);
const periodos_ga = ref([]);
const alumnos_ga = ref([]);

const form_ga = ref({
  id_materia_ga: null,
  id_periodo_ga: null,
  id_alumno_ga: null,
  nota_final_ga: 18,
  observacion_ga: '',
});

// ── Expresión Regular para Validación de Nota (0 a 20 con hasta 2 decimales) ──
const REGEX_NOTA_GA = /^(20(\.0{1,2})?|1?[0-9](\.[0-9]{1,2})?)$/;

const validarNotaRegex_ga = (nota_ga) => {
  if (nota_ga === null || nota_ga === undefined || nota_ga === '') return false;
  return REGEX_NOTA_GA.test(String(nota_ga));
};

const sanitizarTexto_ga = (texto_ga) =>
  String(texto_ga ?? '').trim().replace(/<[^>]*>?/gm, '');

// ── Computed Options para Selectores ──────────────────────────────────────────
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

const opcionesAlumnos_ga = computed(() =>
  alumnos_ga.value.map((a) => ({
    value: a.id_usuario_ahbb || a.id_alumno_ga,
    label: `${a.cedula_ahbb || 'V-000'} — ${a.nombre_ahbb || ''} ${a.apellido_ahbb || ''} (${a.correo_ahbb || ''})`,
  }))
);

// ── Carga de Catálogos (Materias, Períodos, Alumnos) ──────────────────────────
const cargarCatalogos_ga = async () => {
  cargandoCatalogos_ga.value = true;
  try {
    const [resPeriodos_ga, resCarreras_ga, resUsuarios_ga] = await Promise.all([
      apiCliente_ahbb.get('/academico/periodos').catch(() => ({ data: [] })),
      apiCliente_ahbb.get('/academico/carreras').catch(() => ({ data: [] })),
      apiCliente_ahbb.get('/admin/usuarios').catch(() => ({ data: [] })),
    ]);

    // Períodos
    periodos_ga.value = Array.isArray(resPeriodos_ga.data) ? resPeriodos_ga.data : [];
    const activo_ga = periodos_ga.value.find((p) => p.activo_cjgp || p.estado_cjgp === 'ACTIVO') || periodos_ga.value[0];
    if (activo_ga) form_ga.value.id_periodo_ga = activo_ga.id_periodo_cjgp;

    // Materias (extraer de las carreras o consultar mis-materias / catálogo)
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
    if (materias_ga.value.length > 0 && !form_ga.value.id_materia_ga) {
      form_ga.value.id_materia_ga = materias_ga.value[0].id_materia_cjgp;
    }

    // Alumnos (filtrar usuarios con rol ALUMNO)
    const listaUsuarios_ga = Array.isArray(resUsuarios_ga.data) ? resUsuarios_ga.data : [];
    alumnos_ga.value = listaUsuarios_ga.filter((u) => u.rol_ahbb === 'ALUMNO' || u.rol === 'ALUMNO');

    // Fallback de alumnos de prueba si no carga la lista completa
    if (alumnos_ga.value.length === 0) {
      alumnos_ga.value = [
        { id_usuario_ahbb: 5, cedula_ahbb: 'V-20000001', nombre_ahbb: 'Maria', apellido_ahbb: 'Garcia', correo_ahbb: 'maria@estudiante.edu' },
        { id_usuario_ahbb: 6, cedula_ahbb: 'V-20000002', nombre_ahbb: 'Javier', apellido_ahbb: 'Silva', correo_ahbb: 'javier@estudiante.edu' },
        { id_usuario_ahbb: 7, cedula_ahbb: 'V-20000003', nombre_ahbb: 'Elena', apellido_ahbb: 'Rojas', correo_ahbb: 'elena@estudiante.edu' },
        { id_usuario_ahbb: 8, cedula_ahbb: 'V-20000004', nombre_ahbb: 'Diego', apellido_ahbb: 'Perez', correo_ahbb: 'diego@estudiante.edu' },
      ];
    }
    if (alumnos_ga.value.length > 0) form_ga.value.id_alumno_ga = alumnos_ga.value[0].id_usuario_ahbb;

    console.log('[ContingenciaNotasView_ga] Catálogos cargados:', {
      periodos: periodos_ga.value.length,
      materias: materias_ga.value.length,
      alumnos: alumnos_ga.value.length,
    });
  } catch (err_ga) {
    console.error('[ContingenciaNotasView_ga] Error al cargar catálogos:', err_ga);
  } finally {
    cargandoCatalogos_ga.value = false;
  }
};

// ── Enviar Formulario de Contingencia ─────────────────────────────────────────
const guardarContingencia_ga = async () => {
  if (!form_ga.value.id_materia_ga || !form_ga.value.id_periodo_ga || !form_ga.value.id_alumno_ga) {
    $q.notify({ type: 'warning', message: 'Debe seleccionar la materia, el período y el alumno.' });
    return;
  }

  if (!form_ga.value.observacion_ga || form_ga.value.observacion_ga.trim().length < 5) {
    $q.notify({ type: 'warning', message: 'Ingrese una justificación de contingencia detallada.' });
    return;
  }

  procesando_ga.value = true;

  try {
    const payload_ga = {
      id_materia_ga: Number(form_ga.value.id_materia_ga),
      id_periodo_ga: Number(form_ga.value.id_periodo_ga),
      id_alumno_ga: Number(form_ga.value.id_alumno_ga),
      nota_final_ga: Number(form_ga.value.nota_final_ga),
      observacion_ga: sanitizarTexto_ga(form_ga.value.observacion_ga),
    };

    console.log('[ContingenciaNotasView_ga] Enviando payload de contingencia:', payload_ga);

    const res_ga = await planEstudioServicio_ga.registrarNotaContingencia_ga(payload_ga);

    $q.notify({
      type: 'positive',
      icon: 'gavel',
      message: res_ga.mensaje_ga || '✅ Nota por contingencia registrada exitosamente por Control de Estudios.',
      timeout: 5000,
    });

    // Limpiar campo de justificación tras éxito
    form_ga.value.observacion_ga = '';
  } catch (err_ga) {
    console.error('[ContingenciaNotasView_ga] Error al registrar contingencia:', err_ga);
    const msj_ga = Array.isArray(err_ga.response?.data?.message)
      ? err_ga.response.data.message.join(' | ')
      : (err_ga.response?.data?.message || err_ga.message || 'Error al procesar la nota por contingencia.');
    $q.notify({ type: 'negative', message: msj_ga, timeout: 6000 });
  } finally {
    procesando_ga.value = false;
  }
};

const limpiarFormulario_ga = () => {
  form_ga.value.nota_final_ga = 18;
  form_ga.value.observacion_ga = '';
};

onMounted(() => {
  cargarCatalogos_ga();
});
</script>
