<!--
  Beneficios_ah.vue — Sección c) de la landing page
  Muestra los beneficios clave de la plataforma académica Academia H&B.
-->
<script setup>


const listaBeneficios_ah = [
  {
    icono: '📜',
    titulo: 'Certificaciones Oficiales',
    descripcion:
      'Obtén certificados válidos profesionalmente al completar cada curso. Refuerza tu perfil y demuestra tus habilidades ante empleadores.',
  },
  {
    icono: '👨‍🏫',
    titulo: 'Profesores Expertos',
    descripcion:
      'Aprende de instructores con experiencia real en la industria tecnológica. Clases en vivo con seguimiento personalizado.',
  },
  {
    icono: '📅',
    titulo: 'Horarios Flexibles',
    descripcion:
      'Elige entre múltiples horarios y días de clase. Cursos de lunes a sábado, en diferentes franjas horarias que se adaptan a ti.',
  },
  {
    icono: '🚀',
    titulo: 'Ruta de Aprendizaje',
    descripcion:
      'Sistema de prelaciones que guía tu progreso académico. Avanza desde los fundamentos hasta niveles avanzados de forma estructurada.',
  },
];
</script>

<template>
  <!-- Sección de beneficios con fondo claro -->
  <section id="beneficios_ah" class="seccion_ah beneficios_ah">
    <div class="contenedor_ah">
      <!-- Título de la sección con línea decorativa -->
      <div class="titulo-seccion_ah">
        <h2>¿Por qué elegir Academia H&B?</h2>
        <p>
          Una plataforma diseñada para tu crecimiento profesional en tecnología
        </p>
      </div>

      <!-- Grid de tarjetas de beneficios -->
      <div class="beneficios-grid_ah">
        <div
          v-for="(beneficio, indice) in listaBeneficios_ah"
          :key="indice"
          class="beneficio-tarjeta_ah"
          :style="{ animationDelay: `${indice * 0.1}s` }"
        >
          <!-- Ícono del beneficio -->
          <div class="beneficio-icono_ah">
            {{ beneficio.icono }}
          </div>
          <!-- Título del beneficio -->
          <h3 class="beneficio-titulo_ah">{{ beneficio.titulo }}</h3>
          <!-- Descripción del beneficio -->
          <p class="beneficio-descripcion_ah">{{ beneficio.descripcion }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.beneficios_ah {
  background: var(--color-fondo-seccion_ah);
}

.beneficios-grid_ah {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--espacio-xl_ah);
}

.beneficio-tarjeta_ah {
  background: var(--color-fondo-tarjeta_ah);
  padding: var(--espacio-xl_ah);
  border-radius: var(--radio-xl_ah);
  text-align: center;
  box-shadow: var(--sombra-suave_ah);
  transition: all var(--transicion-media_ah);
  animation: fadeInUp_ah 0.6s ease forwards;
  opacity: 0;
}

.beneficio-tarjeta_ah:hover {
  transform: translateY(-8px);
  box-shadow: var(--sombra-media_ah);
}

.beneficio-icono_ah {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--espacio-lg_ah);
  font-size: 2rem;
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.1),
    rgba(59, 130, 246, 0.1)
  );
  border-radius: var(--radio-completo_ah);
}

.beneficio-titulo_ah {
  font-size: 1.15rem;
  margin-bottom: var(--espacio-sm_ah);
  color: var(--color-primario_ah);
}

.beneficio-descripcion_ah {
  font-size: 0.9rem;
  color: var(--color-texto-claro_ah);
  line-height: 1.6;
}

@media (max-width: 968px) {
  .beneficios-grid_ah {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .beneficios-grid_ah {
    grid-template-columns: 1fr;
  }
}
</style>
