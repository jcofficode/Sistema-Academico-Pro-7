/**
 * seed-academico_cjgp.cjs — Datos de demostración del módulo académico.
 *
 * Crea un escenario realista para presentar las Épicas 1-3 (_cjgp) y el
 * módulo de Control de Estudios (_jc):
 *   - Períodos 2026-I (cerrado) y 2026-II (activo).
 *   - Carrera "Ingeniería en Informática" (semestral, 3 años, 6 bloques)
 *     con 12 materias y su cadena de prelaciones.
 *   - Plan de Evaluación Institucional 2026-II (4 cortes de 25% + Reparación).
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
  console.log('MODO RESET: limpiando datos del módulo académico (_cjgp/_jc)...');
  await prisma.td_acta_jc.deleteMany();
  await prisma.td_calificacion_jc.deleteMany();
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
            { nombre_jc: 'Reparación', orden_jc: 5, peso_jc: 0, esRecuperacion_jc: true },
          ],
        },
      },
      include: { items_jc: true },
    });
    console.log('Plan Institucional 2026-II publicado (4 cortes de 25% + Reparación).');
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
  const itemsRegulares = plan.items_jc
    .filter((item) => !item.esRecuperacion_jc)
    .sort((a, b) => a.orden_jc - b.orden_jc);

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

      // Solo los dos primeros cortes tienen nota: el docente carga el resto
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
