<template>
  <div class="calendario-contenedor-ahbb q-pa-sm">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold capitalize">
        {{ nombreMes_ahbb }} {{ anioActual_ahbb }}
      </div>
      <div class="row q-gutter-x-sm">
        <q-btn flat round dense icon="chevron_left" @click="cambiarMes_ahbb(-1)" />
        <q-btn flat round dense icon="today" @click="irHoy_ahbb" />
        <q-btn flat round dense icon="chevron_right" @click="cambiarMes_ahbb(1)" />
      </div>
    </div>

    <div class="grid-calendario-ahbb text-center text-weight-medium text-grey-7 q-mb-sm">
      <div v-for="diaSemana_ahbb in diasSemana_ahbb" :key="diaSemana_ahbb">
        {{ diaSemana_ahbb }}
      </div>
    </div>

    <div class="grid-calendario-ahbb">
      <div
        v-for="(dia_ahbb, index_ahbb) in diasDelMes_ahbb"
        :key="index_ahbb"
        class="dia-celda-ahbb flex flex-center relative-position"
        :class="{
          'dia-fuera-mes-ahbb': !dia_ahbb.esMesActual,
          'dia-hoy-ahbb': dia_ahbb.esHoy,
          'dia-seleccionado-ahbb': esDiaSeleccionado_ahbb(dia_ahbb.fechaStr),
        }"
        @click="seleccionarDia_ahbb(dia_ahbb)"
      >
        <span class="z-index-1">{{ dia_ahbb.numero }}</span>

        <div
          v-if="dia_ahbb.esMesActual && obtenerClaseEstado_ahbb(dia_ahbb.fechaStr)"
          class="indicador-estado-ahbb"
          :class="obtenerClaseEstado_ahbb(dia_ahbb.fechaStr)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { date } from 'quasar';

const props = defineProps({
  sesiones_ahbb: { type: Array, default: () => [] },
  marcadores_ahbb: { type: Array, default: () => [] },
});

const emit = defineEmits(['seleccionar-dia', 'update:month-view']);

const hoy_ahbb = new Date();
const fechaVisualizada_ahbb = ref(
  new Date(hoy_ahbb.getFullYear(), hoy_ahbb.getMonth(), 1),
);
const diaSeleccionadoStr_ahbb = ref(date.formatDate(hoy_ahbb, 'YYYY-MM-DD'));

defineExpose({
  cambiarVistaAMes_ahbb(fechaISO) {
    if (!fechaISO) return;
    const [anio, mes] = fechaISO.split('-').map(Number);
    fechaVisualizada_ahbb.value = new Date(anio, mes - 1, 1);
  }
});

const diasSemana_ahbb = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const anioActual_ahbb = computed(() => fechaVisualizada_ahbb.value.getFullYear());
const nombreMes_ahbb = computed(() => {
  const meses_ahbb = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return meses_ahbb[fechaVisualizada_ahbb.value.getMonth()];
});

const marcadoresPorFecha_ahbb = computed(() => {
  const mapa_ahbb = new Map();
  const origenMarcadores_ahbb =
    props.marcadores_ahbb.length > 0
      ? props.marcadores_ahbb
      : props.sesiones_ahbb.map((sesion_ahbb) => ({
          fecha: sesion_ahbb.fecha,
          tipo: 'sesion',
        }));

  for (const marcador_ahbb of origenMarcadores_ahbb) {
    const fechaMarcador_ahbb =
      typeof marcador_ahbb.fecha === 'string'
        ? marcador_ahbb.fecha.split('T')[0]
        : date.formatDate(marcador_ahbb.fecha, 'YYYY-MM-DD');

    const listaFecha_ahbb = mapa_ahbb.get(fechaMarcador_ahbb) ?? [];
    listaFecha_ahbb.push(marcador_ahbb);
    mapa_ahbb.set(fechaMarcador_ahbb, listaFecha_ahbb);
  }

  return mapa_ahbb;
});

const diasDelMes_ahbb = computed(() => {
  const anio_ahbb = fechaVisualizada_ahbb.value.getFullYear();
  const mes_ahbb = fechaVisualizada_ahbb.value.getMonth();
  const primerDia_ahbb = new Date(anio_ahbb, mes_ahbb, 1);
  const diaSemanaInicio_ahbb = primerDia_ahbb.getDay();
  const dias_ahbb = [];
  const ultimoDiaMesAnterior_ahbb = new Date(anio_ahbb, mes_ahbb, 0).getDate();

  for (let indice_ahbb = diaSemanaInicio_ahbb - 1; indice_ahbb >= 0; indice_ahbb -= 1) {
    const fechaRelleno_ahbb = new Date(
      anio_ahbb,
      mes_ahbb - 1,
      ultimoDiaMesAnterior_ahbb - indice_ahbb,
    );
    dias_ahbb.push(crearObjetoDia_ahbb(fechaRelleno_ahbb, false));
  }

  const totalDiasMes_ahbb = new Date(anio_ahbb, mes_ahbb + 1, 0).getDate();
  for (let diaMes_ahbb = 1; diaMes_ahbb <= totalDiasMes_ahbb; diaMes_ahbb += 1) {
    dias_ahbb.push(crearObjetoDia_ahbb(new Date(anio_ahbb, mes_ahbb, diaMes_ahbb), true));
  }

  const celdasRestantes_ahbb = 42 - dias_ahbb.length;
  for (let diaExtra_ahbb = 1; diaExtra_ahbb <= celdasRestantes_ahbb; diaExtra_ahbb += 1) {
    dias_ahbb.push(crearObjetoDia_ahbb(new Date(anio_ahbb, mes_ahbb + 1, diaExtra_ahbb), false));
  }

  return dias_ahbb;
});

function crearObjetoDia_ahbb(fecha_ahbb, esMesActual_ahbb) {
  const fechaStr_ahbb = date.formatDate(fecha_ahbb, 'YYYY-MM-DD');
  return {
    numero: fecha_ahbb.getDate(),
    fechaStr: fechaStr_ahbb,
    esMesActual: esMesActual_ahbb,
    esHoy: date.isSameDate(fecha_ahbb, hoy_ahbb, 'day'),
  };
}

function cambiarMes_ahbb(offset_ahbb) {
  fechaVisualizada_ahbb.value = date.addToDate(fechaVisualizada_ahbb.value, {
    month: offset_ahbb,
  });
}

function irHoy_ahbb() {
  fechaVisualizada_ahbb.value = new Date(hoy_ahbb.getFullYear(), hoy_ahbb.getMonth(), 1);
  seleccionarDia_ahbb(crearObjetoDia_ahbb(hoy_ahbb, true));
}

function seleccionarDia_ahbb(dia_ahbb) {
  diaSeleccionadoStr_ahbb.value = dia_ahbb.fechaStr;
  emit('seleccionar-dia', dia_ahbb.fechaStr);
}

function esDiaSeleccionado_ahbb(fechaStr_ahbb) {
  return diaSeleccionadoStr_ahbb.value === fechaStr_ahbb;
}

function obtenerClaseEstado_ahbb(fechaStr_ahbb) {
  const marcadoresFecha_ahbb = marcadoresPorFecha_ahbb.value.get(fechaStr_ahbb) ?? [];

  if (marcadoresFecha_ahbb.some((marcador_ahbb) => marcador_ahbb.tipo === 'sesion')) {
    return 'estado-sesion-ahbb';
  }

  if (marcadoresFecha_ahbb.some((marcador_ahbb) => marcador_ahbb.tipo === 'tentativo')) {
    return 'estado-tentativo-ahbb';
  }

  return '';
}
</script>

<style scoped>
.grid-calendario-ahbb {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.dia-celda-ahbb {
  height: 50px;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.dia-celda-ahbb:hover {
  background: rgba(var(--q-primary), 0.1);
}

.dia-fuera-mes-ahbb {
  color: #ccc;
  opacity: 0.5;
}

.dia-hoy-ahbb {
  color: var(--q-primary);
  font-weight: bold;
  background: rgba(var(--q-primary), 0.05);
}

.dia-seleccionado-ahbb {
  background: var(--q-primary) !important;
  color: white !important;
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.indicador-estado-ahbb {
  position: absolute;
  bottom: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.estado-sesion-ahbb {
  background-color: #f44336;
  box-shadow: 0 0 5px rgba(244, 67, 54, 0.4);
}

.estado-tentativo-ahbb {
  background-color: #f9a825;
  box-shadow: 0 0 5px rgba(249, 168, 37, 0.45);
}

.dia-seleccionado-ahbb .indicador-estado-ahbb {
  background-color: white !important;
}

.capitalize {
  text-transform: capitalize;
}
</style>
