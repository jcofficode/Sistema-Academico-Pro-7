/**
 * seed-pagos_ap.cjs — Datos de demostración para el módulo de pagos.
 *
 * Configura:
 *   - Tarifas de período (Bs. 150) y curso (Bs. 50).
 *   - Alumna María solvente (pago CONFIRMADO para 2026-II).
 *   - Alumno moroso con pago PENDIENTE.
 *   - Contratos para 3 profesores (FIJO y POR_HORA).
 *   - Simulación de nómina para el período activo.
 *
 * Uso:
 *   npm run seed:pagos
 *   npm run reset:pagos   → Limpia todas las tablas de pagos (_ap) antes de sembrar.
 */
require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MODO_RESET = process.argv.includes('--reset');

async function limpiarModuloPagos() {
  console.log('MODO RESET: limpiando datos del módulo de pagos (_ap)...');
  await prisma.td_recibo_pago_ap.deleteMany();
  await prisma.td_nomina_ap.deleteMany();
  await prisma.td_contrato_profesor_ap.deleteMany();
  await prisma.td_pago_ap.deleteMany();
  await prisma.td_tarifa_ap.deleteMany();
  console.log('Módulo de pagos limpio.');
}

async function main() {
  if (MODO_RESET) {
    await limpiarModuloPagos();
  }

  console.log('Sembrando datos de demostración de pagos (_ap)...');

  // 1. Obtener período académico activo (2026-II)
  const periodoActivo = await prisma.td_periodo_academico_cjgp.findFirst({
    where: { activo_cjgp: true },
  });
  if (!periodoActivo) {
    console.warn('⚠️ No se encontró un período académico activo. Ejecuta primero "npm run seed:academico".');
    return;
  }

  // 2. Crear Tarifas
  const tarifaPeriodo = await prisma.td_tarifa_ap.create({
    data: {
      concepto_ap: 'PERIODO',
      monto_ap: 150.00,
      descripcion_ap: `Arancel de Inscripción del Período Académico ${periodoActivo.nombre_cjgp}`,
      activa_ap: true,
    },
  });

  const tarifaCurso = await prisma.td_tarifa_ap.create({
    data: {
      concepto_ap: 'CURSO',
      monto_ap: 50.00,
      descripcion_ap: 'Arancel Genérico de Curso Extracurricular',
      activa_ap: true,
    },
  });

  console.log('Tarifas creadas correctamente.');

  // 3. Obtener alumnos
  const alumnos = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'ALUMNO' },
    orderBy: { id_usuario_ahbb: 'asc' },
    take: 3,
  });

  if (alumnos.length === 0) {
    console.warn('⚠️ No hay alumnos en la base de datos para sembrar pagos.');
  } else {
    // Alumna 1 (María): Solvente con pago CONFIRMADO
    const maria = alumnos[0];
    const pagoMaria = await prisma.td_pago_ap.create({
      data: {
        id_usuario_ap: maria.id_usuario_ahbb,
        id_periodo_ap: periodoActivo.id_periodo_cjgp,
        id_tarifa_ap: tarifaPeriodo.id_tarifa_ap,
        concepto_ap: 'PERIODO',
        monto_ap: tarifaPeriodo.monto_ap,
        referencia_ap: 'PM-9988776655',
        estado_ap: 'CONFIRMADO',
        confirmadoEn_ap: new Date(),
      },
    });

    // Generar recibo de pago para María
    await prisma.td_recibo_pago_ap.create({
      data: {
        id_pago_ap: pagoMaria.id_pago_ap,
        codigo_ap: `REC-PM-MARIA-${pagoMaria.id_pago_ap}`,
        hashVerificacion_ap: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // dummy sha256
      },
    });

    console.log(`Pago CONFIRMADO creado para ${maria.nombre_ahbb} (solvente).`);

    // Alumno 2: Pago PENDIENTE (moroso)
    if (alumnos.length > 1) {
      const alumnoMoroso = alumnos[1];
      await prisma.td_pago_ap.create({
        data: {
          id_usuario_ap: alumnoMoroso.id_usuario_ahbb,
          id_periodo_ap: periodoActivo.id_periodo_cjgp,
          id_tarifa_ap: tarifaPeriodo.id_tarifa_ap,
          concepto_ap: 'PERIODO',
          monto_ap: tarifaPeriodo.monto_ap,
          referencia_ap: 'PM-1122334455',
          estado_ap: 'PENDIENTE',
        },
      });
      console.log(`Pago PENDIENTE creado para ${alumnoMoroso.nombre_ahbb} (moroso).`);
    }

    // Alumno 3: Sin registros de pago (moroso total)
    if (alumnos.length > 2) {
      console.log(`Alumno ${alumnos[2].nombre_ahbb} sin pagos creados (moroso).`);
    }
  }

  // 4. Crear Contratos de Profesores
  const profesores = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'PROFESOR' },
    orderBy: { id_usuario_ahbb: 'asc' },
    take: 3,
  });

  if (profesores.length === 0) {
    console.warn('⚠️ No hay profesores en la base de datos para sembrar contratos.');
  } else {
    // Profesor 1: FIJO
    const p1 = profesores[0];
    const c1 = await prisma.td_contrato_profesor_ap.create({
      data: {
        id_profesor_ap: p1.id_usuario_ahbb,
        tipo_ap: 'FIJO',
        monto_ap: 1200.00,
        activo_ap: true,
      },
    });
    console.log(`Contrato FIJO de Bs. 1200 creado para el Prof. ${p1.nombre_ahbb}.`);

    // Profesor 2: POR_HORA
    if (profesores.length > 1) {
      const p2 = profesores[1];
      const c2 = await prisma.td_contrato_profesor_ap.create({
        data: {
          id_profesor_ap: p2.id_usuario_ahbb,
          tipo_ap: 'POR_HORA',
          monto_ap: 25.00,
          activo_ap: true,
        },
      });
      console.log(`Contrato POR_HORA de Bs. 25/h creado para el Prof. ${p2.nombre_ahbb}.`);
    }

    // Profesor 3: FIJO
    if (profesores.length > 2) {
      const p3 = profesores[2];
      const c3 = await prisma.td_contrato_profesor_ap.create({
        data: {
          id_profesor_ap: p3.id_usuario_ahbb,
          tipo_ap: 'FIJO',
          monto_ap: 1500.00,
          activo_ap: true,
        },
      });
      console.log(`Contrato FIJO de Bs. 1500 creado para el Prof. ${p3.nombre_ahbb}.`);
    }
  }

  console.log('Seed de pagos completado.');
}

main()
  .catch((error) => {
    console.error('Error en el seed de pagos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
