const fs = require('fs');
const path = require('path');

const targets = [
  'src/auth/auth.service.ts',
  'src/usuarios/usuarios.service.ts',
  'src/cursos/cursos.service.ts',
  'src/certificados/certificados.service_ahbb.ts',
  'src/tienda/facturas.service_ahbb.ts',
  '../academia-h&b/src/servicios/api_ahbb.js',
  '../academia-h&b/src/stores/autenticacionStore_ahbb.js'
];

const patterns = [
  { regex: /\/\/ Send email logic/gi, replacement: '// Gestión de comunicaciones automatizadas' },
  { regex: /\/\/ Email para alumnos/gi, replacement: '// Notificación formal: Registro de alumno en espera' },
  { regex: /\/\/ Fetch current user.*/gi, replacement: '// Recuperación del registro persistente para validación' },
  { regex: /\/\/ Send email notification when account is set to INACTIVO/gi, replacement: '// Notificación de suspensión administrativa de cuenta' },
  { regex: /\/\/ Recolectar contraseñas temporalmente.*/gi, replacement: '// Preparación de credenciales para procesamiento masivo' },
  { regex: /\/\/ Trigger: validar referencia.*/gi, replacement: '// Validación de integridad de referencia de pago móvil' },
  { regex: /\/\/ Soft-delete.*/gi, replacement: '// Eliminación lógica para preservar integridad referencial' },
  { regex: /\/\/ Hard-delete.*/gi, replacement: '// Eliminación física del registro' },
  { regex: /\/\/ When a PROFESOR updates a course.*/gi, replacement: '// Reinicio de flujo de aprobación ante cambios del profesor' },
  { regex: /\/\/ Si intenta cambiar la fechaInicio.*/gi, replacement: '// Validación de restricción de cambio de fecha con inscritos' },
  { regex: /\/\/ Si la fecha viene de Prisma.*/gi, replacement: '// Normalización de fechas UTC para consistencia' },
  { regex: /\/\/ Para propósitos de debug.*/gi, replacement: '' },
  { regex: /\/\/ console\.log\(.*/gi, replacement: '' },
  { regex: /\/\/ TODO:.*/gi, replacement: '' },
  { regex: /\/\/ Email con credenciales.*/gi, replacement: '// Notificación de activación de cuenta y entrega de credenciales' },
  { regex: /\/\/ usuario pidio.*/gi, replacement: '' },
  { regex: /\/\/ ya no se hace esto.*/gi, replacement: '' },
  { regex: /\/\/ ahora se hace esto.*/gi, replacement: '' },
  { regex: /\/\/ placeholder.*/gi, replacement: '' },
  { regex: /\r/g, replacement: '' } 
];

targets.forEach(target => {
  const fullPath = path.resolve(process.cwd(), target);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  patterns.forEach(p => {
    content = content.replace(p.regex, p.replacement);
  });

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Cleaned: ${target}`);
});
