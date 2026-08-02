/**
 * perfilesDemo_jc.js — Accesos rápidos de evaluación.
 *
 * Cuentas de demostración que el sistema siembra en el arranque
 * (`bootstrap.service_ahbb.ts` y `seed-academico_cjgp.cjs`). Se exponen en la
 * pantalla de login para que quien evalúe el proyecto pueda entrar con cada rol
 * sin escribir las credenciales a mano.
 *
 * ⚠️ Es una ayuda de demostración: para un despliegue real basta con eliminar
 *    este archivo y el bloque "Acceso rápido" de `LoginView_ahbb.vue`.
 */

import { ROLES_AHBB, PRESENTACION_ROLES_AHBB } from './roles_ahbb';

/** Perfiles disponibles en el selector, en el orden en que se muestran. */
export const PERFILES_DEMO_JC = [
  {
    rol: ROLES_AHBB.ADMINISTRADOR,
    etiqueta: 'Administrador',
    descripcion: 'Configura y supervisa',
    correo: 'admin@academiah-b.edu',
    contrasena: 'admin123',
  },
  {
    rol: ROLES_AHBB.CONTROL_ESTUDIOS,
    etiqueta: 'Control de Estudios',
    descripcion: 'Notas, actas y auditoría',
    correo: 'control@academiah-b.edu',
    contrasena: 'control123',
  },
  {
    rol: ROLES_AHBB.PROFESOR,
    etiqueta: 'Profesor',
    descripcion: 'Sus materias y notas',
    correo: 'carlos@academiah-b.edu',
    contrasena: 'prof123',
  },
  {
    rol: ROLES_AHBB.ALUMNO,
    etiqueta: 'Alumno',
    descripcion: 'Inscripción y calificaciones',
    correo: 'maria@estudiante.edu',
    contrasena: 'alum123',
  },
].map((perfil_jc) => ({
  // El color y el icono se toman del catálogo de roles para que el selector
  // use la misma identidad visual que el resto del sistema.
  ...perfil_jc,
  color: PRESENTACION_ROLES_AHBB[perfil_jc.rol]?.color ?? 'primary',
  icono: PRESENTACION_ROLES_AHBB[perfil_jc.rol]?.icono ?? 'person',
}));
