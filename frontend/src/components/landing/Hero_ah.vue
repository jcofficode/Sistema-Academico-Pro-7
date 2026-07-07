<!--
  Hero_ah.vue — Sección principal (hero) de la landing page
  Corresponde a los puntos a), b) y e) de la estructura:
  - a) Encabezado: título principal atractivo
  - b) Subtítulo: refuerza el mensaje
  - e) CTA: botón para ir al catálogo
  Enfocado en la plataforma académica de cursos y certificaciones.
-->
<script setup>
// No se requieren imports, el router-link está disponible globalmente
</script>

<template>
  <!-- Sección hero con fondo oscuro y gradiente -->
  <section id="hero_ah" class="hero_ah">
    <!-- Formas decorativas de fondo -->
    <div class="hero-decoracion_ah">
      <div class="circulo-decorativo_ah circulo-1_ah"></div>
      <div class="circulo-decorativo_ah circulo-2_ah"></div>
      <div class="circulo-decorativo_ah circulo-3_ah"></div>
    </div>

    <div class="contenedor_ah hero-contenido_ah">
      <!-- Columna de texto -->
      <div class="hero-texto_ah">
        <!-- Etiqueta superior decorativa -->
        <span class="hero-etiqueta_ah animar-entrada_ah row items-center inline-flex no-wrap q-gutter-x-xs">
          <img src="/graduation-cap.png" alt="Icon" style="width:20px;height:20px;object-fit:contain;" />
          Plataforma Académica Online
        </span>

        <!-- a) Encabezado principal -->
        <h1 class="hero-titulo_ah animar-entrada-retardo1_ah">
          Transforma tu carrera con
          <span class="hero-resaltado_ah">Academia H&B</span>
        </h1>

        <!-- b) Subtítulo complementario -->
        <p class="hero-subtitulo_ah animar-entrada-retardo2_ah">
          Cursos especializados en tecnología con certificaciones oficiales.
          Aprende JavaScript, Vue.js, SQL, Node.js y más, con profesores
          expertos y un sistema de seguimiento académico personalizado.
        </p>

        <!-- Estadísticas sociales -->
        <div class="hero-estadisticas_ah animar-entrada-retardo3_ah">
          <div class="estadistica_ah">
            <span class="estadistica-numero_ah">500+</span>
            <span class="estadistica-texto_ah">Estudiantes activos</span>
          </div>
          <div class="estadistica-separador_ah"></div>
          <div class="estadistica_ah">
            <span class="estadistica-numero_ah">50+</span>
            <span class="estadistica-texto_ah">Certificaciones emitidas</span>
          </div>
          <div class="estadistica-separador_ah"></div>
          <div class="estadistica_ah">
            <span class="estadistica-numero_ah">20+</span>
            <span class="estadistica-texto_ah">Cursos disponibles</span>
          </div>
        </div>
      </div>

      <!-- Columna de imagen/visual -->
      <div class="hero-visual_ah animar-entrada-retardo2_ah">
        <div class="hero-imagen-contenedor_ah">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=600&fit=crop"
            alt="Estudiantes de Academia H&B en clase de tecnología"
            class="hero-imagen_ah"
          />
          <!-- Tarjeta flotante decorativa -->
          <div class="hero-tarjeta-flotante_ah">
            <span class="tarjeta-icono_ah">⭐</span>
            <div>
              <span class="tarjeta-titulo_ah">Certificación Oficial</span>
              <span class="tarjeta-texto_ah">Válida profesionalmente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero_ah {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(
    135deg,
    var(--color-fondo-oscuro_ah) 0%,
    var(--color-primario_ah) 50%,
    #1e3a6e 100%
  );
  overflow: hidden;
  padding-top: 70px;
}

.hero-decoracion_ah {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circulo-decorativo_ah {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
}

.circulo-1_ah {
  width: 500px;
  height: 500px;
  background: var(--color-acento_ah);
  top: -100px;
  right: -100px;
}

.circulo-2_ah {
  width: 300px;
  height: 300px;
  background: var(--color-secundario_ah);
  bottom: -50px;
  left: -50px;
}

.circulo-3_ah {
  width: 200px;
  height: 200px;
  background: var(--color-acento_ah);
  top: 50%;
  left: 30%;
}

.hero-contenido_ah {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-3xl_ah);
  align-items: center;
  padding: var(--espacio-3xl_ah) 0;
}

.hero-texto_ah {
  color: white;
}

.hero-etiqueta_ah {
  display: inline-block;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--color-acento_ah);
  padding: 0.5rem 1rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: var(--espacio-lg_ah);
}

.hero-titulo_ah {
  font-size: clamp(2.2rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: var(--espacio-lg_ah);
  color: white;
}

.hero-resaltado_ah {
  color: var(--color-acento_ah);
  position: relative;
}

.hero-subtitulo_ah {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin-bottom: var(--espacio-xl_ah);
  max-width: 520px;
}

.hero-botones_ah {
  display: flex;
  gap: var(--espacio-md_ah);
  margin-bottom: var(--espacio-2xl_ah);
  flex-wrap: wrap;
}

.hero-estadisticas_ah {
  display: flex;
  align-items: center;
  gap: var(--espacio-lg_ah);
}

.estadistica_ah {
  display: flex;
  flex-direction: column;
}

.estadistica-numero_ah {
  font-family: var(--fuente-titulo_ah);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-acento_ah);
}

.estadistica-texto_ah {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.estadistica-separador_ah {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

.hero-visual_ah {
  display: flex;
  justify-content: center;
}

.hero-imagen-contenedor_ah {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.hero-imagen_ah {
  width: 100%;
  height: 480px;
  object-fit: cover;
  border-radius: var(--radio-xl_ah);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.hero-tarjeta-flotante_ah {
  position: absolute;
  bottom: -20px;
  left: -30px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem 1.25rem;
  border-radius: var(--radio-lg_ah);
  box-shadow: var(--sombra-fuerte_ah);
  animation: fadeInUp_ah 0.8s ease 0.5s forwards;
  opacity: 0;
}

.tarjeta-icono_ah {
  font-size: 1.5rem;
}

.tarjeta-titulo_ah {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primario_ah);
}

.tarjeta-texto_ah {
  font-size: 0.8rem;
  color: var(--color-texto-claro_ah);
}

@media (max-width: 968px) {
  .hero-contenido_ah {
    grid-template-columns: 1fr;
    text-align: center;
    padding: var(--espacio-2xl_ah) 0;
  }

  .hero-subtitulo_ah {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-botones_ah {
    justify-content: center;
  }

  .hero-estadisticas_ah {
    justify-content: center;
  }

  .hero-visual_ah {
    order: -1;
  }

  .hero-imagen_ah {
    height: 350px;
  }

  .hero-tarjeta-flotante_ah {
    left: 10px;
    bottom: -10px;
  }
}

@media (max-width: 480px) {
  .hero-estadisticas_ah {
    flex-direction: column;
    gap: var(--espacio-md_ah);
  }

  .estadistica-separador_ah {
    width: 40px;
    height: 1px;
  }

  .hero-imagen_ah {
    height: 280px;
  }
}
</style>
