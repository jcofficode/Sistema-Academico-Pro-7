/**
 * roles_ahbb.js — Constantes relacionadas con los roles del sistema
 * Define los roles posibles y utilidades para validación de permisos.
 *
 * El backend guarda los roles en MAYÚSCULAS (ADMIN, CONTROL_ESTUDIOS,
 * PROFESOR, ALUMNO) y los traduce a estos valores en minúsculas al devolver
 * el perfil. La equivalencia vive en `backend/src/common/constantes/roles_jc.ts`.
 */

/** Roles disponibles en el sistema */
export const ROLES_AHBB = {
  ADMINISTRADOR: 'administrador',
  CONTROL_ESTUDIOS: 'control_estudios',
  PROFESOR: 'profesor',
  ALUMNO: 'alumno',
};

/** Lista de roles para iteraciones (selects, validaciones) */
export const LISTA_ROLES_AHBB = [
  { valor: ROLES_AHBB.ADMINISTRADOR, etiqueta: 'Administrador' },
  { valor: ROLES_AHBB.CONTROL_ESTUDIOS, etiqueta: 'Control de Estudios' },
  { valor: ROLES_AHBB.PROFESOR, etiqueta: 'Profesor' },
  { valor: ROLES_AHBB.ALUMNO, etiqueta: 'Alumno' },
];

/** Metadatos de presentación por rol (color e icono en toda la interfaz). */
export const PRESENTACION_ROLES_AHBB = {
  [ROLES_AHBB.ADMINISTRADOR]: {
    etiqueta: 'Administrador',
    color: 'deep-purple',
    icono: 'admin_panel_settings',
  },
  [ROLES_AHBB.CONTROL_ESTUDIOS]: {
    etiqueta: 'Control de Estudios',
    color: 'teal',
    icono: 'fact_check',
  },
  [ROLES_AHBB.PROFESOR]: {
    etiqueta: 'Profesor',
    color: 'primary',
    icono: 'co_present',
  },
  [ROLES_AHBB.ALUMNO]: {
    etiqueta: 'Alumno',
    color: 'orange',
    icono: 'school',
  },
};

/**
 * Roles que pueden operar Control de Estudios (cargar notas, registrar
 * reparaciones y emitir actas). El administrador queda fuera a propósito:
 * su acceso al módulo es solo de consulta.
 */
export const ROLES_OPERADORES_NOTAS_AHBB = [
  ROLES_AHBB.PROFESOR,
  ROLES_AHBB.CONTROL_ESTUDIOS,
];

/**
 * Verifica si un rol dado es válido.
 * @param rol_ahbb - Rol a verificar
 * @returns true si el rol existe en el sistema
 */
export const esRolValido_ahbb = (rol_ahbb) => {
  return Object.values(ROLES_AHBB).includes(rol_ahbb);
};

/** Devuelve la etiqueta legible de un rol (o el propio valor si no existe). */
export const etiquetaRol_ahbb = (rol_ahbb) =>
  PRESENTACION_ROLES_AHBB[rol_ahbb]?.etiqueta ?? rol_ahbb ?? 'Sin rol';
