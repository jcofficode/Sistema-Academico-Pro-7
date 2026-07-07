<!-- MisComprasView_ahbb.vue — Historial de compras del usuario con vista de factura -->
<script setup>
import { onMounted, ref, computed } from 'vue';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { date, useQuasar } from 'quasar';
import { obtenerPdfFactura_ahbb } from '../../servicios/tiendaServicio_ahbb';

const tiendaStore = useTiendaStore_ahbb();
const $q = useQuasar();
const cargando = ref(true);

// Filtros
const filtroBusqueda_ahbb = ref('');

// Modo de filtro de fecha: 'anio' | 'mes' | 'exacta'
const modoFechaFiltro_ahbb = ref('anio');
const filtroAnio_ahbb = ref('');       // ej. "2026"
const filtroMes_ahbb = ref('');        // ej. "2026-04"
const filtroFechaExacta_ahbb = ref(''); // ej. "2026-04-05"

const modosFechaOpciones_ahbb = [
  { label: 'Por Año', value: 'anio', icon: 'event_note' },
  { label: 'Por Mes', value: 'mes', icon: 'calendar_view_month' },
  { label: 'Fecha Exacta', value: 'exacta', icon: 'today' },
];

// Modal factura
const facturaSeleccionada_ahbb = ref(null);
const modalFactura_ahbb = ref(false);

const abrirFactura_ahbb = (factura) => {
  facturaSeleccionada_ahbb.value = factura;
  modalFactura_ahbb.value = true;
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—';
  return date.formatDate(fechaStr, 'DD/MM/YYYY HH:mm');
};

const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return '—';
  return date.formatDate(fechaStr, 'DD MMM YYYY');
};

const getEstadoColor = (estado) => {
  switch (estado) {
    case 'pagada': return 'positive';
    case 'pendiente': return 'warning';
    case 'cancelada': return 'negative';
    default: return 'grey';
  }
};

const getEstadoLabel = (estado) => {
  switch (estado) {
    case 'pagada': return 'Pagada';
    case 'pendiente': return 'En Revisión';
    case 'cancelada': return 'Cancelada';
    default: return estado;
  }
};

// Filtrado reactivo del historial
const facturasFiltradas_ahbb = computed(() => {
  let lista = tiendaStore.historialFacturas_ahbb;

  // Filtrar por referencia de pago
  if (filtroBusqueda_ahbb.value.trim()) {
    const q = filtroBusqueda_ahbb.value.trim().toLowerCase();
    lista = lista.filter(f =>
      f.nroReferenciaPago_ahbb?.toLowerCase().includes(q)
    );
  }

  // Filtrar por fecha según el modo seleccionado
  lista = lista.filter(f => {
    const fecha = new Date(f.fechaFactura_ahbb);
    if (modoFechaFiltro_ahbb.value === 'anio' && filtroAnio_ahbb.value) {
      return fecha.getFullYear() === Number(filtroAnio_ahbb.value);
    }
    if (modoFechaFiltro_ahbb.value === 'mes' && filtroMes_ahbb.value) {
      const [anio, mes] = filtroMes_ahbb.value.split('-').map(Number);
      return fecha.getFullYear() === anio && fecha.getMonth() + 1 === mes;
    }
    if (modoFechaFiltro_ahbb.value === 'exacta' && filtroFechaExacta_ahbb.value) {
      const [anio, mes, dia] = filtroFechaExacta_ahbb.value.split('-').map(Number);
      return fecha.getFullYear() === anio && fecha.getMonth() + 1 === mes && fecha.getDate() === dia;
    }
    return true; // sin filtro activo
  });

  return lista;
});

// Detecta si hay algún filtro de fecha activo
const hayFiltroFecha_ahbb = computed(() =>
  (modoFechaFiltro_ahbb.value === 'anio' && !!filtroAnio_ahbb.value) ||
  (modoFechaFiltro_ahbb.value === 'mes' && !!filtroMes_ahbb.value) ||
  (modoFechaFiltro_ahbb.value === 'exacta' && !!filtroFechaExacta_ahbb.value)
);

// Calcular desglose IVA localmente si el backend no lo trae (fallback)
const getDesglose_ahbb = (factura) => {
  if (factura.desglose_ahbb) return factura.desglose_ahbb;
  // Fallback: calcular en el front con IVA 16%
  const subtotal = factura.detalles_ahbb?.reduce((acc, d) =>
    acc + Number(d.precioUnitario_ahbb) * d.cantidad_ahbb, 0) ?? 0;
  const iva = subtotal * 0.16;
  return {
    subtotal: +subtotal.toFixed(2),
    ivaPorcentaje: 16,
    ivaMontoUSD: +iva.toFixed(2),
    totalConIva: +(subtotal + iva).toFixed(2),
  };
};

const limpiarFiltros_ahbb = () => {
  filtroBusqueda_ahbb.value = '';
  filtroAnio_ahbb.value = '';
  filtroMes_ahbb.value = '';
  filtroFechaExacta_ahbb.value = '';
};

// Imprimir / Exportar PDF de la factura
const imprimirFactura_ahbb = async (factura) => {
  if (!factura) return;

  let cargandoNotificacion = null;
  try {
    cargandoNotificacion = $q.notify({
      spinner: true,
      message: 'Generando PDF de la factura...',
      color: 'primary',
      timeout: 0,
      position: 'center'
    });

    const response = await obtenerPdfFactura_ahbb(factura.id_factura_ahbb);
    
    // Convertir el blob a URL
    const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    
    if (cargandoNotificacion) cargandoNotificacion(); // cierra la notificacion

    // Abrir visor de pdf nativo en una nueva pestaña
    const ventana = window.open(fileURL, '_blank');
    if (!ventana) {
      $q.notify({ type: 'warning', message: 'Por favor, permite ventanas emergentes para ver el PDF.', position: 'top' });
    } else {
      ventana.focus();
    }
  } catch (error) {
    if (cargandoNotificacion) cargandoNotificacion();
    console.error('Error al descargar el PDF de la factura:', error);
    $q.notify({ type: 'negative', message: 'Error al generar el documento PDF desde el servidor.', position: 'top' });
  }
};

onMounted(async () => {
  await tiendaStore.cargarHistorial_ahbb();
  cargando.value = false;
});
</script>

<template>
  <q-page class="q-pa-md">
    <!-- Encabezado -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="primary" to="/tienda" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold">Mis Compras</div>
        <div class="text-caption text-grey-6">Historial de tus transacciones</div>
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-pa-md q-mb-lg">
      <div class="row q-col-gutter-md items-end">

        <!-- Buscar por referencia -->
        <div class="col-12 col-md-4">
          <q-input
            v-model="filtroBusqueda_ahbb"
            outlined dense
            label="Buscar por Nro. de Referencia"
            clearable
          >
            <template v-slot:prepend><q-icon name="receipt" /></template>
          </q-input>
        </div>

        <!-- Selector de modo de fecha -->
        <div class="col-12 col-md-4">
          <div class="text-caption text-grey-7 q-mb-xs">Filtrar por fecha:</div>
          <q-btn-toggle
            v-model="modoFechaFiltro_ahbb"
            :options="modosFechaOpciones_ahbb"
            unelevated
            rounded
            toggle-color="primary"
            color="grey-2"
            text-color="grey-8"
            size="sm"
            class="full-width"
          />
        </div>

        <!-- Input dinámico según modo -->
        <div class="col-12 col-md-3">
          <!-- Por Año -->
          <q-select
            v-if="modoFechaFiltro_ahbb === 'anio'"
            v-model="filtroAnio_ahbb"
            :options="[2024, 2025, 2026, 2027].map(String)"
            outlined dense
            label="Seleccionar Año"
            clearable
            emit-value
          >
            <template v-slot:prepend><q-icon name="event_note" /></template>
          </q-select>

          <!-- Por Mes -->
          <q-input
            v-else-if="modoFechaFiltro_ahbb === 'mes'"
            v-model="filtroMes_ahbb"
            outlined dense
            label="Seleccionar Mes"
            type="month"
          >
            <template v-slot:prepend><q-icon name="calendar_view_month" /></template>
          </q-input>

          <!-- Fecha Exacta -->
          <q-input
            v-else
            v-model="filtroFechaExacta_ahbb"
            outlined dense
            label="Fecha Exacta"
            type="date"
          >
            <template v-slot:prepend><q-icon name="today" /></template>
          </q-input>
        </div>

        <!-- Limpiar -->
        <div class="col-12 col-md-1">
          <q-btn
            flat round
            color="grey-7"
            icon="filter_list_off"
            @click="limpiarFiltros_ahbb"
            :disable="!filtroBusqueda_ahbb && !hayFiltroFecha_ahbb"
          >
            <q-tooltip>Limpiar filtros</q-tooltip>
          </q-btn>
        </div>

      </div>
    </q-card>

    <!-- Cargando -->
    <div v-if="cargando" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Lista de compras -->
    <div v-else-if="facturasFiltradas_ahbb.length > 0">
      <div class="row q-col-gutter-md">
        <div
          class="col-12"
          v-for="factura in facturasFiltradas_ahbb"
          :key="factura.id_factura_ahbb"
        >
          <q-card bordered flat class="compra-card">
            <!-- Cabecera de la compra -->
            <q-card-section class="bg-grey-1 q-py-sm">
              <div class="row justify-between items-center">
                <div class="row items-center q-gutter-sm">
                  <q-icon name="receipt_long" color="primary" size="1.2rem" />
                  <div>
                    <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Fecha de Compra</div>
                    <div class="text-body2 text-weight-bold">{{ formatearFecha(factura.fechaFactura_ahbb) }}</div>
                  </div>
                  <q-separator vertical class="q-mx-sm" />
                  <div>
                    <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Ref. de Pago</div>
                    <div class="text-body2 text-mono">
                      {{ factura.nroReferenciaPago_ahbb || '—' }}
                    </div>
                  </div>
                </div>
                <div class="row items-center q-gutter-sm">
                  <q-chip
                    :color="getEstadoColor(factura.estadoFactura_ahbb)"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ getEstadoLabel(factura.estadoFactura_ahbb) }}
                  </q-chip>
                  <div class="text-primary text-weight-bold text-body1">
                    ${{ getDesglose_ahbb(factura).totalConIva.toFixed(2) }}
                  </div>
                  <!-- Ojito para ver factura completa -->
                  <q-btn
                    round flat dense
                    icon="visibility"
                    color="primary"
                    size="sm"
                    @click="abrirFactura_ahbb(factura)"
                    title="Ver factura completa"
                  >
                    <q-tooltip>Ver factura detallada</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Lista resumida de productos -->
            <q-card-section class="q-py-sm">
              <div
                class="row items-center q-py-xs q-gutter-sm"
                v-for="detalle in factura.detalles_ahbb"
                :key="detalle.id_detalle_factura_ahbb"
              >
                <q-avatar rounded size="40px" class="q-mr-sm">
                  <img
                    :src="detalle.producto_ahbb?.imagen_ahbb || 'https://via.placeholder.com/80'"
                    :alt="detalle.producto_ahbb?.nombre_ahbb"
                  />
                </q-avatar>
                <div class="col">
                  <div class="text-body2 text-weight-medium">{{ detalle.producto_ahbb?.nombre_ahbb }}</div>
                  <div class="text-caption text-grey-7">
                    {{ detalle.cantidad_ahbb }} × ${{ Number(detalle.precioUnitario_ahbb).toFixed(2) }}
                  </div>
                </div>
                <div class="text-body2 text-weight-bold text-right" style="min-width: 80px;">
                  ${{ (detalle.cantidad_ahbb * Number(detalle.precioUnitario_ahbb)).toFixed(2) }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Sin compras -->
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="receipt_long" size="64px" />
      <div class="text-h6 q-mt-md">
        {{ tiendaStore.historialFacturas_ahbb.length === 0 ? 'Aún no has realizado ninguna compra' : 'No se encontraron compras con esos filtros' }}
      </div>
      <q-btn
        v-if="tiendaStore.historialFacturas_ahbb.length === 0"
        unelevated color="primary" label="Visitar Tienda" to="/tienda" class="q-mt-md"
      />
      <q-btn
        v-else
        flat color="primary" label="Limpiar filtros" icon="filter_list_off"
        @click="limpiarFiltros_ahbb" class="q-mt-md"
      />
    </div>

    <!-- ===== MODAL FACTURA COMPLETA ===== -->
    <q-dialog v-model="modalFactura_ahbb" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <!-- Toolbar del modal -->
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title>Factura Detallada</q-toolbar-title>
          <q-btn flat rounded icon="picture_as_pdf" label="Exportar PDF" @click="imprimirFactura_ahbb(facturaSeleccionada_ahbb)" />
        </q-toolbar>

        <!-- Contenido de la factura, estilo hoja en blanco -->
        <q-card-section class="flex flex-center bg-grey-3" style="min-height: calc(100vh - 56px);">
          <div class="factura-hoja q-pa-xl bg-white" v-if="facturaSeleccionada_ahbb">

            <!-- Membrete -->
            <div class="row justify-between items-start q-mb-xl">
              <div>
                <div class="text-h4 text-weight-bolder text-primary row items-center q-gutter-x-sm" style="font-family: 'Outfit', sans-serif;">
                  <img src="/graduation-cap.png" alt="Logo" style="width:32px;height:32px;object-fit:contain;" />
                  <span>Academia <span style="color: #f59e0b;">H&B</span></span>
                </div>
                <div class="text-caption text-grey-7 q-mt-xs">merch@academiahb.com</div>
                <div class="text-caption text-grey-7">Caracas, Venezuela</div>
                <div class="text-caption text-grey-7">RIF: J-1234567-8</div>
              </div>
              <div class="text-right">
                <div class="text-overline text-grey-6 text-uppercase">Comprobante de Compra</div>
                <div class="text-h5 text-weight-bold text-dark q-mt-xs">
                  REF: {{ facturaSeleccionada_ahbb.nroReferenciaPago_ahbb }}
                </div>
                <div class="text-body2 text-grey-7">{{ formatearFecha(facturaSeleccionada_ahbb.fechaFactura_ahbb) }}</div>
                <q-chip
                  :color="getEstadoColor(facturaSeleccionada_ahbb.estadoFactura_ahbb)"
                  text-color="white"
                  size="sm"
                  class="q-mt-xs"
                >
                  {{ getEstadoLabel(facturaSeleccionada_ahbb.estadoFactura_ahbb) }}
                </q-chip>
              </div>
            </div>

            <q-separator class="q-mb-lg" />

            <!-- Tabla de productos -->
            <div class="text-subtitle2 text-uppercase text-grey-7 q-mb-sm">Detalle de Productos</div>
            <q-markup-table flat bordered separator="cell" class="q-mb-lg">
              <thead>
                <tr class="bg-primary text-white">
                  <th class="text-left">Producto</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">P. Unitario</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in facturaSeleccionada_ahbb.detalles_ahbb" :key="d.id_detalle_factura_ahbb">
                  <td>
                    <div class="row items-center q-gutter-sm">
                      <q-avatar rounded size="36px">
                        <img :src="d.producto_ahbb?.imagen_ahbb || 'https://via.placeholder.com/80'" />
                      </q-avatar>
                      <div>
                        <div class="text-body2 text-weight-medium">{{ d.producto_ahbb?.nombre_ahbb }}</div>
                        <div class="text-caption text-grey-6 text-capitalize">{{ d.producto_ahbb?.categoria_ahbb }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-center">{{ d.cantidad_ahbb }}</td>
                  <td class="text-right">${{ Number(d.precioUnitario_ahbb).toFixed(2) }}</td>
                  <td class="text-right text-weight-bold">${{ (d.cantidad_ahbb * Number(d.precioUnitario_ahbb)).toFixed(2) }}</td>
                </tr>
              </tbody>
            </q-markup-table>

            <!-- Desglose fiscal -->
            <div class="row justify-end">
              <div style="min-width: 280px;">
                <div class="row justify-between q-py-xs">
                  <span class="text-grey-7">Subtotal (sin IVA)</span>
                  <span class="text-weight-medium">${{ getDesglose_ahbb(facturaSeleccionada_ahbb).subtotal.toFixed(2) }}</span>
                </div>
                <div class="row justify-between q-py-xs">
                  <span class="text-grey-7">IVA ({{ getDesglose_ahbb(facturaSeleccionada_ahbb).ivaPorcentaje }}%)</span>
                  <span class="text-weight-medium">${{ getDesglose_ahbb(facturaSeleccionada_ahbb).ivaMontoUSD.toFixed(2) }}</span>
                </div>
                <q-separator class="q-my-sm" />
                <div class="row justify-between q-py-xs bg-primary text-white q-px-sm" style="border-radius: 6px;">
                  <span class="text-weight-bold text-body1">TOTAL</span>
                  <span class="text-weight-bolder text-h6">${{ getDesglose_ahbb(facturaSeleccionada_ahbb).totalConIva.toFixed(2) }}</span>
                </div>
                <div class="text-caption text-grey-6 q-mt-xs text-right">
                  * IVA calculado según SENIAT ({{ getDesglose_ahbb(facturaSeleccionada_ahbb).ivaPorcentaje }}%)
                </div>
              </div>
            </div>

            <!-- Pie de la factura -->
            <q-separator class="q-mt-xl q-mb-md" />
            <div class="text-center text-caption text-grey-6">
              Academia H&B — Tu academia de certificaciones de confianza.<br/>
              Este comprobante es válido como constancia de pago.
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.compra-card {
  transition: box-shadow 0.2s ease;
}
.compra-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.factura-hoja {
  width: 100%;
  max-width: 760px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.text-mono {
  font-family: 'Courier New', monospace;
}

@media print {
  .q-toolbar { display: none !important; }
  .bg-grey-3 { background: white !important; }
  .factura-hoja { box-shadow: none !important; }
}
</style>
