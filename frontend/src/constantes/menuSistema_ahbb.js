/**
 * menuSistema_ahbb.js — Definición de menús del sidebar por rol
 * Cada rol tiene su propio conjunto de enlaces de navegación.
 *
 * La navegación separa explícitamente los dos mundos académicos:
 *  - CARRERAS (módulo _cjgp/_jc): pensums, materias, notas y actas.
 *  - CURSOS EXTRACURRICULARES (módulo _ahbb heredado): cursos libres
 *    certificados, independientes de la carrera.
 */

import { ROLES_AHBB } from './roles_ahbb';

/** Menú del Administrador */
const MENU_ADMINISTRADOR_AHBB = [
  { icono: 'dashboard', etiqueta: 'Panel Principal', ruta: '/dashboard', encabezado: 'Principal' },
  { icono: 'calendar_month', etiqueta: 'Horarios', ruta: '/horarios' },
  { icono: 'people', etiqueta: 'Usuarios', ruta: '/admin/usuarios' },
  { icono: 'upload_file', etiqueta: 'Carga Masiva', ruta: '/admin/carga-masiva' },

  // ─── Carreras universitarias (trabajo grupal CJGP) ───
  { icono: 'account_tree', etiqueta: 'Carreras y Pensums', ruta: '/admin/carreras', encabezado: 'Carreras (CJGP)', separador: true },
  { icono: 'event_repeat', etiqueta: 'Períodos Académicos', ruta: '/admin/periodos' },
  { icono: 'person_add', etiqueta: 'Inscripción de Alumnos', ruta: '/admin/inscripcion-alumnos' },

  // ─── Control de Estudios de las carreras (módulo JC) ───
  { icono: 'rule', etiqueta: 'Planes de Evaluación', ruta: '/admin/planes-evaluacion', encabezado: 'Control de Estudios (JC)', separador: true },
  { icono: 'grading', etiqueta: 'Carga de Notas y Actas', ruta: '/control-estudios/carga-notas' },
  { icono: 'dataset', etiqueta: 'Consola Control Estudios', ruta: '/admin/control-estudios' },

  // ─── Cursos libres del sistema original (independientes de la carrera) ───
  { icono: 'school', etiqueta: 'Cursos', ruta: '/cursos', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'how_to_reg', etiqueta: 'Inscripciones de Cursos', ruta: '/inscripciones' },

  { icono: 'workspace_premium', etiqueta: 'Certificados', ruta: '/certificados', encabezado: 'Certificación', separador: true },
  { icono: 'image', etiqueta: 'Plantillas', ruta: '/plantillas-certificados' },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },
  { icono: 'inventory', etiqueta: 'Gestión de Productos', ruta: '/admin/tienda' },
  { icono: 'settings', etiqueta: 'Configuración', ruta: '/admin/configuracion', encabezado: 'Sistema', separador: true },
];

/** Menú del Profesor */
const MENU_PROFESOR_AHBB = [
  { icono: 'dashboard', etiqueta: 'Mi Panel', ruta: '/dashboard', encabezado: 'Principal' },
  { icono: 'calendar_month', etiqueta: 'Mis Horarios', ruta: '/horarios' },

  // ─── Carreras: materias asignadas al docente (CJGP/JC) ───
  { icono: 'collections_bookmark', etiqueta: 'Mis Materias', ruta: '/profesor/mis-materias-carrera', encabezado: 'Carreras (CJGP)', separador: true },
  { icono: 'history_edu', etiqueta: 'Mi Historial de Materias', ruta: '/profesor/historial-materias' },
  { icono: 'grading', etiqueta: 'Carga de Notas y Actas', ruta: '/control-estudios/carga-notas', encabezado: 'Control de Estudios (JC)', separador: true },

  // ─── Cursos libres del sistema original ───
  { icono: 'school', etiqueta: 'Mis Cursos', ruta: '/cursos', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'add_circle', etiqueta: 'Crear Curso', ruta: '/cursos/nuevo' },
  { icono: 'how_to_reg', etiqueta: 'Inscripciones de Cursos', ruta: '/profesor/inscripciones' },
  { icono: 'groups', etiqueta: 'Mis Alumnos', ruta: '/profesor/mis-alumnos' },

  { icono: 'workspace_premium', etiqueta: 'Certificados', ruta: '/certificados', encabezado: 'Certificación', separador: true },
  { icono: 'draw', etiqueta: 'Mi Firma Digital', ruta: '/profesor/firma-digital' },
  { icono: 'image', etiqueta: 'Plantilla Certificado', ruta: '/plantillas-certificados' },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },
];

/** Menú del Alumno */
const MENU_ALUMNO_AHBB = [
  { icono: 'dashboard', etiqueta: 'Mi Panel', ruta: '/dashboard', encabezado: 'Principal' },
  { icono: 'calendar_month', etiqueta: 'Mis Horarios', ruta: '/horarios' },

  // ─── MI CARRERA: pensum, materias, notas y expediente (CJGP/JC) ───
  { icono: 'app_registration', etiqueta: 'Inscripción de Materias', ruta: '/alumno/inscripcion-materias', encabezado: 'Mi Carrera', separador: true },
  { icono: 'collections_bookmark', etiqueta: 'Mis Materias', ruta: '/alumno/mis-materias' },
  { icono: 'grading', etiqueta: 'Mis Notas', ruta: '/alumno/mis-notas' },
  { icono: 'history_edu', etiqueta: 'Historial de Carrera', ruta: '/alumno/historial-carrera' },

  // ─── CURSOS EXTRACURRICULARES: cursos libres certificados (_ahbb) ───
  { icono: 'menu_book', etiqueta: 'Oferta de Cursos', ruta: '/alumno/oferta-academica', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'assignment', etiqueta: 'Mis Inscripciones de Cursos', ruta: '/alumno/mis-inscripciones' },
  { icono: 'history', etiqueta: 'Historial de Cursos', ruta: '/alumno/historial' },

  { icono: 'workspace_premium', etiqueta: 'Mis Certificados', ruta: '/alumno/mis-certificados', encabezado: 'Certificación', separador: true },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },
];

/**
 * Mapa de menús por rol para acceso rápido.
 */
const MENUS_POR_ROL_AHBB = {
  [ROLES_AHBB.ADMINISTRADOR]: MENU_ADMINISTRADOR_AHBB,
  [ROLES_AHBB.PROFESOR]: MENU_PROFESOR_AHBB,
  [ROLES_AHBB.ALUMNO]: MENU_ALUMNO_AHBB,
};

/**
 * Obtiene la lista de enlaces del menú según el rol del usuario.
 * @param rol_ahbb - Rol del usuario autenticado
 * @returns Lista de enlaces para el sidebar
 */
export const obtenerMenuPorRol_ahbb = (rol_ahbb) => {
  return MENUS_POR_ROL_AHBB[rol_ahbb] ?? [];
};
