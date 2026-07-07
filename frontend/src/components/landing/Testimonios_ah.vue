<!--
  Testimonios_ah.vue — Sección f) de la landing page
  Muestra testimonios de estudiantes, egresados e instructores
  sobre su experiencia con los cursos y certificaciones.
-->
<script setup>
const listaTestimonios_ah = [
  {
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    nombre: 'Carlos Mendoza',
    rol: 'Egresado - Desarrollo Web',
    texto: 'Gracias a los cursos de JavaScript y Vue.js de Academia H&B conseguí mi primer empleo como desarrollador frontend. La certificación fue clave en mi entrevista.',
    estrellas: 5,
  },
  {
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    nombre: 'María Fernández',
    rol: 'Estudiante Activa - Ciencia de Datos',
    texto: 'El sistema de prelaciones me ayudó a organizar mi ruta de aprendizaje. Empecé con SQL y ahora estoy en el curso avanzado de Node.js. Los profesores son increíbles.',
    estrellas: 5,
  },
  {
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    nombre: 'Andrés Gutiérrez',
    rol: 'Instructor - Backend con Node.js',
    texto: 'Como profesor de la academia, la plataforma me permite hacer seguimiento real del progreso de mis alumnos. Las herramientas de gestión facilitan mucho la enseñanza.',
    estrellas: 5,
  },
];
</script>

<template>
  <!-- Sección de testimonios -->
  <section id="testimonios_ah" class="seccion_ah testimonios_ah">
    <div class="contenedor_ah">
      <!-- Título de la sección -->
      <div class="titulo-seccion_ah">
        <h2>Lo que dice nuestra comunidad</h2>
        <p>
          Estudiantes, egresados e instructores comparten su experiencia en
          Academia H&B
        </p>
      </div>

      <!-- Grid de tarjetas de testimonios -->
      <div class="testimonios-grid_ah">
        <div
          v-for="(testimonio, indice) in listaTestimonios_ah"
          :key="indice"
          class="testimonio-tarjeta_ah"
        >
          <!-- Comillas decorativas -->
          <div class="testimonio-comillas_ah">"</div>

          <!-- Texto del testimonio -->
          <p class="testimonio-texto_ah">{{ testimonio.texto }}</p>

          <!-- Estrellas de valoración -->
          <div class="testimonio-estrellas_ah">
            <span v-for="estrella in testimonio.estrellas" :key="estrella">⭐</span>
          </div>

          <!-- Información del autor -->
          <div class="testimonio-autor_ah">
            <img
              :src="testimonio.foto"
              :alt="testimonio.nombre"
              class="testimonio-foto_ah"
              loading="lazy"
            />
            <div>
              <h4 class="testimonio-nombre_ah">{{ testimonio.nombre }}</h4>
              <span class="testimonio-rol_ah">{{ testimonio.rol }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonios_ah {
  background: var(--color-fondo_ah);
}

.testimonios-grid_ah {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--espacio-xl_ah);
}

.testimonio-tarjeta_ah {
  background: var(--color-fondo-tarjeta_ah);
  padding: var(--espacio-xl_ah);
  border-radius: var(--radio-xl_ah);
  box-shadow: var(--sombra-suave_ah);
  transition: all var(--transicion-media_ah);
  position: relative;
  border: 1px solid var(--color-borde_ah);
}

.testimonio-tarjeta_ah:hover {
  box-shadow: var(--sombra-media_ah);
  transform: translateY(-4px);
  border-color: var(--color-acento_ah);
}

.testimonio-comillas_ah {
  font-size: 4rem;
  line-height: 1;
  color: var(--color-acento_ah);
  opacity: 0.3;
  font-family: Georgia, serif;
  position: absolute;
  top: 12px;
  left: 20px;
}

.testimonio-texto_ah {
  font-size: 0.95rem;
  color: var(--color-texto-claro_ah);
  line-height: 1.7;
  margin-bottom: var(--espacio-md_ah);
  font-style: italic;
  position: relative;
  padding-top: var(--espacio-xl_ah);
}

.testimonio-estrellas_ah {
  margin-bottom: var(--espacio-lg_ah);
  font-size: 0.9rem;
  letter-spacing: 2px;
}

.testimonio-autor_ah {
  display: flex;
  align-items: center;
  gap: var(--espacio-md_ah);
  border-top: 1px solid var(--color-borde_ah);
  padding-top: var(--espacio-md_ah);
}

.testimonio-foto_ah {
  width: 50px;
  height: 50px;
  border-radius: var(--radio-completo_ah);
  object-fit: cover;
  border: 2px solid var(--color-acento_ah);
}

.testimonio-nombre_ah {
  font-size: 0.95rem;
  color: var(--color-primario_ah);
  margin-bottom: 2px;
}

.testimonio-rol_ah {
  font-size: 0.8rem;
  color: var(--color-texto-claro_ah);
}

@media (max-width: 968px) {
  .testimonios-grid_ah {
    grid-template-columns: 1fr;
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
