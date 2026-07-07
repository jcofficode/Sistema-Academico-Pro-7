import { defineStore } from 'pinia';
import { ROLES_AHBB } from '../constantes/roles_ahbb';
import {
  iniciarSesion_ahbb as servicioIniciarSesion_ahbb,
  registrarUsuario_ahbb as servicioRegistrarUsuario_ahbb,
  cerrarSesion_ahbb as servicioCerrarSesion_ahbb,
  recuperarSesion_ahbb as servicioRecuperarSesion_ahbb,
} from '../servicios/autenticacionServicio_ahbb';

/**
 * Store de Pinia para la gestión del estado de autenticación y sesión del usuario.
 * Centraliza la información del perfil activo y las acciones de acceso al sistema.
 */
export const useAutenticacionStore_ahbb = defineStore('autenticacion_ahbb', {
  state: () => ({
    usuarioActivo_ahbb: null,
    listaUsuarios_ahbb: [],
    errorAuth_ahbb: '',
    cargando_ahbb: false,
  }),

  getters: {
    estaAutenticado_ahbb: (estado) => estado.usuarioActivo_ahbb !== null,
    nombreCompleto_ahbb: (estado) =>
      estado.usuarioActivo_ahbb
        ? `${estado.usuarioActivo_ahbb.nombre} ${estado.usuarioActivo_ahbb.apellido}`
        : '',
    iniciales_ahbb: (estado) => {
      if (!estado.usuarioActivo_ahbb) return '';
      const nombre_ahbb = estado.usuarioActivo_ahbb.nombre || '';
      const apellido_ahbb = estado.usuarioActivo_ahbb.apellido || '';
      return (nombre_ahbb.charAt(0) + apellido_ahbb.charAt(0)).toUpperCase();
    },
    rolUsuario_ahbb: (estado) => estado.usuarioActivo_ahbb?.rol ?? '',
    totalUsuarios_ahbb: (estado) => estado.listaUsuarios_ahbb.length,
    esAdministrador_ahbb: (estado) =>
      estado.usuarioActivo_ahbb?.rol === ROLES_AHBB.ADMINISTRADOR,
    esAdmin_ahbb: (estado) =>
      estado.usuarioActivo_ahbb?.rol === ROLES_AHBB.ADMINISTRADOR,
    esProfesor_ahbb: (estado) =>
      estado.usuarioActivo_ahbb?.rol === ROLES_AHBB.PROFESOR,
    esAlumno_ahbb: (estado) =>
      estado.usuarioActivo_ahbb?.rol === ROLES_AHBB.ALUMNO,
  },

  actions: {
    /**
     * Inicializa la sesión recuperando el perfil del usuario desde la persistencia segura.
     */
    async inicializar_ahbb() {
      this.usuarioActivo_ahbb = await servicioRecuperarSesion_ahbb();
    },

    /**
     * Gestiona el proceso de registro de un nuevo usuario delegando en el servicio de autenticación.
     * @param datosUsuario_ahbb Objeto con la información del registro.
     */
    async registrarUsuario_ahbb(datosUsuario_ahbb) {
      this.errorAuth_ahbb = '';
      this.cargando_ahbb = true;

      try {
        const resultado_ahbb = await servicioRegistrarUsuario_ahbb(datosUsuario_ahbb);
        if (!resultado_ahbb.exito) {
          this.errorAuth_ahbb = resultado_ahbb.mensaje;
          return false;
        }
        return true;
      } finally {
        this.cargando_ahbb = false;
      }
    },

    /**
     * Autentica a un usuario y establece su perfil en el estado global.
     * @param correo_ahbb Correo electrónico del usuario.
     * @param contrasena_ahbb Contraseña.
     */
    async iniciarSesion_ahbb(correo_ahbb, contrasena_ahbb) {
      this.errorAuth_ahbb = '';
      this.cargando_ahbb = true;

      try {
        const resultado_ahbb = await servicioIniciarSesion_ahbb(correo_ahbb, contrasena_ahbb);
        if (!resultado_ahbb.exito) {
          this.errorAuth_ahbb = resultado_ahbb.mensaje;
          return false;
        }

        this.usuarioActivo_ahbb = resultado_ahbb.usuario;
        return true;
      } finally {
        this.cargando_ahbb = false;
      }
    },

    async cerrarSesion_ahbb() {
      await servicioCerrarSesion_ahbb();
      this.usuarioActivo_ahbb = null;
      this.listaUsuarios_ahbb = [];
    },

    /**
     * Actualiza la ruta de la firma digital en el perfil activo tras una carga exitosa.
     */
    actualizarFirmaEnSesion_ahbb(nuevaRuta_ahbb) {
      if (this.usuarioActivo_ahbb) {
        this.usuarioActivo_ahbb.firmaDigital = nuevaRuta_ahbb;
        // La firma ya NO se guarda en localStorage por seguridad PII
      }
    },

    async recargarPerfil_ahbb() {
      const perfil_ahbb = await servicioRecuperarSesion_ahbb();
      if (perfil_ahbb) {
        this.usuarioActivo_ahbb = perfil_ahbb;
        return true;
      }
      return false;
    },

    limpiarError_ahbb() {
      this.errorAuth_ahbb = '';
    },
  },
});
