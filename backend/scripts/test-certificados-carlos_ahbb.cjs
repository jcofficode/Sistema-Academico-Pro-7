require('dotenv/config');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('--- Configurando cursos finalizados para Carlos ---');

  // 1. Asegurar que Carlos existe
  const hashCarlos = await bcrypt.hash('prof123', 10);
  const carlos = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'carlos@academiah-b.edu' },
    update: { estadoCuenta_ahbb: 'ACTIVO' },
    create: {
      cedula_ahbb: 'V-10000002',
      nombre_ahbb: 'Carlos',
      apellido_ahbb: 'Mendez',
      correo_ahbb: 'carlos@academiah-b.edu',
      contrasena_ahbb: hashCarlos,
      rol_ahbb: 'PROFESOR',
      estadoCuenta_ahbb: 'ACTIVO',
    }
  });

  // 2. Asegurar que tenemos alumnos para inscribir
  const hashAlumno = await bcrypt.hash('demo123', 10);
  const alumno1 = await prisma.td_usuario_ahbb.upsert({
    where: { correo_ahbb: 'alumno.test1@demo.edu' },
    update: {},
    create: {
      cedula_ahbb: 'V-30000001',
      nombre_ahbb: 'Juan',
      apellido_ahbb: 'Alumno',
      correo_ahbb: 'alumno.test1@demo.edu',
      contrasena_ahbb: hashAlumno,
      rol_ahbb: 'ALUMNO',
      estadoCuenta_ahbb: 'ACTIVO',
    }
  });

  const ahora = new Date();
  const fechaInicio = new Date(ahora.getTime() - 60 * 24 * 60 * 60 * 1000); // Hace 60 días
  const fechaFin = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);    // Hace 30 días

  const cursosData = [
    {
      nombre_ahbb: 'Desarrollo Web Avanzado (Finalizado)',
      tematica_ahbb: 'Programación',
      descripcion_ahbb: 'Curso completado para pruebas de certificados.',
    },
    {
      nombre_ahbb: 'Bases de Datos Relacionales (Finalizado)',
      tematica_ahbb: 'Sistemas',
      descripcion_ahbb: 'Curso completado para pruebas de certificados.',
    }
  ];

  for (const cData of cursosData) {
    const curso = await prisma.td_curso_ahbb.create({
      data: {
        ...cData,
        diasDefinidos_ahbb: 10,
        horasDefinidas_ahbb: 40,
        fechaInicio_ahbb: fechaInicio,
        fechaFin_ahbb: fechaFin,
        fechaDuracion_ahbb: fechaFin,
        estadoAprobacion_ahbb: 'ACTIVO',
        isPublished_ahbb: true,
        id_usuario_curso_ahbb: carlos.id_usuario_ahbb,
      }
    });

    console.log(`Curso creado: ${curso.nombre_ahbb}`);

    // Inscribir alumno y marcar como aprobado para que genere certificado
    const inscripcion = await prisma.td_inscripcion_ahbb.create({
      data: {
        id_usuario_inscripcion_ahbb: alumno1.id_usuario_ahbb,
        id_curso_inscripcion_ahbb: curso.id_curso_ahbb,
        estatus_ahbb: 'APROBADO',
        notaFinal_ahbb: '18.50',
        observaciones_ahbb: 'Aprobado automáticamente por script de test.',
      }
    });

    // Crear el certificado
    await prisma.td_certificado_ahbb.create({
      data: {
        codigoQrUrl_ahbb: `https://academia-hb.edu/verificar/${crypto.randomUUID()}`,
        id_inscripcion_certificado_ahbb: inscripcion.id_inscripcion_ahbb,
      }
    });

    console.log(`Inscripción y certificado creados para el curso ${curso.id_curso_ahbb}`);
  }

  console.log('--- Proceso finalizado con éxito ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
