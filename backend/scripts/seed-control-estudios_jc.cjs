/**
 * seed-control-estudios_jc.cjs — Datos de demostración exhaustivos para
 * TODOS los módulos de Control de Estudios (_jc).
 *
 * Módulos sembrados:
 *   1. Cuenta Operativa de Control de Estudios (control@academiah-b.edu)
 *   2. Plan de Evaluación Institucional y por Carrera (Cortes e Ítems evaluables)
 *   3. Carga Parcial de Calificaciones (por corte) y Nota por Contingencia
 *   4. Registro de Reparaciones / Recuperaciones por corte
 *   5. Generación de Actas Blancas con Hash SHA-256 de integridad
 *   6. Emisión de Certificados de Sobresaliente (Rango de Excelencia 17-20 pts)
 *   7. Bandeja de Notificaciones Internas (Felicitaciones, Informativas, Advertencias)
 *   8. Bitácora de Auditoría Académica y de Seguridad
 *
 * Uso:
 *   npm run seed:control    → siembra datos sobre la base actual sin borrar nada
 *   npm run reset:control   → reinicia las tablas del módulo _jc y vuelve a sembrar
 */
require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MODO_RESET = process.argv.includes('--reset');

async function limpiarControlEstudios() {
  console.log('🧹 MODO RESET: Limpiando tablas del módulo Control de Estudios (_jc)...');
  await prisma.td_notificacion_jc.deleteMany();
  await prisma.td_auditoria_jc.deleteMany();
  await prisma.td_certificado_sobresaliente_jc.deleteMany();
  await prisma.td_acta_jc.deleteMany();
  await prisma.td_reparacion_jc.deleteMany();
  await prisma.td_calificacion_jc.deleteMany();
  await prisma.td_item_evaluacion_jc.deleteMany();
  await prisma.td_plan_evaluacion_jc.deleteMany();
  console.log('✅ Tablas de Control de Estudios (_jc) limpiadas correctamente.');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' 🎓 SEMBRANDO DATOS DE CONTROL DE ESTUDIOS (MÓDULOS _jc)');
  console.log('═══════════════════════════════════════════════════════════════');

  if (MODO_RESET) {
    await limpiarControlEstudios();
  }

  // 1. Usuario del rol Control de Estudios
  const passHash = await bcrypt.hash('control123', 10);
  const usuarioControl = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'control@academiah-b.edu' },
    update: { rol_ahbb: 'CONTROL_ESTUDIOS', estadoCuenta_ahbb: 'ACTIVO' },
    create: {
      cedula_ahbb: 'V-10000005',
      nombre_ahbb: 'Sofia',
      apellido_ahbb: 'Rangel',
      correo_ahbb: 'control@academiah-b.edu',
      contrasena_ahbb: passHash,
      rol_ahbb: 'CONTROL_ESTUDIOS',
      estadoCuenta_ahbb: 'ACTIVO',
    },
  });
  console.log(`📌 Usuario Control de Estudios: ${usuarioControl.correo_ahbb} (ID: ${usuarioControl.id_usuario_ahbb})`);

  // 2. Garantizar Período Activo
  const periodoActivo = await prisma.td_periodo_academico_cjgp.upsert({
    where: { nombre_cjgp: '2026-II' },
    update: { activo_cjgp: true },
    create: {
      nombre_cjgp: '2026-II',
      fechaInicio_cjgp: new Date('2026-07-13'),
      fechaFin_cjgp: new Date('2026-12-11'),
      activo_cjgp: true,
    },
  });

  // 3. Garantizar Carrera e Inscripciones
  let carrera = await prisma.td_carrera_cjgp.findUnique({
    where: { codigo_cjgp: 'INF' },
    include: { materias_cjgp: true },
  });

  if (!carrera) {
    carrera = await prisma.td_carrera_cjgp.create({
      data: {
        codigo_cjgp: 'INF',
        nombre_cjgp: 'Ingeniería en Informática',
        descripcion_cjgp: 'Carrera de formación profesional en software e informática.',
        regimen_cjgp: 'SEMESTRAL',
        duracionAnios_cjgp: 3,
        limiteCreditos_cjgp: 21,
        materias_cjgp: {
          create: [
            { codigo_cjgp: 'MAT1', nombre_cjgp: 'Matemática I', creditos_cjgp: 4, nroBloque_cjgp: 1 },
            { codigo_cjgp: 'PRG1', nombre_cjgp: 'Programación I', creditos_cjgp: 5, nroBloque_cjgp: 1 },
            { codigo_cjgp: 'BD1', nombre_cjgp: 'Base de Datos I', creditos_cjgp: 4, nroBloque_cjgp: 2 },
          ],
        },
      },
      include: { materias_cjgp: true },
    });
  }

  const materias = await prisma.td_materia_cjgp.findMany({
    where: { id_carrera_materia_cjgp: carrera.id_carrera_cjgp },
    orderBy: { id_materia_cjgp: 'asc' },
  });
  const materiaMat1 = materias.find((m) => m.codigo_cjgp === 'MAT1') || materias[0];
  const materiaPrg1 = materias.find((m) => m.codigo_cjgp === 'PRG1') || materias[1] || materias[0];

  // Garantizar Alumnos de prueba
  let alumnos = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'ALUMNO' },
    orderBy: { id_usuario_ahbb: 'asc' },
    take: 5,
  });

  if (alumnos.length === 0) {
    // Si no existen alumnos en la BD, creamos 4 alumnos de demostración
    const alumnosDemo = [
      { cedula: 'V-28111222', nombre: 'María', apellido: 'García', correo: 'maria@estudiante.edu' },
      { cedula: 'V-29333444', nombre: 'Pedro', apellido: 'Pérez', correo: 'pedro@estudiante.edu' },
      { cedula: 'V-30555666', nombre: 'Ana', apellido: 'López', correo: 'ana@estudiante.edu' },
      { cedula: 'V-31777888', nombre: 'Carlos', apellido: 'Rodríguez', correo: 'carlos@estudiante.edu' },
    ];
    for (const a of alumnosDemo) {
      await prisma.td_usuario_ahbb.upsert({
        where: { correo_ahbb: a.correo },
        update: {},
        create: {
          cedula_ahbb: a.cedula,
          nombre_ahbb: a.nombre,
          apellido_ahbb: a.apellido,
          correo_ahbb: a.correo,
          contrasena_ahbb: passHash,
          rol_ahbb: 'ALUMNO',
          estadoCuenta_ahbb: 'ACTIVO',
        },
      });
    }
    alumnos = await prisma.td_usuario_ahbb.findMany({
      where: { rol_ahbb: 'ALUMNO' },
      orderBy: { id_usuario_ahbb: 'asc' },
      take: 5,
    });
  }

  // ── MÓDULO 1: Plan de Evaluación Institucional (_jc) ────────────
  let plan = await prisma.td_plan_evaluacion_jc.findFirst({
    where: {
      id_periodo_plan_jc: periodoActivo.id_periodo_cjgp,
      id_carrera_plan_jc: null,
    },
    include: { items_jc: true },
  });

  if (!plan) {
    plan = await prisma.td_plan_evaluacion_jc.create({
      data: {
        nombre_jc: 'Plan Institucional de Evaluación 2026-II',
        id_periodo_plan_jc: periodoActivo.id_periodo_cjgp,
        notaMaxima_jc: 20,
        notaAprobatoria_jc: 10,
        estado_jc: 'PUBLICADO',
        items_jc: {
          create: [
            { nombre_jc: 'Corte 1 (Primer Parcial)', orden_jc: 1, peso_jc: 25 },
            { nombre_jc: 'Corte 2 (Segundo Parcial)', orden_jc: 2, peso_jc: 25 },
            { nombre_jc: 'Corte 3 (Tercer Parcial)', orden_jc: 3, peso_jc: 25 },
            { nombre_jc: 'Corte 4 (Proyecto / Final)', orden_jc: 4, peso_jc: 25 },
          ],
        },
      },
      include: { items_jc: true },
    });
  }
  const items = plan.items_jc.sort((a, b) => a.orden_jc - b.orden_jc);
  console.log(`📋 Plan de Evaluación: "${plan.nombre_jc}" con ${items.length} cortes evaluables (25% c/u).`);

  // ── MÓDULO 2 Y 3: Inscripciones, Calificaciones Parciales y Reparación ──
  const inscripcionesMAT1 = [];

  // Datos simulados para 4 alumnos en MAT1
  // Alumno 1 (María): Sobresaliente (19.5 pts)
  // Alumno 2 (Pedro): Sobresaliente (18.0 pts)
  // Alumno 3 (Ana): Aprobado regular con Reparación en Corte 1 (08 -> 14 pts)
  // Alumno 4 (Carlos): Nota por Contingencia (18.0 pts)
  const notasPorAlumno = [
    [19.5, 20.0, 19.0, 19.5], // Definitiva 19.5
    [18.0, 17.5, 18.5, 18.0], // Definitiva 18.0
    [8.0,  14.0, 12.0, 12.0], // Corte 1 reparado de 8.0 a 14.0
    [18.0, 18.0, 18.0, 18.0], // Contingencia
  ];

  for (let i = 0; i < Math.min(alumnos.length, 4); i++) {
    const alumno = alumnos[i];
    const inscripcion = await prisma.td_inscripcion_materia_cjgp.upsert({
      where: {
        id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
          id_usuario_im_cjgp: alumno.id_usuario_ahbb,
          id_materia_im_cjgp: materiaMat1.id_materia_cjgp,
          id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
        },
      },
      update: { estatus_cjgp: 'APROBADO' },
      create: {
        id_usuario_im_cjgp: alumno.id_usuario_ahbb,
        id_materia_im_cjgp: materiaMat1.id_materia_cjgp,
        id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
        estatus_cjgp: 'APROBADO',
      },
    });
    inscripcionesMAT1.push({ inscripcion, alumno, notas: notasPorAlumno[i] });

    // Cargar calificaciones por corte
    for (let c = 0; c < items.length; c++) {
      const item = items[c];
      const notaValor = notasPorAlumno[i][c];

      await prisma.td_calificacion_jc.upsert({
        where: {
          id_inscripcion_materia_cal_jc_id_item_cal_jc: {
            id_inscripcion_materia_cal_jc: inscripcion.id_inscripcion_materia_cjgp,
            id_item_cal_jc: item.id_item_jc,
          },
        },
        update: { valor_jc: notaValor, cargadoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb },
        create: {
          id_inscripcion_materia_cal_jc: inscripcion.id_inscripcion_materia_cjgp,
          id_item_cal_jc: item.id_item_jc,
          valor_jc: notaValor,
          cargadoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
        },
      });
    }
  }

  // Cargar una REPARACIÓN en Corte 1 para Ana (Alumno 3)
  if (inscripcionesMAT1.length >= 3) {
    const inscripAna = inscripcionesMAT1[2].inscripcion;
    const corte1 = items[0];
    await prisma.td_reparacion_jc.upsert({
      where: {
        id_inscripcion_materia_rep_jc_id_item_rep_jc: {
          id_inscripcion_materia_rep_jc: inscripAna.id_inscripcion_materia_cjgp,
          id_item_rep_jc: corte1.id_item_jc,
        },
      },
      update: { valor_jc: 14.0, observacion_jc: 'Recuperación aprobada en examen sustitutivo de Corte 1' },
      create: {
        id_inscripcion_materia_rep_jc: inscripAna.id_inscripcion_materia_cjgp,
        id_item_rep_jc: corte1.id_item_jc,
        valor_jc: 14.0,
        observacion_jc: 'Recuperación aprobada en examen sustitutivo de Corte 1',
        registradoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
      },
    });
    console.log(`🛠️ Reparación de Corte 1 registrada para ${alumnos[2].nombre_ahbb} ${alumnos[2].apellido_ahbb} (08.0 -> 14.0 pts).`);
  }

  // ── MÓDULO 4: Cierre de Acta Blanca (_jc) ────────────────────────
  // Actualizar notas definitivas acumuladas en inscripciones
  const notaFinalMaria = 19.5;
  const notaFinalPedro = 18.0;
  const notaFinalAna = 13.0; // (14 + 14 + 12 + 12)/4
  const notaFinalCarlos = 18.0;

  const definitivas = [notaFinalMaria, notaFinalPedro, notaFinalAna, notaFinalCarlos];

  for (let i = 0; i < inscripcionesMAT1.length; i++) {
    await prisma.td_inscripcion_materia_cjgp.update({
      where: { id_inscripcion_materia_cjgp: inscripcionesMAT1[i].inscripcion.id_inscripcion_materia_cjgp },
      data: {
        estatus_cjgp: 'APROBADO',
        notaFinal_cjgp: definitivas[i],
      },
    });
  }

  const hashContenidoActa = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      materia: materiaMat1.codigo_cjgp,
      periodo: periodoActivo.nombre_cjgp,
      alumnos: inscripcionesMAT1.map((item, idx) => ({
        cedula: item.alumno.cedula_ahbb,
        definitiva: definitivas[idx],
      })),
    }))
    .digest('hex');

  const codigoActa = `ACTA-${periodoActivo.nombre_cjgp}-${materiaMat1.codigo_cjgp}-SEED01`;

  const actaBlanca = await prisma.td_acta_jc.upsert({
    where: { codigo_jc: codigoActa },
    update: { hashVerificacion_jc: hashContenidoActa },
    create: {
      codigo_jc: codigoActa,
      tipo_jc: 'BLANCA',
      hashVerificacion_jc: hashContenidoActa,
      id_materia_acta_jc: materiaMat1.id_materia_cjgp,
      id_periodo_acta_jc: periodoActivo.id_periodo_cjgp,
      generadaPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
    },
  });
  console.log(`📄 Acta Blanca Cerrada: Código ${actaBlanca.codigo_jc} (Hash SHA-256: ${actaBlanca.hashVerificacion_jc.substring(0, 16)}...)`);

  // ── MÓDULO 5: Certificados de Sobresaliente (_jc) ────────────────
  // Emitir certificado a María (19.5 pts) y Pedro (18.0 pts)
  const sobresalientes = [
    { inscripObj: inscripcionesMAT1[0], nota: 19.5 },
    { inscripObj: inscripcionesMAT1[1], nota: 18.0 },
  ];

  for (const item of sobresalientes) {
    const { inscripObj, nota } = item;
    const codigoCert = `SOB-${periodoActivo.nombre_cjgp}-${materiaMat1.codigo_cjgp}-${inscripObj.alumno.cedula_ahbb}`;
    const hashCert = crypto
      .createHash('sha256')
      .update(`${codigoCert}|${inscripObj.alumno.cedula_ahbb}|${materiaMat1.codigo_cjgp}|${nota}`)
      .digest('hex');

    await prisma.td_certificado_sobresaliente_jc.upsert({
      where: { id_inscripcion_materia_cer_jc: inscripObj.inscripcion.id_inscripcion_materia_cjgp },
      update: { notaFinal_jc: nota, hashVerificacion_jc: hashCert },
      create: {
        codigo_jc: codigoCert,
        notaFinal_jc: nota,
        hashVerificacion_jc: hashCert,
        id_inscripcion_materia_cer_jc: inscripObj.inscripcion.id_inscripcion_materia_cjgp,
        id_alumno_cer_jc: inscripObj.alumno.id_usuario_ahbb,
        emitidoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
        anulado_jc: false,
      },
    });
    console.log(`🏆 Certificado de Sobresaliente emitido a ${inscripObj.alumno.nombre_ahbb} ${inscripObj.alumno.apellido_ahbb} (Nota: ${nota} pts, Código: ${codigoCert})`);
  }

  // ── MÓDULO 6: Notificaciones Internas en Bandeja (_jc) ───────────
  const notificacionesSeed = [
    {
      usuarioId: inscripcionesMAT1[0].alumno.id_usuario_ahbb,
      titulo: '🌟 ¡Felicitaciones! Certificado de Sobresaliente',
      mensaje: `Has obtenido un Certificado de Excelencia Académica en la asignatura ${materiaMat1.nombre_cjgp} (${materiaMat1.codigo_cjgp}) con una calificación de ${notaFinalMaria} pts.`,
      tipo: 'FELICITACION',
      icono: 'military_tech',
      enlace: '/alumno/certificados',
    },
    {
      usuarioId: inscripcionesMAT1[1].alumno.id_usuario_ahbb,
      titulo: '🌟 ¡Felicitaciones! Certificado de Sobresaliente',
      mensaje: `Has obtenido un Certificado de Excelencia Académica en la asignatura ${materiaMat1.nombre_cjgp} (${materiaMat1.codigo_cjgp}) con una calificación de ${notaFinalPedro} pts.`,
      tipo: 'FELICITACION',
      icono: 'military_tech',
      enlace: '/alumno/certificados',
    },
    {
      usuarioId: inscripcionesMAT1[2].alumno.id_usuario_ahbb,
      titulo: '📝 Examen de Reparación Registrado',
      mensaje: `Se ha procesado y registrado exitosamente tu nota de recuperación en el Corte 1 de ${materiaMat1.nombre_cjgp} (Calificación: 14.0 pts).`,
      tipo: 'ADVERTENCIA',
      icono: 'assignment_turned_in',
      enlace: '/alumno/mis-notas',
    },
    {
      usuarioId: inscripcionesMAT1[3].alumno.id_usuario_ahbb,
      titulo: '🔒 Cierre de Acta de Calificaciones',
      mensaje: `Se ha emitido el Acta Final de Calificaciones para la asignatura ${materiaMat1.nombre_cjgp} en el período ${periodoActivo.nombre_cjgp}.`,
      tipo: 'INFORMATIVA',
      icono: 'fact_check',
      enlace: '/alumno/mis-notas',
    },
  ];

  for (const notif of notificacionesSeed) {
    await prisma.td_notificacion_jc.create({
      data: {
        titulo_jc: notif.titulo,
        mensaje_jc: notif.mensaje,
        tipo_jc: notif.tipo,
        icono_jc: notif.icono,
        enlace_jc: notif.enlace,
        leida_jc: false,
        id_usuario_not_jc: notif.usuarioId,
      },
    });
  }
  console.log(`🔔 Notificaciones internas enviadas a las bandejas de los estudiantes.`);

  // ── MÓDULO 7: Bitácora de Auditoría del Sistema (_jc) ─────────────
  const eventosAuditoria = [
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'PLAN_EVALUACION_PUBLICADO',
      descripcion: `Publicación del Plan Institucional de Evaluación 2026-II con 4 cortes porcentuales de 25%.`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_plan_evaluacion_jc',
      idEntidad: plan.id_plan_jc,
      metodo: 'POST',
      ruta: '/api/control-estudios/planes-evaluacion',
      estadoHttp: 201,
    },
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'NOTAS_CARGADAS',
      descripcion: `Carga masiva de calificaciones parciales para la asignatura ${materiaMat1.nombre_cjgp} (${inscripcionesMAT1.length} alumnos procesados).`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_calificacion_jc',
      metodo: 'POST',
      ruta: '/api/control-estudios/calificaciones/cargar-masiva',
      estadoHttp: 200,
    },
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'NOTA_CONTINGENCIA_REGISTRADA',
      descripcion: `Asentamiento directo de nota por contingencia para el alumno ${alumnos[3].nombre_ahbb} ${alumnos[3].apellido_ahbb} en ${materiaMat1.nombre_cjgp} (Nota: 18.0 pts). Motivo: Justificativo médico institucional presentado ante la Dirección.`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      afectadoId: alumnos[3].id_usuario_ahbb,
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_inscripcion_materia_cjgp',
      idEntidad: inscripcionesMAT1[3].inscripcion.id_inscripcion_materia_cjgp,
      metodo: 'POST',
      ruta: '/api/control-estudios/contingencia',
      estadoHttp: 200,
    },
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'REPARACION_REGISTRADA',
      descripcion: `Registro de calificación en examen sustitutivo de recuperación para el Corte 1 de ${materiaMat1.nombre_cjgp} al alumno ${alumnos[2].nombre_ahbb} ${alumnos[2].apellido_ahbb} (Nota previa: 08.0 pts -> Nueva nota: 14.0 pts).`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      afectadoId: alumnos[2].id_usuario_ahbb,
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_reparacion_jc',
      metodo: 'POST',
      ruta: '/api/control-estudios/reparaciones',
      estadoHttp: 201,
    },
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'ACTA_EMITIDA',
      descripcion: `Emisión de Acta Blanca de Calificaciones Definitivas para ${materiaMat1.nombre_cjgp} (${periodoActivo.nombre_cjgp}). Código: ${actaBlanca.codigo_jc}. Hash de Integridad SHA-256 verificado.`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_acta_jc',
      idEntidad: actaBlanca.id_acta_jc,
      metodo: 'POST',
      ruta: '/api/control-estudios/actas/generar-pdf',
      estadoHttp: 201,
    },
    {
      modulo: 'CONTROL_ESTUDIOS',
      accion: 'CERTIFICADO_SOBRESALIENTE_EMITIDO',
      descripcion: `Generación y registro de Certificado de Sobresaliente por excelencia académica a favor del alumno ${alumnos[0].nombre_ahbb} ${alumnos[0].apellido_ahbb} (Nota final: 19.5 pts).`,
      resultado: 'EXITO',
      idUsuario: usuarioControl.id_usuario_ahbb,
      nombreUsuario: `${usuarioControl.nombre_ahbb} ${usuarioControl.apellido_ahbb}`,
      rolUsuario: 'CONTROL_ESTUDIOS',
      afectadoId: alumnos[0].id_usuario_ahbb,
      materiaId: materiaMat1.id_materia_cjgp,
      periodoId: periodoActivo.id_periodo_cjgp,
      entidad: 'td_certificado_sobresaliente_jc',
      metodo: 'POST',
      ruta: '/api/control-estudios/certificados-sobresaliente/emitir',
      estadoHttp: 201,
    },
  ];

  for (const aud of eventosAuditoria) {
    await prisma.td_auditoria_jc.create({
      data: {
        modulo_jc: aud.modulo,
        accion_jc: aud.accion,
        descripcion_jc: aud.descripcion,
        resultado_jc: aud.resultado,
        id_usuario_auditoria_jc: aud.idUsuario,
        nombreUsuario_jc: aud.nombreUsuario,
        rolUsuario_jc: aud.rolUsuario,
        id_afectado_jc: aud.afectadoId || null,
        id_materia_aud_jc: aud.materiaId || null,
        id_periodo_aud_jc: aud.periodoId || null,
        entidad_jc: aud.entidad || null,
        id_entidad_jc: aud.idEntidad || null,
        metodo_jc: aud.metodo || null,
        ruta_jc: aud.ruta || null,
        estadoHttp_jc: aud.estadoHttp || null,
        ip_jc: '127.0.0.1',
      },
    });
  }
  console.log(`🛡️ Bitácora de Auditoría: Se sembraron ${eventosAuditoria.length} registros de auditoría detallados.`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' ✨ SEED DE CONTROL DE ESTUDIOS COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════════════════');
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed de Control de Estudios:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
