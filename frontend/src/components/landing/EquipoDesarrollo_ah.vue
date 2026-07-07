<!--
  EquipoDesarrollo_ah.vue — Sección del equipo de desarrollo
  Presenta al equipo detrás de la plataforma de Academia H&B
  con un diseño elegante de tarjetas con foto y roles.
-->
<script setup>
import fotoAlan from '../../assets/foto_perfil.jpg';
import fotoBarbara from '../../assets/foto_barbara.png';

const equipoDesarrollo_ah = [
  {
    nombre: 'Alan Hidalgo',
    rol: 'Desarrollador Frontend',
    descripcion:
      'Responsable del diseño UI/UX y la maquetación del frontend. Encargado de la experiencia de usuario, la interfaz visual y la integración de componentes interactivos.',
    foto: fotoAlan,
    habilidades: ['Vue.js', 'Quasar', 'CSS'],
    github: 'https://github.com/AlanGHB1',
  },
  {
    nombre: 'Bárbara Briceño',
    rol: 'Desarrolladora Backend',
    descripcion:
      'Arquitecta del servidor y la lógica de negocio. Responsable del diseño de la base de datos, la API backend con NestJS y la integración de todos los módulos del sistema.',
    foto: fotoBarbara,
    habilidades: ['NestJS', 'PostgreSQL', 'Prisma'],
    github: 'https://github.com/Persebia',
  },
];
</script>

<template>
  <!-- Sección del equipo de desarrollo -->
  <section id="equipo_ah" class="seccion_ah equipo_ah">
    <div class="contenedor_ah">
      <!-- Título de la sección -->
      <div class="titulo-seccion_ah">
        <h2>
          Conoce al equipo detrás de
          <span class="equipo-titulo-resaltado_ah">Academia H&B</span>
        </h2>
        <p>
          Los desarrolladores que hicieron posible esta plataforma educativa
        </p>
      </div>

      <!-- Grid de tarjetas del equipo -->
      <div class="equipo-grid_ah">
        <div
          v-for="(miembro, indice) in equipoDesarrollo_ah"
          :key="indice"
          class="equipo-tarjeta_ah"
        >
          <!-- Cabecera con foto y decoración -->
          <div class="equipo-tarjeta-header_ah">
            <div class="equipo-foto-wrapper_ah">
              <img
                v-if="miembro.foto"
                :src="miembro.foto"
                :alt="miembro.nombre"
                class="equipo-foto_ah"
                loading="lazy"
              />
              <div v-else class="equipo-foto-placeholder_ah">
                <span class="placeholder-icono_ah">👩‍💻</span>
              </div>
              <!-- Indicador de estado activo -->
              <span class="equipo-estado_ah"></span>
            </div>
          </div>

          <!-- Info del miembro -->
          <div class="equipo-info_ah">
            <h3 class="equipo-nombre_ah">{{ miembro.nombre }}</h3>
            <span class="equipo-rol_ah">{{ miembro.rol }}</span>
            <p class="equipo-descripcion_ah">{{ miembro.descripcion }}</p>

            <!-- Tags de habilidades -->
            <div class="equipo-habilidades_ah">
              <span
                v-for="(hab, i) in miembro.habilidades"
                :key="i"
                class="equipo-habilidad_ah"
              >
                {{ hab }}
              </span>
            </div>

            <!-- Link a GitHub -->
            <a
              v-if="miembro.github"
              :href="miembro.github"
              target="_blank"
              rel="noopener noreferrer"
              class="equipo-github_ah"
            >
              <svg
                class="github-icono_ah"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              <span>Ver perfil</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.equipo_ah {
  background: linear-gradient(
    180deg,
    #f0f4ff 0%,
    var(--color-fondo_ah) 100%
  );
}

.equipo-titulo-resaltado_ah {
  color: var(--color-acento_ah);
}

/* — Grid de tarjetas — */
.equipo-grid_ah {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--espacio-3xl_ah);
  max-width: 900px;
  margin: 0 auto;
}

.equipo-tarjeta_ah {
  background: var(--color-fondo-tarjeta_ah);
  border-radius: var(--radio-xl_ah);
  box-shadow: var(--sombra-suave_ah);
  border: 1px solid var(--color-borde_ah);
  overflow: hidden;
  transition: all var(--transicion-media_ah);
  text-align: center;
}

.equipo-tarjeta_ah:hover {
  box-shadow: var(--sombra-media_ah);
  transform: translateY(-6px);
  border-color: var(--color-acento_ah);
}

/* — Cabecera con foto — */
.equipo-tarjeta-header_ah {
  background: linear-gradient(
    135deg,
    var(--color-primario_ah) 0%,
    #1e3a5f 100%
  );
  padding: var(--espacio-xl_ah) var(--espacio-xl_ah) var(--espacio-3xl_ah);
  position: relative;
}

.equipo-foto-wrapper_ah {
  position: relative;
  display: inline-block;
  margin-bottom: calc(-1 * var(--espacio-3xl_ah));
}

.equipo-foto_ah {
  width: 130px;
  height: 130px;
  border-radius: var(--radio-completo_ah);
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.equipo-foto-placeholder_ah {
  width: 130px;
  height: 130px;
  border-radius: var(--radio-completo_ah);
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.placeholder-icono_ah {
  font-size: 3.5rem;
}

.equipo-estado_ah {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: #22c55e;
  border-radius: var(--radio-completo_ah);
  border: 3px solid white;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

/* — Info del miembro — */
.equipo-info_ah {
  padding: calc(var(--espacio-3xl_ah) + var(--espacio-sm_ah))
    var(--espacio-xl_ah) var(--espacio-xl_ah);
}

.equipo-nombre_ah {
  font-family: var(--fuente-titulo_ah);
  font-size: 1.35rem;
  color: var(--color-primario_ah);
  margin-bottom: 4px;
  font-weight: 800;
}

.equipo-rol_ah {
  display: inline-block;
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-acento_ah);
  padding: 0.3rem 0.9rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: var(--espacio-md_ah);
}

.equipo-descripcion_ah {
  font-size: 0.9rem;
  color: var(--color-texto-claro_ah);
  line-height: 1.7;
  margin-bottom: var(--espacio-lg_ah);
}

/* — Habilidades (tags) — */
.equipo-habilidades_ah {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: var(--espacio-lg_ah);
}

.equipo-habilidad_ah {
  background: rgba(59, 130, 246, 0.08);
  color: var(--color-secundario_ah);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

/* — Link a GitHub — */
.equipo-github_ah {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-primario_ah);
  color: white;
  padding: 0.55rem 1.25rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transicion-media_ah);
}

.equipo-github_ah:hover {
  background: var(--color-acento_ah);
  transform: translateY(-2px);
  box-shadow: var(--sombra-acento_ah);
}

.github-icono_ah {
  flex-shrink: 0;
}

/* — Responsive — */
@media (max-width: 768px) {
  .equipo-grid_ah {
    grid-template-columns: 1fr;
    max-width: 420px;
  }
}
</style>
