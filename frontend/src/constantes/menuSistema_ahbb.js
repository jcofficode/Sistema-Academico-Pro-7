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

  // ─── Planificación (GA) ───
  { icono: 'format_list_bulleted', etiqueta: 'Plantillas de Plan', ruta: '/admin/plan-estudio/plantillas', encabezado: 'Planificación (GA)', separador: true },
  { icono: 'checklist_rtl', etiqueta: 'Bandeja de Revisión', ruta: '/admin/plan-estudio/bandeja' },

  // ─── Cursos libres del sistema original (independientes de la carrera) ───
  { icono: 'school', etiqueta: 'Cursos', ruta: '/cursos', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'how_to_reg', etiqueta: 'Inscripciones de Cursos', ruta: '/inscripciones' },

  { icono: 'workspace_premium', etiqueta: 'Certificados', ruta: '/certificados', encabezado: 'Certificación', separador: true },
  { icono: 'image', etiqueta: 'Plantillas', ruta: '/plantillas-certificados' },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },
  { icono: 'inventory', etiqueta: 'Gestión de Productos', ruta: '/admin/tienda' },
  { icono: 'settings', etiqueta: 'Configuración', ruta: '/admin/configuracion', encabezado: 'Sistema', separador: true },

  // ─── Sistema de Pagos (AP) ───
  { icono: 'payments', etiqueta: 'Tarifas de Pago', ruta: '/admin/pagos/tarifas', encabezado: 'Sistema de Pagos (AP)', separador: true },
  { icono: 'task_alt', etiqueta: 'Confirmar Pagos', ruta: '/admin/pagos/confirmar' },
  { icono: 'badge', etiqueta: 'Contratos de Docentes', ruta: '/admin/pagos/contratos' },
  { icono: 'receipt_long', etiqueta: 'Nómina Docente', ruta: '/admin/pagos/nomina' },
];

/** Menú del Profesor */
const MENU_PROFESOR_AHBB = [
  { icono: 'dashboard', etiqueta: 'Mi Panel', ruta: '/dashboard', encabezado: 'Principal' },
  { icono: 'calendar_month', etiqueta: 'Mis Horarios', ruta: '/horarios' },

  // ─── Carreras: materias asignadas al docente (CJGP/JC) ───
  { icono: 'collections_bookmark', etiqueta: 'Mis Materias', ruta: '/profesor/mis-materias-carrera', encabezado: 'Carreras (CJGP)', separador: true },
  { icono: 'history_edu', etiqueta: 'Mi Historial de Materias', ruta: '/profesor/historial-materias' },
  { icono: 'grading', etiqueta: 'Carga de Notas y Actas', ruta: '/control-estudios/carga-notas', encabezado: 'Control de Estudios (JC)', separador: true },

  // ─── Planificación (GA) ───
  { icono: 'edit_note', etiqueta: 'Elaborar Plan de Estudio', ruta: '/profesor/plan-estudio', encabezado: 'Planificación (GA)', separador: true },

  // ─── Cursos libres del sistema original ───
  { icono: 'school', etiqueta: 'Mis Cursos', ruta: '/cursos', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'add_circle', etiqueta: 'Crear Curso', ruta: '/cursos/nuevo' },
  { icono: 'how_to_reg', etiqueta: 'Inscripciones de Cursos', ruta: '/profesor/inscripciones' },
  { icono: 'groups', etiqueta: 'Mis Alumnos', ruta: '/profesor/mis-alumnos' },

  { icono: 'workspace_premium', etiqueta: 'Certificados', ruta: '/certificados', encabezado: 'Certificación', separador: true },
  { icono: 'draw', etiqueta: 'Mi Firma Digital', ruta: '/profesor/firma-digital' },
  { icono: 'image', etiqueta: 'Plantilla Certificado', ruta: '/plantillas-certificados' },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },

  // ─── Aula Virtual (RP) ───
  { icono: 'ondemand_video', etiqueta: 'Cursos Multimedia', ruta: '/profesor/cursos-multimedia', encabezado: 'Aula Virtual (RP)', separador: true },

  // ─── Sistema de Pagos (AP) ───
  { icono: 'badge', etiqueta: 'Mi Contrato', ruta: '/profesor/pagos/mi-contrato', encabezado: 'Mis Pagos (AP)', separador: true },
  { icono: 'receipt_long', etiqueta: 'Mis Recibos de Nómina', ruta: '/profesor/pagos/mis-recibos' },
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

  // ─── Planificación (GA) ───
  { icono: 'visibility', etiqueta: 'Planes de Estudio', ruta: '/alumno/planes-estudio', encabezado: 'Planificación (GA)', separador: true },

  // ─── CURSOS EXTRACURRICULARES: cursos libres certificados (_ahbb) ───
  { icono: 'menu_book', etiqueta: 'Oferta de Cursos', ruta: '/alumno/oferta-academica', encabezado: 'Cursos Extracurriculares', separador: true },
  { icono: 'assignment', etiqueta: 'Mis Inscripciones de Cursos', ruta: '/alumno/mis-inscripciones' },
  { icono: 'history', etiqueta: 'Historial de Cursos', ruta: '/alumno/historial' },

  { icono: 'workspace_premium', etiqueta: 'Mis Certificados', ruta: '/alumno/mis-certificados', encabezado: 'Certificación', separador: true },
  { icono: 'store', etiqueta: 'Tienda Oficial', ruta: '/tienda', encabezado: 'E-Commerce', separador: true },

  // ─── Aula Virtual (RP) ───
  { icono: 'school', etiqueta: 'Mi Aula Virtual', ruta: '/alumno/aula-virtual', encabezado: 'Aula Virtual (RP)', separador: true },

  // ─── Sistema de Pagos (AP) ───
  { icono: 'account_balance_wallet', etiqueta: 'Mis Pagos', ruta: '/alumno/mis-pagos', encabezado: 'Sistema de Pagos (AP)', separador: true },
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
