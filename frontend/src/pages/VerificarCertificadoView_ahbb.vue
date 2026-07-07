<!-- VerificarCertificadoView_ahbb.vue — Verificación pública de certificados -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { verificarCertificado_ahbb } from '../servicios/certificadosServicio_ahbb';
import { BASE_URL_API_AHBB } from '../servicios/api_ahbb';

const route = useRoute();

const cargando_ahbb = ref(true);
const datos_ahbb = ref(null);
const error_ahbb = ref(false);

const cargarVerificacion_ahbb = async () => {
  cargando_ahbb.value = true;
  error_ahbb.value = false;
  try {
    const idCertificado_ahbb = route.params.id;
    datos_ahbb.value = await verificarCertificado_ahbb(idCertificado_ahbb);
  } catch {
    error_ahbb.value = true;
  } finally {
    cargando_ahbb.value = false;
  }
};

const descargarPdfPublico_ahbb = () => {
  const id_ahbb = route.params.id;
  // Usar el endpoint público que no requiere token
  const url_ahbb = `${BASE_URL_API_AHBB}/certificados/publico/${id_ahbb}/pdf`;
  window.open(url_ahbb, '_blank');
};


onMounted(cargarVerificacion_ahbb);
</script>

<template>
  <div class="verificar-container">
    <div class="verificar-card">
      <!-- Cargando -->
      <div v-if="cargando_ahbb" class="text-center q-pa-xl">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-subtitle1 q-mt-md text-grey-7">
          Verificando certificado...
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error_ahbb" class="text-center q-pa-xl">
        <q-icon name="error_outline" size="64px" color="red" class="q-mb-md" />
        <div class="text-h6 text-red">Error de Verificación</div>
        <div class="text-body2 text-grey-6 q-mt-sm">
          No se pudo verificar este certificado. La URL podría ser inválida.
        </div>
      </div>

      <!-- Certificado NO válido -->
      <div
        v-else-if="datos_ahbb && !datos_ahbb.valido"
        class="text-center q-pa-xl"
      >
        <q-icon
          name="cancel"
          size="64px"
          color="red"
          class="q-mb-md"
        />
        <div class="text-h5 text-red text-weight-bold">
          Certificado No Encontrado
        </div>
        <div class="text-body2 text-grey-6 q-mt-sm">
          {{ datos_ahbb.mensaje }}
        </div>
      </div>

      <!-- Certificado VÁLIDO -->
      <div v-else-if="datos_ahbb && datos_ahbb.valido">
        <!-- Header -->
        <div class="verificar-header">
          <div class="verificar-badge">
            <q-icon name="verified" size="28px" />
            CERTIFICADO VÁLIDO
          </div>
          <div class="text-h4 text-weight-bold q-mt-md">
            Academia <span class="text-amber">H&B</span>
          </div>
        </div>

        <!-- Datos -->
        <div class="verificar-body">
          <div class="verificar-campo">
            <div class="verificar-label">Alumno</div>
            <div class="verificar-valor text-weight-bold">
              {{ datos_ahbb.alumno }}
            </div>
          </div>

          <div class="verificar-campo">
            <div class="verificar-label">Cédula</div>
            <div class="verificar-valor">{{ datos_ahbb.cedula }}</div>
          </div>

          <q-separator class="q-my-md" />

          <div class="verificar-campo">
            <div class="verificar-label">Curso</div>
            <div class="verificar-valor text-weight-bold text-primary">
              {{ datos_ahbb.curso }}
            </div>
          </div>

          <div class="verificar-campo">
            <div class="verificar-label">Profesor</div>
            <div class="verificar-valor">{{ datos_ahbb.profesor }}</div>
          </div>

          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12">
              <div class="verificar-label">Duración</div>
              <div class="verificar-valor">
                {{ datos_ahbb.duracionHoras }} horas académicas
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="verificar-label">Fecha del Curso</div>
              <div class="verificar-valor text-caption">
                {{
                  datos_ahbb.fechaInicioCurso
                    ? new Date(datos_ahbb.fechaInicioCurso).toLocaleDateString(
                        'es-VE',
                      )
                    : '—'
                }}
                —
                {{
                  datos_ahbb.fechaFinCurso
                    ? new Date(datos_ahbb.fechaFinCurso).toLocaleDateString(
                        'es-VE',
                      )
                    : '—'
                }}
              </div>
            </div>
            <div class="col-6">
              <div class="verificar-label">Emitido el</div>
              <div class="verificar-valor text-caption">
                {{
                  datos_ahbb.fechaEmision
                    ? new Date(datos_ahbb.fechaEmision).toLocaleDateString(
                        'es-VE',
                      )
                    : '—'
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="q-px-xl q-pb-xl text-center">
          <q-btn
            unelevated
            color="primary"
            icon="picture_as_pdf"
            label="Descargar Certificado Original (PDF)"
            class="full-width rounded-lg text-weight-bold"
            padding="14px"
            @click="descargarPdfPublico_ahbb"
          />
          <div class="q-mt-sm text-caption text-grey-6">
            Documento firmado y verificado electrónicamente.
          </div>
        </div>

        <!-- Footer -->
        <div class="verificar-footer">
          Este certificado ha sido verificado digitalmente por Academia H&B.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verificar-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1b2a4a 0%, #0f172a 100%);
  padding: 24px;
}

.verificar-card {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.verificar-header {
  background: linear-gradient(135deg, #1b2a4a, #2d3f66);
  color: white;
  padding: 32px;
  text-align: center;
}

.verificar-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #22c55e;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
}

.text-amber {
  color: #f59e0b;
}

.verificar-body {
  padding: 32px;
}

.verificar-campo {
  margin-bottom: 12px;
}

.verificar-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.verificar-valor {
  font-size: 15px;
  color: #1e293b;
  margin-top: 2px;
}

.verificar-footer {
  background: #f8fafc;
  padding: 16px 32px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
}

.rounded-lg { border-radius: 12px; }
</style>
