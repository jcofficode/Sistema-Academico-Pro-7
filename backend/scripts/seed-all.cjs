/**
 * seed-all.cjs — Script Maestro Unificado de Datos de Prueba.
 *
 * Pobla la base de datos completa con un escenario realista integrando
 * TODOS los módulos del sistema académico:
 *   1. Datos Base / Bootstrap: Usuarios (Admin, Control, Profesores, Alumnos), Cursos Demo (10) y Tienda.
 *   2. Módulo Académico (_cjgp): Períodos 2026-I/2026-II, Carrera INF, Pensum 12 materias, Prelaciones e Historial.
 *   3. Control de Estudios (_jc): Plan de Evaluación, Calificaciones, Reparaciones, Actas Blancas (SHA-256), Certificados Sobresaliente, Notificaciones y Auditoría.
 *   4. Planificación Curricular (_ga): Configuración de Período y Planificaciones (Entregada / Borrador).
 *   5. Multimedia y Aula Virtual (_jf): Lecciones (Video/Lectura), Evaluaciones JSON, Progreso y Salas de Videollamada (Curso 1 y Curso 10).
 *   6. Pagos y Nómina (_ap): Tarifas, Pagos (Confirmado/Pendiente) con Recibos SHA-256, Contratos y Nómina.
 *
 * Uso:
 *   npm run seed:all    → Pobla todos los módulos sobre lo existente (upserts seguros).
 *   npm run reset:all   → Limpia TODAS las tablas en orden de FKs y vuelve a sembrar el escenario limpio.
 */
require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MODO_RESET = process.argv.includes('--reset');

async function limpiarBaseDatosCompleta() {
  console.log('\n🧹 [RESET] Limpiando todas las tablas en orden seguro de claves foráneas...');

  // Módulo de Pagos (_ap)
  await prisma.td_recibo_pago_ap.deleteMany();
  await prisma.td_nomina_ap.deleteMany();
  await prisma.td_contrato_profesor_ap.deleteMany();
  await prisma.td_pago_ap.deleteMany();
  await prisma.td_tarifa_ap.deleteMany();

  // Módulo de Planificación Curricular (_ga)
  await prisma.td_indicadores_logro_ga.deleteMany();
  await prisma.td_actividades_evaluacion_ga.deleteMany();
  await prisma.td_detalles_didacticos_ga.deleteMany();
  await prisma.td_revisiones_plan_ga.deleteMany();
  await prisma.td_planificaciones_ga.deleteMany();
  await prisma.td_configuraciones_periodo_ga.deleteMany();

  // Módulo de Control de Estudios (_jc)
  await prisma.td_notificacion_jc.deleteMany();
  await prisma.td_auditoria_jc.deleteMany();
  await prisma.td_certificado_sobresaliente_jc.deleteMany();
  await prisma.td_acta_jc.deleteMany();
  await prisma.td_reparacion_jc.deleteMany();
  await prisma.td_calificacion_jc.deleteMany();
  await prisma.td_item_evaluacion_jc.deleteMany();
  await prisma.td_plan_evaluacion_jc.deleteMany();

  // Módulo Multimedia (_jf)
  await prisma.td_progreso_lecciones_jf.deleteMany();
  await prisma.td_evaluaciones_jf.deleteMany();
  await prisma.td_lecciones_jf.deleteMany();
  await prisma.td_bloques_jf.deleteMany();
  await prisma.td_salas_videollamadas_jf.deleteMany();

  // Módulo Académico (_cjgp)
  await prisma.td_inscripcion_materia_cjgp.deleteMany();
  await prisma.td_prelacion_cjgp.deleteMany();
  await prisma.td_materia_cjgp.deleteMany();
  await prisma.td_carrera_cjgp.deleteMany();
  await prisma.td_periodo_academico_cjgp.deleteMany();

  console.log('✅ Base de datos limpia de datos modulares.');
}

// Pensum demostración: [codigo, nombre, creditos, bloque, prelaciones]
const PENSUM_CJGP = [
  ['MAT1', 'Matemática I', 4, 1, []],
  ['PRG1', 'Programación I', 5, 1, []],
  ['ING1', 'Inglés Técnico I', 3, 1, []],
  ['MAT2', 'Matemática II', 4, 2, ['MAT1']],
  ['PRG2', 'Programación II', 5, 2, ['PRG1']],
  ['ING2', 'Inglés Técnico II', 3, 2, ['ING1']],
  ['BD1', 'Base de Datos I', 4, 3, ['PRG2']],
  ['EST1', 'Estadística I', 4, 3, ['MAT2']],
  ['BD2', 'Base de Datos II', 4, 4, ['BD1']],
  ['SOP1', 'Sistemas Operativos', 4, 4, ['PRG2']],
  ['RED1', 'Redes de Computadoras', 4, 5, ['SOP1']],
  ['PRY1', 'Proyecto de Grado', 6, 6, ['BD2', 'RED1']],
];

async function main() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log(' 🚀 INICIANDO SIEMBRA UNIFICADA DE DATOS (SEED MASTER)');
  console.log('════════════════════════════════════════════════════════════════════');

  if (MODO_RESET) {
    await limpiarBaseDatosCompleta();
  }

  // ──────────────────────────────────────────────────────────────────
  // 1. USUARIOS BASE Y OPERATIVOS
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 1. Sembrando Usuarios Base y Operativos...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const profHash = await bcrypt.hash('prof123', 10);
  const alumHash = await bcrypt.hash('alum123', 10);
  const controlHash = await bcrypt.hash('control123', 10);

  const admin = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'admin@academiah-b.edu' },
    update: { estadoCuenta_ahbb: 'ACTIVO' },
    create: { cedula_ahbb: 'V-10000001', nombre_ahbb: 'Administrador', apellido_ahbb: 'H&B', correo_ahbb: 'admin@academiah-b.edu', contrasena_ahbb: adminHash, rol_ahbb: 'ADMIN', estadoCuenta_ahbb: 'ACTIVO' },
  });

  const usuarioControl = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'control@academiah-b.edu' },
    update: { rol_ahbb: 'CONTROL_ESTUDIOS', estadoCuenta_ahbb: 'ACTIVO' },
    create: { cedula_ahbb: 'V-10000005', nombre_ahbb: 'Sofia', apellido_ahbb: 'Rangel', correo_ahbb: 'control@academiah-b.edu', contrasena_ahbb: controlHash, rol_ahbb: 'CONTROL_ESTUDIOS', estadoCuenta_ahbb: 'ACTIVO' },
  });

  const datosProf = [
    { cedula: 'V-10000002', nombre: 'Carlos', apellido: 'Mendez', correo: 'carlos@academiah-b.edu' },
    { cedula: 'V-10000003', nombre: 'Ana', apellido: 'Borges', correo: 'ana@academiah-b.edu' },
    { cedula: 'V-10000004', nombre: 'Luis', apellido: 'Carmona', correo: 'luis@academiah-b.edu' },
  ];
  for (const p of datosProf) {
    const usuarioExistente = await prisma.td_usuario_ahbb.findFirst({
      where: { OR: [{ correo_ahbb: p.correo }, { cedula_ahbb: p.cedula }] }
    });
    if (usuarioExistente) {
      await prisma.td_usuario_ahbb.update({
        where: { id_usuario_ahbb: usuarioExistente.id_usuario_ahbb },
        data: { estadoCuenta_ahbb: 'ACTIVO', rol_ahbb: 'PROFESOR' }
      });
    } else {
      await prisma.td_usuario_ahbb.create({
        data: { cedula_ahbb: p.cedula, nombre_ahbb: p.nombre, apellido_ahbb: p.apellido, correo_ahbb: p.correo, contrasena_ahbb: profHash, rol_ahbb: 'PROFESOR', estadoCuenta_ahbb: 'ACTIVO' }
      });
    }
  }

  const datosAlum = [
    { cedula: 'V-20000001', nombre: 'Maria', apellido: 'Garcia', correo: 'maria@estudiante.edu' },
    { cedula: 'V-20000002', nombre: 'Javier', apellido: 'Silva', correo: 'javier@estudiante.edu' },
    { cedula: 'V-20000003', nombre: 'Elena', apellido: 'Rojas', correo: 'elena@estudiante.edu' },
    { cedula: 'V-20000004', nombre: 'Diego', apellido: 'Perez', correo: 'diego@estudiante.edu' },
    { cedula: 'V-29333444', nombre: 'Pedro', apellido: 'Perez', correo: 'pedro@estudiante.edu' },
    { cedula: 'V-30555666', nombre: 'Ana', apellido: 'Lopez', correo: 'ana@estudiante.edu' },
    { cedula: 'V-31777888', nombre: 'Carlos', apellido: 'Rodriguez', correo: 'carlos@estudiante.edu' },
  ];
  for (const a of datosAlum) {
    const usuarioExistente = await prisma.td_usuario_ahbb.findFirst({
      where: { OR: [{ correo_ahbb: a.correo }, { cedula_ahbb: a.cedula }] }
    });
    if (usuarioExistente) {
      await prisma.td_usuario_ahbb.update({
        where: { id_usuario_ahbb: usuarioExistente.id_usuario_ahbb },
        data: { estadoCuenta_ahbb: 'ACTIVO', rol_ahbb: 'ALUMNO' }
      });
    } else {
      await prisma.td_usuario_ahbb.create({
        data: { cedula_ahbb: a.cedula, nombre_ahbb: a.nombre, apellido_ahbb: a.apellido, correo_ahbb: a.correo, contrasena_ahbb: alumHash, rol_ahbb: 'ALUMNO', estadoCuenta_ahbb: 'ACTIVO', requiereCambioContrasena_ahbb: false }
      });
    }
  }

  const profesores = await prisma.td_usuario_ahbb.findMany({ where: { rol_ahbb: 'PROFESOR' }, orderBy: { id_usuario_ahbb: 'asc' } });
  const alumnos = await prisma.td_usuario_ahbb.findMany({ where: { rol_ahbb: 'ALUMNO' }, orderBy: { id_usuario_ahbb: 'asc' } });
  console.log(`✅ Usuarios sembrados: Admin, Control de Estudios, ${profesores.length} Profesores y ${alumnos.length} Alumnos.`);

  // ──────────────────────────────────────────────────────────────────
  // 2. PERÍODOS ACADÉMICOS Y CARRERA PENSUM (_cjgp)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 2. Sembrando Períodos Académicos y Carrera Pensum (_cjgp)...');
  const periodoAnterior = await prisma.td_periodo_academico_cjgp.upsert({
    where: { nombre_cjgp: '2026-I' },
    update: { activo_cjgp: false },
    create: { nombre_cjgp: '2026-I', fechaInicio_cjgp: new Date('2026-01-12'), fechaFin_cjgp: new Date('2026-06-26'), activo_cjgp: false },
  });

  const periodoActivo = await prisma.td_periodo_academico_cjgp.upsert({
    where: { nombre_cjgp: '2026-II' },
    update: { activo_cjgp: true },
    create: { nombre_cjgp: '2026-II', fechaInicio_cjgp: new Date('2026-07-13'), fechaFin_cjgp: new Date('2026-12-11'), activo_cjgp: true },
  });

  let carrera = await prisma.td_carrera_cjgp.findUnique({
    where: { codigo_cjgp: 'INF' },
    include: { materias_cjgp: true },
  });

  if (!carrera) {
    carrera = await prisma.td_carrera_cjgp.create({
      data: {
        codigo_cjgp: 'INF',
        nombre_cjgp: 'Ingeniería en Informática',
        descripcion_cjgp: 'Carrera de demostración del módulo académico: forma profesionales en software, bases de datos y redes.',
        regimen_cjgp: 'SEMESTRAL',
        duracionAnios_cjgp: 3,
        limiteCreditos_cjgp: 21,
      },
      include: { materias_cjgp: true },
    });

    const idPorCodigo = new Map();
    for (const [codigo, nombre, creditos, bloque] of PENSUM_CJGP) {
      const materia = await prisma.td_materia_cjgp.create({
        data: {
          codigo_cjgp: codigo,
          nombre_cjgp: nombre,
          creditos_cjgp: creditos,
          nroBloque_cjgp: bloque,
          id_carrera_materia_cjgp: carrera.id_carrera_cjgp,
        },
      });
      idPorCodigo.set(codigo, materia.id_materia_cjgp);
    }
    for (const [codigo, , , , requisitos] of PENSUM_CJGP) {
      for (const requisito of requisitos) {
        await prisma.td_prelacion_cjgp.create({
          data: {
            id_materia_cjgp: idPorCodigo.get(codigo),
            id_materia_requisito_cjgp: idPorCodigo.get(requisito),
          },
        });
      }
    }
  }

  const materias = await prisma.td_materia_cjgp.findMany({
    where: { id_carrera_materia_cjgp: carrera.id_carrera_cjgp },
    orderBy: { id_materia_cjgp: 'asc' },
  });
  const materiaPorCodigo = new Map(materias.map((m) => [m.codigo_cjgp, m]));

  // Asignar profesores a las materias en round-robin
  if (profesores.length > 0) {
    for (const [indice, materia] of materias.entries()) {
      await prisma.td_materia_cjgp.update({
        where: { id_materia_cjgp: materia.id_materia_cjgp },
        data: { id_profesor_materia_cjgp: profesores[indice % profesores.length].id_usuario_ahbb },
      });
    }
  }
  console.log(`✅ Carrera INF lista con ${materias.length} materias, prelaciones y profesores asignados.`);

  // ──────────────────────────────────────────────────────────────────
  // 3. HISTORIAL E INSCRIPCIONES CON CALIFICACIONES (_cjgp / _jc)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 3. Sembrando Historial e Inscripciones con Calificaciones (_jc)...');
  const maria = alumnos[0];
  for (const [codigo, nota] of [['MAT1', 16], ['PRG1', 17], ['ING1', 14]]) {
    const materia = materiaPorCodigo.get(codigo);
    await prisma.td_inscripcion_materia_cjgp.upsert({
      where: {
        id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
          id_usuario_im_cjgp: maria.id_usuario_ahbb,
          id_materia_im_cjgp: materia.id_materia_cjgp,
          id_periodo_im_cjgp: periodoAnterior.id_periodo_cjgp,
        },
      },
      update: {},
      create: {
        id_usuario_im_cjgp: maria.id_usuario_ahbb,
        id_materia_im_cjgp: materia.id_materia_cjgp,
        id_periodo_im_cjgp: periodoAnterior.id_periodo_cjgp,
        estatus_cjgp: 'APROBADO',
        notaFinal_cjgp: nota,
      },
    });
  }

  // Plan Institucional de Evaluación 2026-II
  let planEval = await prisma.td_plan_evaluacion_jc.findFirst({
    where: { id_periodo_plan_jc: periodoActivo.id_periodo_cjgp, id_carrera_plan_jc: null },
    include: { items_jc: true },
  });

  if (!planEval) {
    planEval = await prisma.td_plan_evaluacion_jc.create({
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
  const itemsEval = planEval.items_jc.sort((a, b) => a.orden_jc - b.orden_jc);

  // Inscripciones 2026-II y Calificaciones
  const materiaMat1 = materiaPorCodigo.get('MAT1');
  const notasDefinitivas = [19.5, 18.0, 13.0, 18.0];
  const notasPorCorte = [
    [19.5, 20.0, 19.0, 19.5],
    [18.0, 17.5, 18.5, 18.0],
    [8.0,  14.0, 12.0, 12.0], // Ana tiene reparacion en corte 1 (8 -> 14)
    [18.0, 18.0, 18.0, 18.0],
  ];

  const inscripcionesMAT1 = [];
  for (let i = 0; i < Math.min(alumnos.length, 4); i++) {
    const alumno = alumnos[i];
    const inscrip = await prisma.td_inscripcion_materia_cjgp.upsert({
      where: {
        id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
          id_usuario_im_cjgp: alumno.id_usuario_ahbb,
          id_materia_im_cjgp: materiaMat1.id_materia_cjgp,
          id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
        },
      },
      update: { estatus_cjgp: 'APROBADO', notaFinal_cjgp: notasDefinitivas[i] },
      create: {
        id_usuario_im_cjgp: alumno.id_usuario_ahbb,
        id_materia_im_cjgp: materiaMat1.id_materia_cjgp,
        id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
        estatus_cjgp: 'APROBADO',
        notaFinal_cjgp: notasDefinitivas[i],
      },
    });
    inscripcionesMAT1.push({ inscripcion: inscrip, alumno, notaFinal: notasDefinitivas[i] });

    for (let c = 0; c < itemsEval.length; c++) {
      const item = itemsEval[c];
      await prisma.td_calificacion_jc.upsert({
        where: {
          id_inscripcion_materia_cal_jc_id_item_cal_jc: {
            id_inscripcion_materia_cal_jc: inscrip.id_inscripcion_materia_cjgp,
            id_item_cal_jc: item.id_item_jc,
          },
        },
        update: { valor_jc: notasPorCorte[i][c] },
        create: {
          id_inscripcion_materia_cal_jc: inscrip.id_inscripcion_materia_cjgp,
          id_item_cal_jc: item.id_item_jc,
          valor_jc: notasPorCorte[i][c],
          cargadoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
        },
      });
    }
  }

  // Registrar Reparación para Ana (Alumno 3)
  if (inscripcionesMAT1.length >= 3) {
    const inscripAna = inscripcionesMAT1[2].inscripcion;
    const corte1 = itemsEval[0];
    await prisma.td_reparacion_jc.upsert({
      where: {
        id_inscripcion_materia_rep_jc_id_item_rep_jc: {
          id_inscripcion_materia_rep_jc: inscripAna.id_inscripcion_materia_cjgp,
          id_item_rep_jc: corte1.id_item_jc,
        },
      },
      update: { valor_jc: 14.0 },
      create: {
        id_inscripcion_materia_rep_jc: inscripAna.id_inscripcion_materia_cjgp,
        id_item_rep_jc: corte1.id_item_jc,
        valor_jc: 14.0,
        observacion_jc: 'Recuperación aprobada en examen sustitutivo de Corte 1',
        registradoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
      },
    });
  }

  // Acta Blanca con SHA-256
  const hashActa = crypto
    .createHash('sha256')
    .update(JSON.stringify({ materia: materiaMat1.codigo_cjgp, periodo: periodoActivo.nombre_cjgp, alumnos: inscripcionesMAT1.map(x => ({ cedula: x.alumno.cedula_ahbb, nota: x.notaFinal })) }))
    .digest('hex');
  const codigoActa = `ACTA-${periodoActivo.nombre_cjgp}-${materiaMat1.codigo_cjgp}-SEED01`;

  await prisma.td_acta_jc.upsert({
    where: { codigo_jc: codigoActa },
    update: { hashVerificacion_jc: hashActa },
    create: {
      codigo_jc: codigoActa,
      tipo_jc: 'BLANCA',
      hashVerificacion_jc: hashActa,
      id_materia_acta_jc: materiaMat1.id_materia_cjgp,
      id_periodo_acta_jc: periodoActivo.id_periodo_cjgp,
      generadaPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
    },
  });

  // Certificados de Sobresaliente
  for (let i = 0; i < 2; i++) {
    const item = inscripcionesMAT1[i];
    const codigoCert = `SOB-${periodoActivo.nombre_cjgp}-${materiaMat1.codigo_cjgp}-${item.alumno.cedula_ahbb}`;
    const hashCert = crypto.createHash('sha256').update(`${codigoCert}|${item.alumno.cedula_ahbb}|${item.notaFinal}`).digest('hex');
    await prisma.td_certificado_sobresaliente_jc.upsert({
      where: { id_inscripcion_materia_cer_jc: item.inscripcion.id_inscripcion_materia_cjgp },
      update: { notaFinal_jc: item.notaFinal, hashVerificacion_jc: hashCert },
      create: {
        codigo_jc: codigoCert,
        notaFinal_jc: item.notaFinal,
        hashVerificacion_jc: hashCert,
        id_inscripcion_materia_cer_jc: item.inscripcion.id_inscripcion_materia_cjgp,
        id_alumno_cer_jc: item.alumno.id_usuario_ahbb,
        emitidoPorUsuarioId_jc: usuarioControl.id_usuario_ahbb,
        anulado_jc: false,
      },
    });
  }

  // Notificaciones y Auditoría
  await prisma.td_notificacion_jc.create({
    data: {
      titulo_jc: '🌟 ¡Felicitaciones! Certificado de Sobresaliente',
      mensaje_jc: `Has obtenido un Certificado de Excelencia Académica en ${materiaMat1.nombre_cjgp} con nota ${inscripcionesMAT1[0].notaFinal} pts.`,
      tipo_jc: 'FELICITACION',
      icono_jc: 'military_tech',
      enlace_jc: '/alumno/certificados',
      leida_jc: false,
      id_usuario_not_jc: inscripcionesMAT1[0].alumno.id_usuario_ahbb,
    },
  });

  await prisma.td_auditoria_jc.create({
    data: {
      modulo_jc: 'CONTROL_ESTUDIOS',
      accion_jc: 'ACTA_CERRADA',
      descripcion_jc: `Cierre del Acta Blanca ${codigoActa} con Hash SHA-256 verificado.`,
      id_usuario_auditoria_jc: usuarioControl.id_usuario_ahbb,
    },
  });
  console.log('✅ Plan de evaluación, notas, reparaciones, acta SHA-256, certificados y auditoría sembrados.');

  // ──────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────
  // 4. PLANIFICACIÓN CURRICULAR (_ga) — Planes de Estudio Publicados
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 4. Sembrando Planificación Curricular y Planes de Estudio (_ga)...');
  let config_ga = await prisma.td_configuraciones_periodo_ga.findFirst({
    where: { id_periodo_ga: periodoActivo.id_periodo_cjgp }
  });
  if (!config_ga) {
    await prisma.td_configuraciones_periodo_ga.create({
      data: { id_periodo_ga: periodoActivo.id_periodo_cjgp, formato_evaluacion_ga: 'CUANTITATIVO', max_evaluaciones_lapso_ga: 4, lapsos_totales_ga: 2 },
    });
  }

  // Lista de materias para sembrar Planes de Estudio Oficiales APROBADOS
  const materiasParaPlanes = [
    {
      codigo: 'MAT1',
      programa: '/uploads/programas/programa-oficial-matematica1.pdf',
      detalles: [
        { lapso: 1, unidad: 'Unidad I: Conjuntos y Funciones Reales', estrategia: 'Clases teóricas participativas y resolución de guías prácticas', recursos: 'Proyector, Guía de ejercicios en PDF y pizarra interactiva', orden: 1 },
        { lapso: 2, unidad: 'Unidad II: Límites, Continuidad y Derivadas', estrategia: 'Talleres prácticos en equipo y laboratorios de cálculo gráfico', recursos: 'Calculadora científica y Software GeoGebra', orden: 1 },
      ],
      actividades: [
        { lapso: 1, nombre: 'Examen Parcial I: Lógica y Conjuntos', tipo: 'EXAMEN', porcentaje: 50, fecha: new Date('2026-08-15'), orden: 1, indicadores: ['Identifica y opera conjuntos numéricos correctamente', 'Resuelve desigualdades absolutas'] },
        { lapso: 1, nombre: 'Taller Grupal: Dominios de Funciones', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-08-30'), orden: 2, indicadores: ['Grafica funciones elementales y compuestas'] },
        { lapso: 2, nombre: 'Examen Parcial II: Cálculo de Límites', tipo: 'EXAMEN', porcentaje: 50, fecha: new Date('2026-09-15'), orden: 1, indicadores: ['Aplica teoremas de límites e indeterminaciones'] },
        { lapso: 2, nombre: 'Proyecto de Aplicación: Derivadas', tipo: 'PROYECTO', porcentaje: 50, fecha: new Date('2026-09-30'), orden: 2, indicadores: ['Modela problemas de optimización matemática'] },
      ],
    },
    {
      codigo: 'PRG1',
      programa: '/uploads/programas/programa-oficial-programacion1.pdf',
      detalles: [
        { lapso: 1, unidad: 'Unidad I: Lógica de Programación y Diagramas', estrategia: 'Demostración de código en directo y ejercicios en pseudocódigo', recursos: 'Entorno VS Code y Pizarra digital', orden: 1 },
        { lapso: 2, unidad: 'Unidad II: Estructuras de Control y Funciones', estrategia: 'Desarrollo colaborativo de programas y revisión de código (Peer Review)', recursos: 'Compilador GCC / Python 3 y GitHub', orden: 1 },
      ],
      actividades: [
        { lapso: 1, nombre: 'Práctica 1: Algoritmos Secuenciales', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-08-18'), orden: 1, indicadores: ['Traduce enunciados lógicos a algoritmos'] },
        { lapso: 1, nombre: 'Examen de Código 1: Condicionales y Búcles', tipo: 'EXAMEN', porcentaje: 50, fecha: new Date('2026-08-28'), orden: 2, indicadores: ['Construye estructuras iterativas optimizadas'] },
        { lapso: 2, nombre: 'Taller de Modularidad: Funciones y Arreglos', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-09-20'), orden: 1, indicadores: ['Subdivide software complejo en funciones puras'] },
        { lapso: 2, nombre: 'Proyecto Integrador: Software de Gestión', tipo: 'PROYECTO', porcentaje: 50, fecha: new Date('2026-10-05'), orden: 2, indicadores: ['Crea una aplicación de consola completa y funcional'] },
      ],
    },
    {
      codigo: 'ING1',
      programa: '/uploads/programas/programa-oficial-ingles1.pdf',
      detalles: [
        { lapso: 1, unidad: 'Unidad I: Vocabulario Técnico e Informático', estrategia: 'Lectura comentada de documentación oficial y glosarios', recursos: 'Artículos de IEEE / ACM y diccionarios técnicos', orden: 1 },
        { lapso: 2, unidad: 'Unidad II: Comprensión Lectora de Manuales', estrategia: 'Traducción técnica inversa y presentaciones orales', recursos: 'Manuales de arquitectura de software', orden: 1 },
      ],
      actividades: [
        { lapso: 1, nombre: 'Glosario Técnico Evaluado', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-08-20'), orden: 1, indicadores: ['Domina terminología de hardware y software'] },
        { lapso: 1, nombre: 'Quiz de Lectura Comprensiva', tipo: 'EXAMEN', porcentaje: 50, fecha: new Date('2026-09-02'), orden: 2, indicadores: ['Extrae ideas principales de textos en inglés'] },
        { lapso: 2, nombre: 'Traducción de Manual de API', tipo: 'TAREA', porcentaje: 50, fecha: new Date('2026-09-22'), orden: 1, indicadores: ['Redacta explicaciones precisas en español'] },
        { lapso: 2, nombre: 'Presentación Oral de Proyecto', tipo: 'EXPOSICION', porcentaje: 50, fecha: new Date('2026-10-08'), orden: 2, indicadores: ['Comunica conceptos tecnológicos en inglés'] },
      ],
    },
    {
      codigo: 'BD1',
      programa: '/uploads/programas/programa-oficial-bd1.pdf',
      detalles: [
        { lapso: 1, unidad: 'Unidad I: Modelo Entidad-Relación y Normalización', estrategia: 'Estudios de caso reales de modelado empresarial', recursos: 'Herramienta dbdiagram.io y MySQL Workbench', orden: 1 },
        { lapso: 2, unidad: 'Unidad II: Lenguaje SQL DDL y DML', estrategia: 'Laboratorios intensivos de consultas relacionales', recursos: 'Servidor PostgreSQL y PgAdmin', orden: 1 },
      ],
      actividades: [
        { lapso: 1, nombre: 'Modelo E-R de Sistema Escolar', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-08-22'), orden: 1, indicadores: ['Diseña diagramas relacionales en 3FN'] },
        { lapso: 1, nombre: 'Parcial I: Álgebra Relacional', tipo: 'EXAMEN', porcentaje: 50, fecha: new Date('2026-09-05'), orden: 2, indicadores: ['Aplica reglas de integridad referencial'] },
        { lapso: 2, nombre: 'Laboratorio de Consultas SQL', tipo: 'TALLER', porcentaje: 50, fecha: new Date('2026-09-25'), orden: 1, indicadores: ['Escribe JOINs y subconsultas eficientes'] },
        { lapso: 2, nombre: 'Proyecto de Base de Datos', tipo: 'PROYECTO', porcentaje: 50, fecha: new Date('2026-10-10'), orden: 2, indicadores: ['Implementa una BD institucional limpia'] },
      ],
    },
  ];

  for (const configPlan of materiasParaPlanes) {
    const materiaObj = materiaPorCodigo.get(configPlan.codigo);
    if (!materiaObj || !materiaObj.id_profesor_materia_cjgp) continue;

    const idMateria = materiaObj.id_materia_cjgp;
    const idProfesor = materiaObj.id_profesor_materia_cjgp;

    await prisma.td_planificaciones_ga.deleteMany({
      where: { id_materia_ga: idMateria, id_periodo_ga: periodoActivo.id_periodo_cjgp },
    });

    const nuevoPlan = await prisma.td_planificaciones_ga.create({
      data: {
        id_materia_ga: idMateria,
        id_periodo_ga: periodoActivo.id_periodo_cjgp,
        id_profesor_ga: idProfesor,
        programaUrl_ga: configPlan.programa,
        formato_evaluacion_ga: 'CUANTITATIVO',
        estado_ga: 'APROBADO',
        codigo_ga: `PLAN-${configPlan.codigo}-PER${periodoActivo.id_periodo_cjgp}`,
        hashVerificacion_ga: crypto.createHash('sha256').update(`PLAN-${configPlan.codigo}`).digest('hex'),
        detallesDidacticos_ga: {
          create: configPlan.detalles.map((d) => ({
            lapso_ga: d.lapso,
            unidad_tematica_ga: d.unidad,
            estrategia_ga: d.estrategia,
            recursos_ga: d.recursos,
            orden_ga: d.orden,
          })),
        },
      },
    });

    for (const act of configPlan.actividades) {
      await prisma.td_actividades_evaluacion_ga.create({
        data: {
          id_planificacion_ga: nuevoPlan.id_planificacion_ga,
          lapso_ga: act.lapso,
          nombre_actividad_ga: act.nombre,
          tipo_evaluacion_ga: act.tipo,
          porcentaje_ga: act.porcentaje,
          fecha_evaluacion_ga: act.fecha,
          orden_ga: act.orden,
          indicadoresLogro_ga: {
            create: act.indicadores.map((ind) => ({ descripcion_ga: ind })),
          },
        },
      });
    }
    console.log(`📌 Plan de Estudio APROBADO sembrado para ${configPlan.codigo} (${materiaObj.nombre_cjgp}).`);
  }

  console.log('✅ Configuración curricular y planes de estudio oficiales (_ga) sembrados correctamente.');

  // ──────────────────────────────────────────────────────────────────
  // 5. MULTIMEDIA Y AULA VIRTUAL ENRIQUECIDA (_jf)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 5. Sembrando Multimedia y Aulas Virtuales Enriquecidas (_jf)...');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'lecciones_jf');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(path.join(uploadsDir, 'video_demo1.mp4'))) {
    fs.writeFileSync(path.join(uploadsDir, 'video_demo1.mp4'), Buffer.alloc(1024 * 1024));
  }
  if (!fs.existsSync(path.join(uploadsDir, 'video_demo2.mp4'))) {
    fs.writeFileSync(path.join(uploadsDir, 'video_demo2.mp4'), Buffer.alloc(1024 * 1024));
  }

  // Cursos Extracurriculares a poblar en el aula virtual
  const cursosExtracurriculares = await prisma.td_curso_ahbb.findMany({ take: 5, orderBy: { id_curso_ahbb: 'asc' } });

  for (const c of cursosExtracurriculares) {
    // Asegurar inscripción de María
    let inscripMaria = await prisma.td_inscripcion_ahbb.findFirst({
      where: { id_curso_inscripcion_ahbb: c.id_curso_ahbb, id_usuario_inscripcion_ahbb: maria.id_usuario_ahbb },
    });
    if (!inscripMaria) {
      inscripMaria = await prisma.td_inscripcion_ahbb.create({
        data: { id_curso_inscripcion_ahbb: c.id_curso_ahbb, id_usuario_inscripcion_ahbb: maria.id_usuario_ahbb, estatus_ahbb: 'INSCRITO' },
      });
    }

    // Limpiar bloques previos
    await prisma.td_bloques_jf.deleteMany({ where: { id_curso_bloque_jf: c.id_curso_ahbb } });
    await prisma.td_salas_videollamadas_jf.deleteMany({ where: { id_curso_sala_jf: c.id_curso_ahbb } });

    // Bloque 1
    const bloque1 = await prisma.td_bloques_jf.create({
      data: {
        id_curso_bloque_jf: c.id_curso_ahbb,
        nombre_jf: `Bloque I: Fundamentos de ${c.nombre_ahbb}`,
        descripcion_jf: `Introducción técnica, normas de seguridad y herramientas especializadas.`,
        orden_jf: 1,
      },
    });

    const lec1 = await prisma.td_lecciones_jf.create({
      data: {
        id_bloque_leccion_jf: bloque1.id_bloque_jf,
        titulo_jf: '1. Introducción y Herramientas del Taller',
        descripcion_jf: 'Revisión paso a paso del instrumental técnico.',
        orden_jf: 1,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4',
      },
    });

    const lec2 = await prisma.td_lecciones_jf.create({
      data: {
        id_bloque_leccion_jf: bloque1.id_bloque_jf,
        titulo_jf: '2. Procedimiento Técnico Guiado',
        descripcion_jf: 'Demostración práctica de aplicación.',
        orden_jf: 2,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo2.mp4',
      },
    });

    await prisma.td_lecciones_jf.create({
      data: {
        id_bloque_leccion_jf: bloque1.id_bloque_jf,
        titulo_jf: '3. Guía Teórica de Seguridad y Buenas Prácticas',
        descripcion_jf: 'Lectura normativa y protocolos de prevención.',
        orden_jf: 3,
        tipo_jf: 'LECTURA',
        contenidoTexto_jf: `En el ámbito de ${c.nombre_ahbb}, el estricto cumplimiento de los estándares de seguridad es obligatorio. Inspeccione su equipo de protección personal antes de iniciar cada sesión.`,
      },
    });

    await prisma.td_evaluaciones_jf.create({
      data: {
        id_bloque_evaluacion_jf: bloque1.id_bloque_jf,
        titulo_jf: `Evaluación del Bloque I: ${c.nombre_ahbb}`,
        notaMinima_jf: 12,
        intentosMaximos_jf: 3,
        preguntasJson_jf: [
          { pregunta: '¿Cuál es el primer paso antes de operar el instrumental?', opciones: ['Inspeccionar EPP y banco de trabajo', 'Encender el equipo sin revisar', 'No requiere preparación'], respuestaCorrecta: 0 },
          { pregunta: '¿Qué norma rige el control de calidad en el taller?', opciones: ['Protocolo técnico de la norma ISO', 'Criterio arbitrario', 'Ninguno'], respuestaCorrecta: 0 },
        ],
      },
    });

    // Bloque 2
    const bloque2 = await prisma.td_bloques_jf.create({
      data: {
        id_curso_bloque_jf: c.id_curso_ahbb,
        nombre_jf: `Bloque II: Técnicas Avanzadas y Aplicación Práctica`,
        descripcion_jf: 'Procesos de alta precisión y acabado profesional.',
        orden_jf: 2,
      },
    });

    await prisma.td_lecciones_jf.create({
      data: {
        id_bloque_leccion_jf: bloque2.id_bloque_jf,
        titulo_jf: '4. Calibración y Ajustes de Precisión',
        descripcion_jf: 'Ajustes finos y optimización de rendimiento.',
        orden_jf: 1,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4',
      },
    });

    // Progreso de María
    await prisma.td_progreso_lecciones_jf.create({
      data: { id_inscripcion_progreso_jf: inscripMaria.id_inscripcion_ahbb, id_leccion_progreso_jf: lec1.id_leccion_jf, id_usuario_alumno_jf: maria.id_usuario_ahbb, completada_jf: true, porcentajeVisto_jf: 100 },
    });
    await prisma.td_progreso_lecciones_jf.create({
      data: { id_inscripcion_progreso_jf: inscripMaria.id_inscripcion_ahbb, id_leccion_progreso_jf: lec2.id_leccion_jf, id_usuario_alumno_jf: maria.id_usuario_ahbb, completada_jf: false, porcentajeVisto_jf: 75 },
    });

    // Salas de videollamada
    await prisma.td_salas_videollamadas_jf.create({
      data: {
        id_curso_sala_jf: c.id_curso_ahbb,
        id_usuario_creador_jf: c.id_usuario_curso_ahbb || profesores[0].id_usuario_ahbb,
        nombreSala_jf: `Sala_Vivo_${c.id_curso_ahbb}_${Date.now()}`,
        titulo_jf: `Taller en Vivo: Consultas y Práctica de ${c.nombre_ahbb}`,
        estado_jf: 'PROGRAMADA',
        fechaProgramada_jf: new Date(Date.now() + 86400000),
      },
    });
  }

  console.log(`✅ Aulas virtuales de ${cursosExtracurriculares.length} cursos pobladas con lecciones, quizes, progreso y videollamadas.`);

  // ──────────────────────────────────────────────────────────────────
  // 6. PAGOS Y NÓMINA (_ap)
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 6. Sembrando Pagos, Tarifas y Nómina (_ap)...');
  const tarifaPeriodo = await prisma.td_tarifa_ap.create({
    data: { concepto_ap: 'PERIODO', monto_ap: 150.00, descripcion_ap: 'Arancel de Inscripción del Período Académico 2026-II', activa_ap: true },
  });

  const tarifaMensualidad = await prisma.td_tarifa_ap.create({
    data: { concepto_ap: 'Mensualidad', monto_ap: 40.00, descripcion_ap: 'Mensualidad regular', activa_ap: true },
  });

  // Pago CONFIRMADO para María (Solvente)
  const pagoMaria = await prisma.td_pago_ap.create({
    data: {
      id_usuario_ap: maria.id_usuario_ahbb,
      id_periodo_ap: periodoActivo.id_periodo_cjgp,
      id_tarifa_ap: tarifaPeriodo.id_tarifa_ap,
      concepto_ap: 'PERIODO',
      monto_ap: 150.00,
      referencia_ap: 'PM-9988776655',
      estado_ap: 'CONFIRMADO',
      confirmadoEn_ap: new Date(),
    },
  });

  await prisma.td_recibo_pago_ap.create({
    data: {
      id_pago_ap: pagoMaria.id_pago_ap,
      codigo_ap: `REC-PM-MARIA-${pagoMaria.id_pago_ap}`,
      hashVerificacion_ap: crypto.createHash('sha256').update(`REC-${pagoMaria.id_pago_ap}`).digest('hex'),
    },
  });

  // Pago PENDIENTE para Pedro (Moroso)
  if (alumnos.length > 1) {
    await prisma.td_pago_ap.create({
      data: {
        id_usuario_ap: alumnos[1].id_usuario_ahbb,
        id_periodo_ap: periodoActivo.id_periodo_cjgp,
        id_tarifa_ap: tarifaPeriodo.id_tarifa_ap,
        concepto_ap: 'PERIODO',
        monto_ap: 150.00,
        referencia_ap: 'PM-1122334455',
        estado_ap: 'PENDIENTE',
      },
    });
  }

  // Contratos de Profesores
  for (const [idx, prof] of profesores.entries()) {
    const contrato = await prisma.td_contrato_profesor_ap.upsert({
      where: { id_profesor_ap: prof.id_usuario_ahbb },
      update: {},
      create: {
        id_profesor_ap: prof.id_usuario_ahbb,
        tipo_ap: idx % 2 === 0 ? 'FIJO' : 'POR_HORA',
        monto_ap: idx % 2 === 0 ? 1200.00 : 25.00,
        activo_ap: true,
      },
    });

    if (idx === 0) {
      await prisma.td_nomina_ap.upsert({
        where: { id_contrato_ap_id_periodo_ap: { id_contrato_ap: contrato.id_contrato_ap, id_periodo_ap: periodoActivo.id_periodo_cjgp } },
        update: {},
        create: {
          id_contrato_ap: contrato.id_contrato_ap,
          id_periodo_ap: periodoActivo.id_periodo_cjgp,
          horas_ap: 40,
          monto_calculado_ap: 1200.00,
          estado_ap: 'SIMULADO',
        },
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────
  // 7. CATÁLOGO DE LA TIENDA DE PRODUCTOS
  // ──────────────────────────────────────────────────────────────────
  console.log('\n📌 7. Sembrando Catálogo de la Tienda de Productos...');
  const totalProductos = await prisma.td_producto_ahbb.count();
  if (totalProductos === 0) {
    await prisma.td_producto_ahbb.createMany({
      data: [
        { nombre_ahbb: 'Sueter Azul H&B', descripcion_ahbb: 'Sueter cómodo, ideal para el frío en los pasillos de la academia. Color Azul Oficial H&B.', precio_ahbb: 25, stock_ahbb: 50, categoria_ahbb: 'ropa', imagen_ahbb: '/img/SueterH&B_Azul.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Sueter Rojo H&B', descripcion_ahbb: 'Sueter cómodo, ideal para el frío en los pasillos de la academia. Color Rojo H&B.', precio_ahbb: 25, stock_ahbb: 45, categoria_ahbb: 'ropa', imagen_ahbb: '/img/SueterH&B_Rojo.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Sueter Mostaza H&B', descripcion_ahbb: 'Sueter cómodo estilo urbano. Color Mostaza.', precio_ahbb: 25, stock_ahbb: 30, categoria_ahbb: 'ropa', imagen_ahbb: '/img/SueterH&B_mostaza.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Franela Azul H&B', descripcion_ahbb: 'Franela fresca 100% algodón. Color Azul Oficial H&B.', precio_ahbb: 15, stock_ahbb: 100, categoria_ahbb: 'ropa', imagen_ahbb: '/img/franelaH&B_Azul.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Franela Roja H&B', descripcion_ahbb: 'Franela fresca 100% algodón. Color Rojo Vibrante.', precio_ahbb: 15, stock_ahbb: 100, categoria_ahbb: 'ropa', imagen_ahbb: '/img/franelaH&B_Rojo.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Franela Mostaza H&B', descripcion_ahbb: 'Franela fresca 100% algodón. Color Mostaza.', precio_ahbb: 15, stock_ahbb: 100, categoria_ahbb: 'ropa', imagen_ahbb: '/img/franelaH&B_mostaza.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Lapicero H&B Azul', descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Azul.', precio_ahbb: 2.5, stock_ahbb: 300, categoria_ahbb: 'papeleria', imagen_ahbb: '/img/lapiceroH&B_Azul.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Lapicero H&B Rojo', descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Rojo.', precio_ahbb: 2.5, stock_ahbb: 300, categoria_ahbb: 'papeleria', imagen_ahbb: '/img/lapiceroH&B_Rojo.jpg', estado_producto_ahbb: 'activo' },
        { nombre_ahbb: 'Lapicero H&B Mostaza', descripcion_ahbb: 'Bolígrafo oficial de la Academia H&B. Cuerpo Mostaza.', precio_ahbb: 2.5, stock_ahbb: 300, categoria_ahbb: 'papeleria', imagen_ahbb: '/img/lapiceroH&B_mostaza.jpg', estado_producto_ahbb: 'activo' },
      ],
    });
    console.log('✅ Catálogo de la tienda poblado con 9 productos.');
  } else {
    console.log('✅ Catálogo de la tienda ya contiene productos.');
  }

  console.log('✅ Tarifas, pagos confirmados/pendientes, recibos SHA-256 y contratos de nómina sembrados.');

  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(' ✨ SIEMBRA DE DATOS COMPLETADA CON ÉXITO');
  console.log('════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra unificada:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
