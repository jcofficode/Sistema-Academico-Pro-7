<!--
  AuditoriaSistemaView_jc.vue — Auditoría general del sistema.

  Responde a "¿quién hizo qué, cuándo y sobre quién?" en TODA la plataforma:
  quién puso notas, quién cambió una contraseña, quién emitió un acta, quién
  confirmó un pago, quién asignó un rol…

  La bitácora se alimenta de dos fuentes (ver `auditoria.service_jc.ts`):
  el interceptor global, que registra toda petición que modifica datos, y los
  servicios de negocio, que añaden el contexto académico.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  consultarAuditoria_jc,
  obtenerResumenAuditoria_jc,
  obtenerCatalogosAuditoria_jc,
} from '../../servicios/seguridadServicio_jc';

const $q = useQuasar();

const resumen_jc = ref(null);
const catalogos_jc = ref({ modulos: [], acciones: [] });
const resultado_jc = ref({ registros: [], total: 0, pagina: 1, totalPaginas: 1 });
const cargando_jc = ref(false);
const detalleAbierto_jc = ref(null);

const filtros_jc = ref({
  modulo_jc: null,
  accion_jc: null,
  busqueda_jc: '',
  desde_jc: null,
  hasta_jc: null,
  pagina_jc: 1,
  limite_jc: 25,
});

/** Color e icono según el módulo, para leer la bitácora de un vistazo. */
const PRESENTACION_MODULO_JC = {
  CONTROL_ESTUDIOS: { color: 'teal', icono: 'fact_check' },
  SEGURIDAD: { color: 'red', icono: 'lock' },
  USUARIOS: { color: 'deep-purple', icono: 'group' },
  ACADEMICO: { color: 'indigo', icono: 'account_tree' },
  PAGOS: { color: 'green', icono: 'payments' },
  PLANIFICACION: { color: 'orange', icono: 'edit_note' },
  MULTIMEDIA: { color: 'pink', icono: 'ondemand_video' },
  SISTEMA: { color: 'blue-grey', icono: 'settings' },
};

const presentacion_jc = (modulo_jc) =>
  PRESENTACION_MODULO_JC[modulo_jc] ?? { color: 'grey', icono: 'help' };

const columnas_jc = [
  { name: 'fecha', label: 'Fecha y hora', field: 'creadoEn_jc', align: 'left', sortable: true },
  { name: 'usuario', label: 'Quién', field: 'nombreUsuario_jc', align: 'left' },
  { name: 'modulo', label: 'Módulo', field: 'modulo_jc', align: 'center' },
  { name: 'accion', label: 'Acción', field: 'etiquetaAccion_jc', align: 'left' },
  { name: 'descripcion', label: 'Qué hizo', field: 'descripcion_jc', align: 'left' },
  { name: 'resultado', label: '', field: 'resultado_jc', align: 'center' },
];

const formatearFecha_jc = (fecha_jc) =>
  fecha_jc
    ? new Date(fecha_jc).toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const opcionesAccion_jc = computed(() =>
  catalogos_jc.value.acciones.map((accion_jc) => ({
    label: accion_jc.etiqueta,
    value: accion_jc.valor,
  })),
);

const consultar_jc = async () => {
  cargando_jc.value = true;
  try {
    const filtrosLimpios_jc = Object.fromEntries(
      Object.entries(filtros_jc.value).filter(
        ([, valor_jc]) => valor_jc !== null && valor_jc !== '',
      ),
    );
    resultado_jc.value = await consultarAuditoria_jc(filtrosLimpios_jc);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo consultar la bitácora.' });
  } finally {
    cargando_jc.value = false;
  }
};

const cargarResumen_jc = async () => {
  try {
    resumen_jc.value = await obtenerResumenAuditoria_jc(filtros_jc.value.modulo_jc);
  } catch {
    resumen_jc.value = null;
  }
};

const aplicarFiltros_jc = () => {
  filtros_jc.value.pagina_jc = 1;
  consultar_jc();
  cargarResumen_jc();
};

const limpiarFiltros_jc = () => {
  filtros_jc.value = {
    modulo_jc: null,
    accion_jc: null,
    busqueda_jc: '',
    desde_jc: null,
    hasta_jc: null,
    pagina_jc: 1,
    limite_jc: 25,
  };
  aplicarFiltros_jc();
};

const cambiarPagina_jc = (pagina_jc) => {
  filtros_jc.value.pagina_jc = pagina_jc;
  consultar_jc();
};

onMounted(async () => {
  try {
    catalogos_jc.value = await obtenerCatalogosAuditoria_jc();
  } catch {
    // Sin catálogos la vista sigue siendo usable con búsqueda libre
  }
  consultar_jc();
  cargarResumen_jc();
});
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Auditoría del Sistema</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Bitácora completa de la plataforma: quién hizo qué, cuándo y sobre quién — Seguridad (JC)
    </div>

    <!-- Indicadores -->
    <div v-if="resumen_jc" class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="primary" text-color="white" icon="history" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.total }}</div>
              <div class="text-caption text-grey-7">eventos registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="teal" text-color="white" icon="today" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.hoy }}</div>
              <div class="text-caption text-grey-7">actividad de hoy</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="deep-orange" text-color="white" icon="report_problem" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.errores }}</div>
              <div class="text-caption text-grey-7">intentos fallidos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="deep-purple" text-color="white" icon="groups" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.porUsuario.length }}</div>
              <div class="text-caption text-grey-7">usuarios con actividad</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Rankings -->
    <div v-if="resumen_jc" class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="text-subtitle2 text-weight-bold q-pb-xs">
            Actividad por módulo
          </q-card-section>
          <q-list dense>
            <q-item v-for="modulo_jc in resumen_jc.porModulo" :key="modulo_jc.modulo">
              <q-item-section avatar>
                <q-icon
                  :name="presentacion_jc(modulo_jc.modulo).icono"
                  :color="presentacion_jc(modulo_jc.modulo).color"
                />
              </q-item-section>
              <q-item-section>{{ modulo_jc.modulo }}</q-item-section>
              <q-item-section side>
                <q-badge :color="presentacion_jc(modulo_jc.modulo).color" :label="modulo_jc.total" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="text-subtitle2 text-weight-bold q-pb-xs">
            Acciones más frecuentes
          </q-card-section>
          <q-list dense>
            <q-item v-for="accion_jc in resumen_jc.porAccion" :key="accion_jc.accion">
              <q-item-section>{{ accion_jc.etiqueta }}</q-item-section>
              <q-item-section side><q-badge color="primary" :label="accion_jc.total" /></q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="text-subtitle2 text-weight-bold q-pb-xs">
            Usuarios más activos
          </q-card-section>
          <q-list dense>
            <q-item v-for="usuario_jc in resumen_jc.porUsuario" :key="usuario_jc.usuario">
              <q-item-section>
                <q-item-label>{{ usuario_jc.usuario }}</q-item-label>
                <q-item-label caption>{{ usuario_jc.rol }}</q-item-label>
              </q-item-section>
              <q-item-section side><q-badge color="teal" :label="usuario_jc.total" /></q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-pa-sm q-mb-sm">
      <div class="row q-col-gutter-sm items-center">
        <div class="col-12 col-md-3">
          <q-input
            v-model="filtros_jc.busqueda_jc"
            label="Buscar en la descripción o el usuario"
            outlined
            dense
            clearable
            debounce="500"
            @update:model-value="aplicarFiltros_jc"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-6 col-md-2">
          <q-select
            v-model="filtros_jc.modulo_jc"
            :options="catalogos_jc.modulos"
            clearable
            label="Módulo"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
        <div class="col-6 col-md-3">
          <q-select
            v-model="filtros_jc.accion_jc"
            :options="opcionesAccion_jc"
            emit-value
            map-options
            clearable
            label="Acción"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            v-model="filtros_jc.desde_jc"
            type="date"
            label="Desde"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            v-model="filtros_jc.hasta_jc"
            type="date"
            label="Hasta"
            outlined
            dense
            @update:model-value="aplicarFiltros_jc"
          />
        </div>
      </div>
      <div class="row justify-end q-mt-xs">
        <q-btn flat dense size="sm" icon="filter_alt_off" label="Limpiar filtros" @click="limpiarFiltros_jc" />
      </div>
    </q-card>

    <!-- Bitácora -->
    <q-table
      :rows="resultado_jc.registros"
      :columns="columnas_jc"
      row-key="id_auditoria_jc"
      :loading="cargando_jc"
      flat
      bordered
      dense
      hide-pagination
      :rows-per-page-options="[0]"
    >
      <template #body-cell-fecha="props">
        <q-td :props="props" class="text-caption">
          {{ formatearFecha_jc(props.row.creadoEn_jc) }}
        </q-td>
      </template>

      <template #body-cell-usuario="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.nombreUsuario_jc ?? 'Sistema' }}</div>
          <div class="text-caption text-grey-7">{{ props.row.rolUsuario_jc ?? '—' }}</div>
        </q-td>
      </template>

      <template #body-cell-modulo="props">
        <q-td :props="props" class="text-center">
          <q-chip
            dense
            size="sm"
            :color="`${presentacion_jc(props.row.modulo_jc).color}-1`"
            :text-color="`${presentacion_jc(props.row.modulo_jc).color}-9`"
            :icon="presentacion_jc(props.row.modulo_jc).icono"
          >
            {{ props.row.modulo_jc }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-descripcion="props">
        <q-td :props="props">
          <div>{{ props.row.descripcion_jc }}</div>
          <div v-if="props.row.afectado_jc" class="text-caption text-grey-7">
            Afecta a: {{ props.row.afectado_jc.nombre_ahbb }} {{ props.row.afectado_jc.apellido_ahbb }}
            ({{ props.row.afectado_jc.cedula_ahbb }})
          </div>
          <q-btn
            v-if="props.row.detalle_jc"
            flat
            dense
            size="sm"
            color="primary"
            icon="unfold_more"
            label="Ver detalle"
            @click="detalleAbierto_jc = props.row"
          />
        </q-td>
      </template>

      <template #body-cell-resultado="props">
        <q-td :props="props" class="text-center">
          <q-icon
            :name="props.row.resultado_jc === 'EXITO' ? 'check_circle' : 'error'"
            :color="props.row.resultado_jc === 'EXITO' ? 'green' : 'negative'"
          >
            <q-tooltip>
              {{ props.row.metodo_jc }} {{ props.row.ruta_jc }} ·
              HTTP {{ props.row.estadoHttp_jc ?? '—' }} ·
              {{ props.row.duracionMs_jc ?? '—' }} ms · IP {{ props.row.ip_jc ?? '—' }}
            </q-tooltip>
          </q-icon>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width text-center text-grey-6 q-pa-lg">
          No hay eventos que coincidan con los filtros seleccionados.
        </div>
      </template>
    </q-table>

    <div class="row items-center justify-between q-mt-sm">
      <div class="text-caption text-grey-7">
        {{ resultado_jc.total }} evento(s) · página {{ resultado_jc.pagina }} de
        {{ resultado_jc.totalPaginas }}
      </div>
      <q-pagination
        v-if="resultado_jc.totalPaginas > 1"
        :model-value="resultado_jc.pagina"
        :max="resultado_jc.totalPaginas"
        :max-pages="7"
        boundary-numbers
        direction-links
        @update:model-value="cambiarPagina_jc"
      />
    </div>

    <!-- Detalle técnico del evento -->
    <q-dialog :model-value="!!detalleAbierto_jc" @hide="detalleAbierto_jc = null">
      <q-card style="min-width: 520px; max-width: 92vw">
        <q-card-section class="text-subtitle1 text-weight-bold">
          Detalle del evento
        </q-card-section>
        <q-card-section v-if="detalleAbierto_jc" class="text-caption">
          <div><strong>Quién:</strong> {{ detalleAbierto_jc.nombreUsuario_jc ?? 'Sistema' }}</div>
          <div><strong>Cuándo:</strong> {{ formatearFecha_jc(detalleAbierto_jc.creadoEn_jc) }}</div>
          <div><strong>Acción:</strong> {{ detalleAbierto_jc.descripcion_jc }}</div>
          <div>
            <strong>Petición:</strong> {{ detalleAbierto_jc.metodo_jc }}
            {{ detalleAbierto_jc.ruta_jc }} · HTTP {{ detalleAbierto_jc.estadoHttp_jc ?? '—' }}
          </div>
          <q-separator class="q-my-sm" />
          <pre class="bg-grey-2 q-pa-sm rounded-borders" style="white-space: pre-wrap; overflow-x: auto">{{
            JSON.stringify(detalleAbierto_jc.detalle_jc, null, 2)
          }}</pre>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
