<!-- CargaMasivaView_ahbb.vue — Carga masiva de datos y Exportación (Solo Administrador) -->
<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { procesarCargaMasivaExcel_ahbb, exportarProfesoresExcel_ahbb } from 'src/servicios/usuariosServicio_ahbb';

const $q = useQuasar();

const step = ref(1);
const archivoCargar = ref(null);
const cargando = ref(false);
const showTutorial = ref(false);
const archivoExportando = ref(false);
const reporteFinal = ref(null);

const validarArchivoYContinuar = () => {
  if (!archivoCargar.value) {
    $q.notify({
      type: 'warning',
      message: 'Por favor selecciona un archivo Excel (.xlsx)',
    });
    return;
  }
  step.value = 3;
  ejecutarCargaMasiva();
};

const ejecutarCargaMasiva = async () => {
  cargando.value = true;
  reporteFinal.value = null;
  try {
    const respuesta = await procesarCargaMasivaExcel_ahbb(archivoCargar.value);
    reporteFinal.value = { exito: true, cantidad: respuesta.length };
    $q.notify({ type: 'positive', message: `¡Éxito! Se guardaron ${respuesta.length} profesores correctamente.` });
  } catch (error) {
    // Extraer array de validación devuelto por NestJS
    let mensajesError = ['Error procesando el archivo, verifica el formato.'];
    
    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data.errores_ahbb)) {
        mensajesError = data.errores_ahbb;
      } else if (data.message) {
        if (Array.isArray(data.message.errores_ahbb)) {
          mensajesError = data.message.errores_ahbb;
        } else if (Array.isArray(data.message)) {
          mensajesError = data.message;
        } else {
          mensajesError = [typeof data.message === 'string' ? data.message : JSON.stringify(data.message)];
        }
      }
    }

    reporteFinal.value = { 
      exito: false, 
      mensajes: mensajesError
    };
    $q.notify({ type: 'negative', message: 'Fallo al procesar el archivo.' });
  } finally {
    cargando.value = false;
  }
};

const reiniciarCarga = () => {
  archivoCargar.value = null;
  reporteFinal.value = null;
  step.value = 1;
};

const descargarAExcel = async () => {
  archivoExportando.value = true;
  try {
    await exportarProfesoresExcel_ahbb();
    $q.notify({ type: 'positive', message: '¡Base de datos de Profesores exportada con éxito!' });
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Hubo un error exportando los datos' });
  } finally {
    archivoExportando.value = false;
  }
};
</script>

<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5 text-primary">
        <q-icon name="group_add" class="q-mr-sm" color="primary" />
        Gestión y Carga de Profesores
      </div>
      <div>
        <q-btn 
          outline 
          color="secondary" 
          icon="download" 
          label="Exportar BD a CSV/Excel" 
          :loading="archivoExportando"
          @click="descargarAExcel" 
          class="q-mr-md" 
        />
        <q-btn unelevated color="primary" text-color="white" icon="local_library" label="Ver Tutorial y Formato" @click="showTutorial = true" />
      </div>
    </div>

    <!-- Módulo Central: Stepper Wizard -->
    <q-stepper
      v-model="step"
      active-color="primary"
      done-color="secondary"
      animated
      flat
      bordered
    >
      <q-step
        :name="1"
        title="Instrucciones Previas"
        icon="info"
        :done="step > 1"
      >
        <p class="text-subtitle1 text-grey-8">
          Bienvenido al módulo de importación masiva. Al cargar la hoja de Excel, todos los registros de la lista 
          serán automáticamente procesados, limpiados y guardados bajo el rol oficial de <strong>PROFESOR</strong>. <br><br>
          De manera simultánea e invisible, la plataforma creará credenciales de acceso iniciales y se le enviará 
          a cada docente un correo con su contraseña temporal generada aleatoriamente.
        </p>

        <q-stepper-navigation>
          <q-btn @click="step = 2" color="primary" label="Entendido, Siguiente" />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="2"
        title="Importar Archivo Excel"
        icon="upload_file"
        :done="step > 2"
      >
        <p class="text-grey-8">Haz clic o arrastra el archivo con la base de datos de profesores (Extensión .xlsx).</p>
        
        <q-file
          v-model="archivoCargar"
          label="Subir Archivo de Profesores"
          outlined
          clearable
          accept=".xlsx, .xls"
          class="q-mb-md"
          color="primary"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>

        <q-stepper-navigation>
          <q-btn @click="validarArchivoYContinuar" color="primary" label="Procesar y Cargar BD" />
          <q-btn unelevated @click="step = 1" color="primary" text-color="white" label="Regresar" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="3"
        title="Resultados"
        icon="assignment_turned_in"
      >
        <div v-if="cargando" class="text-center q-pa-xl">
          <q-spinner-tail color="primary" size="4em" />
          <div class="q-mt-sm text-grey-8">Leyendo celdas, generando claves encriptadas y enviando correos electrónicos...</div>
        </div>

        <div v-else-if="reporteFinal">
          <q-banner v-if="reporteFinal.exito" rounded class="bg-green-1 text-green-10 q-pa-md text-subtitle1">
            <template v-slot:avatar>
              <q-icon name="check_circle" size="xl" color="green-8" />
            </template>
            <b>¡Operación Satisfactoria!</b> <br>
            Se han guardado de manera exitosa {{ reporteFinal.cantidad }} nuevos profesores en la base de datos.
          </q-banner>

          <q-banner v-else rounded class="bg-red-1 text-red-10 q-pa-md text-subtitle1">
            <template v-slot:avatar>
              <q-icon name="error" size="xl" color="red-8" />
            </template>
            <b>¡Hemos detectado errores o conflictos!</b> <br>
            Se detuvo el proceso por las siguientes causas:
            <ul class="q-pl-lg q-mt-sm" style="margin-bottom: 0;">
              <li v-for="(errorMsg, index) in reporteFinal.mensajes" :key="index">{{ errorMsg }}</li>
            </ul>
          </q-banner>
        </div>

        <q-stepper-navigation v-if="!cargando">
          <q-btn color="primary" label="Cargar Otro Archivo" @click="reiniciarCarga" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>

    <!-- Dialogo de Tutorial y Plantilla Dinámico -->
    <q-dialog v-model="showTutorial">
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6"><q-icon name="lightbulb" class="q-mr-sm" color="accent" /> Tutorial de Formato Excel</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
           <div class="text-subtitle1 text-bold q-mb-sm text-secondary">¿Cómo preparar el archivo de plantilla?</div>
           <p>
            El sistema se basa en identificar a los profesores usando sólamente el formato clásico de columna. 
            Abre Excel e ingresa como **primera fila** el título de las 4 columnas mandatorias. 
            A partir de la **segunda fila**, ingresas la información correspondiente.
           </p>
           
           <q-markup-table class="q-mt-md" flat bordered separator="cell">
             <thead class="bg-grey-2">
               <tr>
                 <th class="text-left text-bold text-primary">Cedula</th>
                 <th class="text-left text-bold text-primary">Nombre</th>
                 <th class="text-left text-bold text-primary">Apellido</th>
                 <th class="text-left text-bold text-primary">Correo</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td>V-12345678</td>
                 <td>Andrea</td>
                 <td>Suárez</td>
                 <td>ansuarez55@email.com</td>
               </tr>
               <tr>
                 <td>V-88888888</td>
                 <td>Luis Ernesto</td>
                 <td>Moncada</td>
                 <td>la.moncada@email.com</td>
               </tr>
             </tbody>
           </q-markup-table>

           <div class="text-caption text-grey-8 q-mt-md">
             <q-icon name="warning" color="accent" size="sm" class="q-mr-xs"/> 
             <b>Tip Importante:</b> No permitas que el archivo posea celdas vacías y comprueba previamente 
             que ningún correo/cédula exista con antelación en el sistema. Para mantener la exactitud de los 
             datos si el sistema detecta un solo duplicado anulará la carga completa de inmediato.
           </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn unelevated label="¡Comprendido!" color="primary" text-color="white" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>
