<script setup>
import { useDialogPluginComponent } from 'quasar';

const props = defineProps({
  solapamientos: { type: Array, default: () => [] },
  huecosDisponibles: { type: Array, default: () => [] },
});

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const formatearHora12h_ahbb = (horaStr) => {
  if (!horaStr) return '—';
  const [horas, minutos] = horaStr.split(':').map(Number);
  const ampm = (horas ?? 0) >= 12 ? 'PM' : 'AM';
  const horas12 = (horas ?? 0) % 12 || 12;
  return `${String(horas12).padStart(2, '0')}:${String(minutos ?? 0).padStart(2, '0')} ${ampm}`;
};

const capitalizar_ahbb = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
</script>

<template>
  <q-dialog persistent ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 450px; max-width: 600px">
      <q-card-section class="bg-negative text-white row items-center">
        <q-icon name="warning" size="md" class="q-mr-md" />
        <div class="text-h6">Solapamiento de Horario</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="onDialogCancel" />
      </q-card-section>

      <q-card-section class="q-pa-md" style="max-height: 70vh; overflow-y: auto;">
        <div class="text-subtitle1 text-weight-bold q-mb-sm text-negative">
          Se han detectado conflictos con otros cursos:
        </div>
        <q-list bordered separator dense class="rounded-borders q-mb-lg">
          <q-item v-for="(sol, index) in solapamientos" :key="index" class="q-py-sm">
            <q-item-section avatar>
              <q-icon name="event_busy" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ sol.cursoNombre }}</q-item-label>
              <q-item-label caption>
                {{ capitalizar_ahbb(sol.dia) }}: {{ formatearHora12h_ahbb(sol.horaInicio) }} - {{ formatearHora12h_ahbb(sol.horaFin) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="huecosDisponibles && huecosDisponibles.length > 0">
          <div class="text-subtitle1 text-weight-bold q-mb-sm text-primary">
            Horarios sugeridos disponibles:
          </div>
          <div class="row q-col-gutter-sm">
            <div v-for="(hueco, idx) in huecosDisponibles" :key="idx" class="col-12 col-sm-6">
              <q-card flat bordered class="bg-grey-1">
                <q-card-section class="q-pa-sm row items-center">
                  <q-icon name="event_available" color="primary" class="q-mr-sm" />
                  <div class="text-caption">
                    <span class="text-weight-bold">{{ capitalizar_ahbb(hueco.dia) }}</span><br />
                    {{ formatearHora12h_ahbb(hueco.horaInicio) }} - {{ formatearHora12h_ahbb(hueco.horaFin) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
        <div v-else class="text-grey-7 italic">
          No se encontraron huecos disponibles automáticos. Por favor, revise su agenda manualmente.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn 
          label="Entendido" 
          color="primary" 
          unelevated 
          class="q-px-lg"
          @click="onDialogOK" 
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
