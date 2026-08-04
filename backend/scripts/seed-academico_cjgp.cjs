/**
 * seed-academico_cjgp.cjs — Datos de demostración del módulo académico.
 *
 * Crea un escenario realista para presentar las Épicas 1-3 (_cjgp) y el
 * módulo de Control de Estudios (_jc):
 *   - Períodos 2026-I (cerrado) y 2026-II (activo).
 *   - Carrera "Ingeniería en Informática" (semestral, 3 años, 6 bloques)
 *     con 12 materias y su cadena de prelaciones.
 *   - Plan de Evaluación Institucional 2026-II (4 cortes de 25%).
 *   - Historial aprobado del bloque 1 para la alumna María (desbloquea bloque 2).
 *   - Inscripciones vigentes con notas parciales para probar la carga de notas.
 *
 * Uso:
 *   npm run seed:academico    → siembra sobre lo existente (no borra nada)
 *   npm run reset:academico   → BORRA todos los datos del módulo académico
 *                               (_cjgp/_jc) y siembra el escenario limpio de
 *                               la ruta de prueba. No toca usuarios, cursos
 *                               extracurriculares, tienda ni certificados.
 */
require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MODO_RESET = process.argv.includes('--reset');

/**
 * Limpia SOLO las tablas del módulo académico, en orden seguro de FKs.
 * Así la ruta de prueba del READMEEXPLICACION siempre parte del mismo estado.
 */
async function limpiarModuloAcademico() {
  console.log('MODO RESET: limpiando datos del módulo académico (_cjgp/_jc/_ga/_ap)...');
  await prisma.td_recibo_pago_ap.deleteMany();
  await prisma.td_nomina_ap.deleteMany();
  await prisma.td_contrato_profesor_ap.deleteMany();
  await prisma.td_pago_ap.deleteMany();
  await prisma.td_tarifa_ap.deleteMany();
  await prisma.td_indicadores_logro_ga.deleteMany();
  await prisma.td_actividades_evaluacion_ga.deleteMany();
  await prisma.td_detalles_didacticos_ga.deleteMany();
  await prisma.td_revisiones_plan_ga.deleteMany();
  await prisma.td_planificaciones_ga.deleteMany();
  await prisma.td_configuraciones_periodo_ga.deleteMany();
  await prisma.td_acta_jc.deleteMany();
  await prisma.td_calificacion_jc.deleteMany();
  await prisma.td_certificado_sobresaliente_jc.deleteMany();
  await prisma.td_notificacion_jc.deleteMany();
  await prisma.td_auditoria_jc.deleteMany();
  await prisma.td_reparacion_jc.deleteMany();
  await prisma.td_plan_evaluacion_jc.deleteMany(); // cascada: ítems
  await prisma.td_inscripcion_materia_cjgp.deleteMany();
  await prisma.td_prelacion_cjgp.deleteMany();
  await prisma.td_materia_cjgp.deleteMany();
  await prisma.td_carrera_cjgp.deleteMany();
  await prisma.td_periodo_academico_cjgp.deleteMany();
  console.log('Módulo académico limpio (usuarios, cursos y tienda intactos).');
}

// Pensum de demostración: [codigo, nombre, creditos, bloque, prelaciones]
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
  if (MODO_RESET) {
    await limpiarModuloAcademico();
  }
  console.log('Sembrando datos académicos de demostración (_cjgp / _jc)...');

  // ── Usuario del rol Control de Estudios ─────────────────────────
  // Se crea aquí (además del bootstrap) para que las bases de datos ya
  // existentes también dispongan de la cuenta operativa del módulo _jc.
  const bcrypt = require('bcrypt');
  const usuarioControl = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'control@academiah-b.edu' },
    update: { rol_ahbb: 'CONTROL_ESTUDIOS', estadoCuenta_ahbb: 'ACTIVO' },
    create: {
      cedula_ahbb: 'V-10000005',
      nombre_ahbb: 'Sofia',
      apellido_ahbb: 'Rangel',
      correo_ahbb: 'control@academiah-b.edu',
      contrasena_ahbb: await bcrypt.hash('control123', 10),
      rol_ahbb: 'CONTROL_ESTUDIOS',
      estadoCuenta_ahbb: 'ACTIVO',
    },
  });
  console.log(
    `Cuenta de Control de Estudios lista: ${usuarioControl.correo_ahbb} / control123`,
  );

  // ── Períodos académicos ─────────────────────────────────────────
  const periodoAnterior = await prisma.td_periodo_academico_cjgp.upsert({
    where: { nombre_cjgp: '2026-I' },
    update: {},
    create: {
      nombre_cjgp: '2026-I',
      fechaInicio_cjgp: new Date('2026-01-12'),
      fechaFin_cjgp: new Date('2026-06-26'),
      activo_cjgp: false,
    },
  });

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
  console.log('Períodos listos: 2026-I (cerrado) y 2026-II (activo).');

  // ── Carrera con pensum y prelaciones ────────────────────────────
  let carrera = await prisma.td_carrera_cjgp.findUnique({
    where: { codigo_cjgp: 'INF' },
    include: { materias_cjgp: true },
  });

  if (!carrera) {
    carrera = await prisma.td_carrera_cjgp.create({
      data: {
        codigo_cjgp: 'INF',
        nombre_cjgp: 'Ingeniería en Informática',
        descripcion_cjgp:
          'Carrera de demostración del módulo académico: forma profesionales en desarrollo de software, bases de datos y redes.',
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
    console.log('Carrera INF creada con 12 materias y sus prelaciones.');
  } else {
    console.log('Carrera INF ya existía; se reutiliza.');
  }

  const materias = await prisma.td_materia_cjgp.findMany({
    where: { id_carrera_materia_cjgp: carrera.id_carrera_cjgp },
    orderBy: { id_materia_cjgp: 'asc' }, // round-robin determinista (orden del pensum)
  });
  const materiaPorCodigo = new Map(
    materias.map((materia) => [materia.codigo_cjgp, materia]),
  );

  // ── Asignar profesores a las materias (round-robin entre los demo) ──
  const profesores = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'PROFESOR' },
    orderBy: { id_usuario_ahbb: 'asc' },
  });
  if (profesores.length > 0) {
    const sinProfesor = materias.filter((m) => !m.id_profesor_materia_cjgp);
    for (const [indice, materia] of sinProfesor.entries()) {
      await prisma.td_materia_cjgp.update({
        where: { id_materia_cjgp: materia.id_materia_cjgp },
        data: {
          id_profesor_materia_cjgp:
            profesores[indice % profesores.length].id_usuario_ahbb,
        },
      });
    }
    if (sinProfesor.length > 0) {
      console.log(
        `Profesores asignados a ${sinProfesor.length} materia(s) de INF (round-robin entre ${profesores.length} profesores).`,
      );
    }
  }

  // ── Plan de Evaluación Institucional 2026-II (metadatos _jc) ────
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
        nombre_jc: 'Plan Institucional 2026-II',
        id_periodo_plan_jc: periodoActivo.id_periodo_cjgp,
        notaMaxima_jc: 20,
        notaAprobatoria_jc: 10,
        estado_jc: 'PUBLICADO',
        items_jc: {
          create: [
            { nombre_jc: 'Corte 1', orden_jc: 1, peso_jc: 25 },
            { nombre_jc: 'Corte 2', orden_jc: 2, peso_jc: 25 },
            { nombre_jc: 'Corte 3', orden_jc: 3, peso_jc: 25 },
            { nombre_jc: 'Corte 4', orden_jc: 4, peso_jc: 25 },
          ],
        },
      },
      include: { items_jc: true },
    });
    // Las reparaciones ya no forman parte del plan: se registran por corte
    // durante la carga de notas (ver ReparacionesService_jc).
    console.log('Plan Institucional 2026-II publicado (4 cortes de 25%).');
  }

  // ── Alumnos de demostración ─────────────────────────────────────
  const alumnos = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'ALUMNO' },
    orderBy: { id_usuario_ahbb: 'asc' },
    take: 4,
  });
  if (alumnos.length === 0) {
    console.log('No hay alumnos registrados; ejecuta primero el backend para el bootstrap.');
    return;
  }
  const [maria, ...restoAlumnos] = alumnos;

  // ── Historial 2026-I: María aprobó el bloque 1 completo ─────────
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
  console.log(
    `Historial 2026-I: ${maria.nombre_ahbb} aprobó el bloque 1 (desbloquea MAT2/PRG2/ING2 en la vitrina).`,
  );

  // ── Inscripciones 2026-II con notas parciales (Corte 1 y 2) ─────
  const itemsRegulares = [...plan.items_jc].sort((a, b) => a.orden_jc - b.orden_jc);

  const notaAleatoria = () => Math.round((8 + Math.random() * 11) * 100) / 100;

  for (const alumno of restoAlumnos) {
    for (const codigo of ['MAT1', 'PRG1']) {
      const materia = materiaPorCodigo.get(codigo);
      const inscripcion = await prisma.td_inscripcion_materia_cjgp.upsert({
        where: {
          id_usuario_im_cjgp_id_materia_im_cjgp_id_periodo_im_cjgp: {
            id_usuario_im_cjgp: alumno.id_usuario_ahbb,
            id_materia_im_cjgp: materia.id_materia_cjgp,
            id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
          },
        },
        update: {},
        create: {
          id_usuario_im_cjgp: alumno.id_usuario_ahbb,
          id_materia_im_cjgp: materia.id_materia_cjgp,
          id_periodo_im_cjgp: periodoActivo.id_periodo_cjgp,
        },
      });

      for (const item of itemsRegulares.slice(0, 2)) {
        await prisma.td_calificacion_jc.upsert({
          where: {
            id_inscripcion_materia_cal_jc_id_item_cal_jc: {
              id_inscripcion_materia_cal_jc: inscripcion.id_inscripcion_materia_cjgp,
              id_item_cal_jc: item.id_item_jc,
            },
          },
          update: {},
          create: {
            id_inscripcion_materia_cal_jc: inscripcion.id_inscripcion_materia_cjgp,
            id_item_cal_jc: item.id_item_jc,
            valor_jc: notaAleatoria(),
          },
        });
      }
    }
  }
  console.log(
    `Inscripciones 2026-II: ${restoAlumnos.length} alumnos en MAT1 y PRG1 con notas de Corte 1 y 2.`,
  );

  // ── Módulo de Plan de Estudio / Planificación (_ga): Cronograma y Plan ────
  console.log('Sembrando Configuración Curricular y Planificación de ejemplo (_ga)...');
  
  // 1. Crear configuración de período para 2026-II
  let config_ga = await prisma.td_configuraciones_periodo_ga.findFirst({
    where: { id_periodo_ga: periodoActivo.id_periodo_cjgp }
  });

  if (!config_ga) {
    config_ga = await prisma.td_configuraciones_periodo_ga.create({
      data: {
        id_periodo_ga: periodoActivo.id_periodo_cjgp,
        formato_evaluacion_ga: 'CUANTITATIVO',
        max_evaluaciones_lapso_ga: 4,
        lapsos_totales_ga: 2,
      }
    });
    console.log('Configuración Curricular creada para 2026-II.');
  }

  // 2. Crear una planificación ENTREGADA para MAT1
  const materiaMat1 = await prisma.td_materia_cjgp.findFirst({ where: { codigo_cjgp: 'MAT1' } });
  if (materiaMat1 && materiaMat1.id_profesor_materia_cjgp) {
    const existePlan = await prisma.td_planificaciones_ga.findFirst({
      where: { id_materia_ga: materiaMat1.id_materia_cjgp, id_periodo_ga: periodoActivo.id_periodo_cjgp }
    });

    if (!existePlan) {
      const planMateria = await prisma.td_planificaciones_ga.create({
        data: {
          id_materia_ga: materiaMat1.id_materia_cjgp,
          id_periodo_ga: periodoActivo.id_periodo_cjgp,
          id_profesor_ga: materiaMat1.id_profesor_materia_cjgp,
          programaUrl_ga: '/uploads/programas/programa-oficial-matematica1.pdf',
          formato_evaluacion_ga: 'CUANTITATIVO',
          estado_ga: 'ENTREGADO',
          codigo_ga: `PLAN-MAT${materiaMat1.id_materia_cjgp}-PER${periodoActivo.id_periodo_cjgp}`,
          hashVerificacion_ga: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
          detallesDidacticos_ga: {
            create: [
              { lapso_ga: 1, unidad_tematica_ga: 'Unidad I: Conjuntos y Funciones', estrategia_ga: 'Clases teóricas y resolución de guías', recursos_ga: 'Proyector y Guía PDF', orden_ga: 1 },
              { lapso_ga: 2, unidad_tematica_ga: 'Unidad II: Límites y Continuidad', estrategia_ga: 'Talleres en grupo y laboratorios', recursos_ga: 'Pizarrón interactivo', orden_ga: 1 }
            ]
          },
          actividadesEvaluacion_ga: {
            create: [
              { lapso_ga: 1, nombre_actividad_ga: 'Examen Parcial I', tipo_evaluacion_ga: 'EXAMEN', porcentaje_ga: 50, fecha_evaluacion_ga: new Date('2026-08-15'), orden_ga: 1 },
              { lapso_ga: 1, nombre_actividad_ga: 'Taller de Funciones', tipo_evaluacion_ga: 'TALLER', porcentaje_ga: 50, fecha_evaluacion_ga: new Date('2026-08-30'), orden_ga: 2 },
              { lapso_ga: 2, nombre_actividad_ga: 'Examen Parcial II', tipo_evaluacion_ga: 'EXAMEN', porcentaje_ga: 50, fecha_evaluacion_ga: new Date('2026-09-15'), orden_ga: 1 },
              { lapso_ga: 2, nombre_actividad_ga: 'Proyecto de Cálculo', tipo_evaluacion_ga: 'PROYECTO', porcentaje_ga: 50, fecha_evaluacion_ga: new Date('2026-09-30'), orden_ga: 2 }
            ]
          }
        }
      });

      console.log('Plan de estudio para MAT1 creado y ENTREGADO (esperando revisión).');
    }
  }
  // 3. Crear un plan de estudio en BORRADOR para PRG1
  const materiaPrg1 = await prisma.td_materia_cjgp.findFirst({ where: { codigo_cjgp: 'PRG1' } });
  if (materiaPrg1 && materiaPrg1.id_profesor_materia_cjgp) {
    const existePlanPrg1 = await prisma.td_planificaciones_ga.findFirst({
      where: { id_materia_ga: materiaPrg1.id_materia_cjgp, id_periodo_ga: periodoActivo.id_periodo_cjgp }
    });

    if (!existePlanPrg1) {
      await prisma.td_planificaciones_ga.create({
        data: {
          id_materia_ga: materiaPrg1.id_materia_cjgp,
          id_periodo_ga: periodoActivo.id_periodo_cjgp,
          id_profesor_ga: materiaPrg1.id_profesor_materia_cjgp,
          programaUrl_ga: '/uploads/programas/programa-oficial-programacion1.pdf',
          formato_evaluacion_ga: 'CUANTITATIVO',
          estado_ga: 'BORRADOR',
          codigo_ga: `PLAN-MAT${materiaPrg1.id_materia_cjgp}-PER${periodoActivo.id_periodo_cjgp}`,
          hashVerificacion_ga: 'b2c3d4e5f67890123456789012345678901234567890123456789012345678a1',
        }
      });
      console.log('Plan de estudio para PRG1 creado en BORRADOR.');
    }
  }

  // ── Módulo de Pagos y Nómina (_ap): Tarifas, Pagos, Contratos ────
  console.log('Sembrando datos del módulo de Pagos (_ap)...');

  // 1. Crear Tarifas
  const tarifaMatricula = await prisma.td_tarifa_ap.create({
    data: { concepto_ap: 'Matrícula', monto_ap: 50.00, descripcion_ap: 'Matrícula inicial del período' }
  });
  const tarifaMensualidad = await prisma.td_tarifa_ap.create({
    data: { concepto_ap: 'Mensualidad', monto_ap: 40.00, descripcion_ap: 'Mensualidad regular' }
  });

  // 2. Crear Pagos para alumnos
  if (alumnos.length > 0) {
    for (const alumno of alumnos) {
      // Un pago aprobado
      await prisma.td_pago_ap.create({
        data: {
          id_usuario_ap: alumno.id_usuario_ahbb,
          id_periodo_ap: periodoActivo.id_periodo_cjgp,
          id_tarifa_ap: tarifaMatricula.id_tarifa_ap,
          concepto_ap: 'Matrícula',
          monto_ap: 50.00,
          referencia_ap: 'REF' + Math.floor(Math.random() * 1000000),
          estado_ap: 'APROBADO',
          observacion_ap: 'Pago validado automáticamente'
        }
      });
      // Un pago pendiente
      await prisma.td_pago_ap.create({
        data: {
          id_usuario_ap: alumno.id_usuario_ahbb,
          id_periodo_ap: periodoActivo.id_periodo_cjgp,
          id_tarifa_ap: tarifaMensualidad.id_tarifa_ap,
          concepto_ap: 'Mensualidad',
          monto_ap: 40.00,
          referencia_ap: 'REF' + Math.floor(Math.random() * 1000000),
          estado_ap: 'PENDIENTE',
        }
      });
    }
    console.log(`Pagos creados para ${alumnos.length} alumnos.`);
  }

  // 3. Crear Contratos para profesores
  if (profesores.length > 0) {
    for (const profesor of profesores) {
      await prisma.td_contrato_profesor_ap.upsert({
        where: { id_profesor_ap: profesor.id_usuario_ahbb },
        update: {},
        create: {
          id_profesor_ap: profesor.id_usuario_ahbb,
          tipo_ap: 'FIJO',
          monto_ap: 500.00,
        }
      });
    }
    console.log(`Contratos creados para ${profesores.length} profesores.`);

    // 4. Crear una nómina simulada para el primer profesor
    const contratoProf1 = await prisma.td_contrato_profesor_ap.findFirst({
      where: { id_profesor_ap: profesores[0].id_usuario_ahbb }
    });
    if (contratoProf1) {
      await prisma.td_nomina_ap.upsert({
        where: { id_contrato_ap_id_periodo_ap: { id_contrato_ap: contratoProf1.id_contrato_ap, id_periodo_ap: periodoActivo.id_periodo_cjgp } },
        update: {},
        create: {
          id_contrato_ap: contratoProf1.id_contrato_ap,
          id_periodo_ap: periodoActivo.id_periodo_cjgp,
          horas_ap: 40,
          monto_calculado_ap: 500.00,
          estado_ap: 'SIMULADO'
        }
      });
      console.log('Nómina simulada creada para un profesor.');
    }
  }
  console.log('Seed académico completado.');
}

main()
  .catch((error) => {
    console.error('Error en el seed académico:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
