/**
 * routes.js — Rutas de la aplicación academia_ahbb
 */

import { ROLES_AHBB } from '../constantes/roles_ahbb';

// Alias para los roles (brevedad en definición de rutas)
const ADMIN = ROLES_AHBB.ADMINISTRADOR;
const PROF = ROLES_AHBB.PROFESOR;
const ALUM = ROLES_AHBB.ALUMNO;
const TODOS = [ADMIN, PROF, ALUM];

const routes = [
  // ─── Rutas públicas ─────────────────────────────────
  {
    path: '/',
    name: 'inicio',
    component: () => import('pages/LandingView_ah.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'landing' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginView_ahbb.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'auth' },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('pages/RegistroView_ahbb.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'auth' },
  },

  // ─── Rutas compartidas (todos los roles) ──────────────
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('pages/DashboardView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('pages/compartidas/PerfilView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  {
    path: '/cambiar-contrasena',
    name: 'cambiarContrasena',
    component: () => import('pages/compartidas/CambiarContrasenaView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  {
    path: '/horarios',
    name: 'horarios',
    component: () => import('pages/compartidas/HorariosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },

  // ─── Rutas de cursos (admin y profesor) ───────────────
  {
    path: '/cursos',
    name: 'cursos',
    component: () => import('pages/CursosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN, PROF] },
  },
  {
    path: '/cursos/nuevo',
    name: 'cursoNuevo',
    component: () => import('pages/CursoFormView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF, ADMIN] },
  },
  {
    path: '/cursos/editar/:id',
    name: 'cursoEditar',
    component: () => import('pages/CursoFormView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF, ADMIN] },
  },
  {
    path: '/cursos/:id',
    name: 'cursoDetalle',
    component: () => import('pages/CursoDetalleView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },

  // ─── Rutas de inscripciones ───────────────────────────
  {
    path: '/inscripciones',
    name: 'inscripciones',
    component: () => import('pages/admin/InscripcionesView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN] },
  },

  // ─── Rutas de certificados ──────────────────────────
  {
    path: '/certificados',
    name: 'certificados',
    component: () => import('pages/admin/CertificadosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN, PROF] },
  },
  {
    path: '/plantillas-certificados',
    name: 'plantillasCertificados',
    component: () => import('pages/admin/PlantillasCertificadosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN, PROF] },
  },

  // ─── Rutas exclusivas del administrador ────────────────
  {
    path: '/admin/usuarios',
    name: 'adminUsuarios',
    component: () => import('pages/admin/UsuariosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN] },
  },
  {
    path: '/admin/carga-masiva',
    name: 'adminCargaMasiva',
    component: () => import('pages/admin/CargaMasivaView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN] },
  },
  {
    path: '/admin/configuracion',
    name: 'adminConfiguracion',
    component: () => import('pages/admin/ConfiguracionView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN] },
  },
  {
    path: '/admin/tienda',
    name: 'adminTienda',
    component: () => import('pages/admin/ProductosAdminView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ADMIN] },
  },

  // ─── Rutas exclusivas del profesor ─────────────────────
  {
    path: '/profesor/mis-alumnos',
    name: 'profesorMisAlumnos',
    component: () => import('pages/profesor/MisAlumnosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF] },
  },
  {
    path: '/profesor/inscripciones',
    name: 'profesorInscripciones',
    component: () => import('pages/profesor/InscripcionesCursosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF] },
  },
  {
    path: '/profesor/inscripciones/:id',
    name: 'profesorDetalleInscripciones',
    component: () => import('pages/profesor/DetalleInscripcionesView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF] },
  },
  {
    path: '/profesor/firma-digital',
    name: 'profesorFirmaDigital',
    component: () => import('pages/profesor/FirmaDigitalView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [PROF] },
  },

  // ─── Rutas de Tienda Oficial (E-Commerce) ──────────────
  {
    path: '/tienda',
    name: 'tiendaCatalogo',
    component: () => import('pages/tienda/TiendaView_ahbb.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'sistema' }, // Aunque es pública, usa layout sistema si está logueado, sino landing
  },
  {
    path: '/tienda/producto/:id',
    name: 'tiendaProductoDetalle',
    component: () => import('pages/tienda/ProductoDetalleView_ahbb.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'sistema' },
  },
  {
    path: '/tienda/carrito',
    name: 'tiendaCarrito',
    component: () => import('pages/tienda/CarritoView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  {
    path: '/tienda/favoritos',
    name: 'tiendaFavoritos',
    component: () => import('pages/tienda/FavoritosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  {
    path: '/tienda/compras',
    name: 'tiendaCompras',
    component: () => import('pages/tienda/MisComprasView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: TODOS },
  },
  
  // ─── Rutas exclusivas del alumno ──────────────────────
  {
    path: '/alumno/oferta-academica',
    name: 'alumnoOfertaAcademica',
    component: () => import('pages/alumno/OfertaAcademicaView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ALUM] },
  },
  {
    path: '/alumno/mis-inscripciones',
    name: 'alumnoMisInscripciones',
    component: () => import('pages/alumno/MisInscripcionesView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ALUM] },
  },
  {
    path: '/alumno/historial',
    name: 'alumnoHistorial',
    component: () => import('pages/alumno/HistorialAcademicoView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ALUM] },
  },
  {
    path: '/alumno/mis-certificados',
    name: 'alumnoMisCertificados',
    component: () => import('pages/alumno/MisCertificadosView_ahbb.vue'),
    meta: { publica_ahbb: false, layout_ahbb: 'sistema', rolesPermitidos_ahbb: [ALUM] },
  },

  // ─── Verificación pública de certificados ────────────
  {
    path: '/verificar-certificado/:id',
    name: 'verificarCertificado',
    component: () => import('pages/VerificarCertificadoView_ahbb.vue'),
    meta: { publica_ahbb: true, layout_ahbb: 'landing' },
  },

  // Catch-all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
