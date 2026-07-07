require('dotenv/config');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PASSWORD_AHBB = 'demo123';
const BASE_PROFESSOR_PASSWORD_AHBB = 'prof123';
const BASE_PROFESSOR_AHBB = {
  cedula_ahbb: 'V-10000002',
  nombre_ahbb: 'Carlos',
  apellido_ahbb: 'Mendez',
  correo_ahbb: 'carlos@academiah-b.edu',
  rol_ahbb: 'PROFESOR',
};
const DEMO_USERS_AHBB = {
  profesor: {
    cedula_ahbb: 'V-20000001',
    nombre_ahbb: 'Patricia',
    apellido_ahbb: 'Demo',
    correo_ahbb: 'demo.profesor@academiah-b.edu',
    rol_ahbb: 'PROFESOR',
  },
  aprobado: {
    cedula_ahbb: 'V-20000011',
    nombre_ahbb: 'Alicia',
    apellido_ahbb: 'Aprobada',
    correo_ahbb: 'demo.alumno.aprobado@academiah-b.edu',
    rol_ahbb: 'ALUMNO',
  },
  reprobado: {
    cedula_ahbb: 'V-20000012',
    nombre_ahbb: 'Bruno',
    apellido_ahbb: 'Reprobado',
    correo_ahbb: 'demo.alumno.reprobado@academiah-b.edu',
    rol_ahbb: 'ALUMNO',
  },
  pendiente: {
    cedula_ahbb: 'V-20000013',
    nombre_ahbb: 'Carla',
    apellido_ahbb: 'Pendiente',
    correo_ahbb: 'demo.alumno.pendiente@academiah-b.edu',
    rol_ahbb: 'ALUMNO',
  },
};

const DEMO_COURSES_AHBB = {
  finalizado: {
    nombre_ahbb: 'Curso Finalizado Demo - Evaluacion',
    tematica_ahbb: 'Escenario de prueba para aprobacion y reprobacion',
    descripcion_ahbb:
      'Curso de prueba ya culminado para revisar vistas de profesor y alumno.',
    temarioTexto_ahbb: '1. Cierre del curso\n2. Evaluacion final\n3. Resultados',
    horasDefinidas_ahbb: 24,
    diasDefinidos_ahbb: 12,
    topeEstudiantes_ahbb: 10,
    fechaInicioOffsetDias_ahbb: -45,
    fechaFinOffsetDias_ahbb: -15,
    horario_ahbb: {
      diaSemana_ahbb: 'LUNES',
      horaInicio_ahbb: '08:00',
      horaFin_ahbb: '10:00',
    },
  },
  progreso: {
    nombre_ahbb: 'Curso en Progreso Demo - Evaluacion',
    tematica_ahbb: 'Escenario de prueba para curso aun activo',
    descripcion_ahbb:
      'Curso de prueba en progreso para revisar estados activos del alumno.',
    temarioTexto_ahbb: '1. Modulo activo\n2. Seguimiento\n3. Practica',
    horasDefinidas_ahbb: 18,
    diasDefinidos_ahbb: 9,
    topeEstudiantes_ahbb: 10,
    fechaInicioOffsetDias_ahbb: -5,
    fechaFinOffsetDias_ahbb: 20,
    horario_ahbb: {
      diaSemana_ahbb: 'MARTES',
      horaInicio_ahbb: '14:00',
      horaFin_ahbb: '16:00',
    },
  },
};

function sumarDias_ahbb(base_ahbb, dias_ahbb) {
  return new Date(base_ahbb.getTime() + dias_ahbb * 24 * 60 * 60 * 1000);
}

async function asegurarUsuarioDemo_ahbb(config_ahbb, hash_ahbb) {
  const existente_ahbb = await prisma.td_usuario_ahbb.findUnique({
    where: { correo_ahbb: config_ahbb.correo_ahbb },
  });

  const data_ahbb = {
    cedula_ahbb: config_ahbb.cedula_ahbb,
    nombre_ahbb: config_ahbb.nombre_ahbb,
    apellido_ahbb: config_ahbb.apellido_ahbb,
    correo_ahbb: config_ahbb.correo_ahbb,
    contrasena_ahbb: hash_ahbb,
    rol_ahbb: config_ahbb.rol_ahbb,
    estadoCuenta_ahbb: 'ACTIVO',
    requiereCambioContrasena_ahbb: false,
    referenciaPagoMovil_ahbb: null,
  };

  if (existente_ahbb) {
    const actualizado_ahbb = await prisma.td_usuario_ahbb.update({
      where: { id_usuario_ahbb: existente_ahbb.id_usuario_ahbb },
      data: data_ahbb,
    });
    console.log(`Usuario demo listo: ${actualizado_ahbb.correo_ahbb}`);
    return actualizado_ahbb;
  }

  const creado_ahbb = await prisma.td_usuario_ahbb.create({ data: data_ahbb });
  console.log(`Usuario demo creado: ${creado_ahbb.correo_ahbb}`);
  return creado_ahbb;
}

async function restaurarProfesorBase_ahbb() {
  const hashBase_ahbb = await bcrypt.hash(BASE_PROFESSOR_PASSWORD_AHBB, 10);
  const existente_ahbb = await prisma.td_usuario_ahbb.findUnique({
    where: { correo_ahbb: BASE_PROFESSOR_AHBB.correo_ahbb },
  });

  if (!existente_ahbb) {
    const creado_ahbb = await prisma.td_usuario_ahbb.create({
      data: {
        ...BASE_PROFESSOR_AHBB,
        contrasena_ahbb: hashBase_ahbb,
        estadoCuenta_ahbb: 'ACTIVO',
        requiereCambioContrasena_ahbb: false,
        referenciaPagoMovil_ahbb: null,
      },
    });
    console.log(`Profesor base restaurado: ${creado_ahbb.correo_ahbb}`);
    return creado_ahbb;
  }

  const actualizado_ahbb = await prisma.td_usuario_ahbb.update({
    where: { id_usuario_ahbb: existente_ahbb.id_usuario_ahbb },
    data: {
      ...BASE_PROFESSOR_AHBB,
      contrasena_ahbb: hashBase_ahbb,
      estadoCuenta_ahbb: 'ACTIVO',
      requiereCambioContrasena_ahbb: false,
      referenciaPagoMovil_ahbb: null,
    },
  });
  console.log(`Profesor base listo: ${actualizado_ahbb.correo_ahbb}`);
  return actualizado_ahbb;
}

async function asegurarCursoDemo_ahbb(config_ahbb, profesorId_ahbb) {
  const ahora_ahbb = new Date();
  const fechaInicio_ahbb = sumarDias_ahbb(
    ahora_ahbb,
    config_ahbb.fechaInicioOffsetDias_ahbb,
  );
  const fechaFin_ahbb = sumarDias_ahbb(
    ahora_ahbb,
    config_ahbb.fechaFinOffsetDias_ahbb,
  );

  const existente_ahbb = await prisma.td_curso_ahbb.findFirst({
    where: {
      nombre_ahbb: config_ahbb.nombre_ahbb,
      id_usuario_curso_ahbb: profesorId_ahbb,
    },
  });

  let curso_ahbb;
  if (existente_ahbb) {
    curso_ahbb = await prisma.td_curso_ahbb.update({
      where: { id_curso_ahbb: existente_ahbb.id_curso_ahbb },
      data: {
        tematica_ahbb: config_ahbb.tematica_ahbb,
        descripcion_ahbb: config_ahbb.descripcion_ahbb,
        temarioTexto_ahbb: config_ahbb.temarioTexto_ahbb,
        fechaInicio_ahbb,
        fechaFin_ahbb,
        fechaDuracion_ahbb: fechaFin_ahbb,
        horasDefinidas_ahbb: config_ahbb.horasDefinidas_ahbb,
        diasDefinidos_ahbb: config_ahbb.diasDefinidos_ahbb,
        topeEstudiantes_ahbb: config_ahbb.topeEstudiantes_ahbb,
        estadoAprobacion_ahbb: 'ACTIVO',
        isPublished_ahbb: true,
        imagenBloqueada_ahbb: false,
        motivoRechazo_ahbb: null,
        mensajeCorreccion_ahbb: null,
        id_usuario_curso_ahbb: profesorId_ahbb,
      },
    });

    await prisma.td_horario_ahbb.deleteMany({
      where: { id_curso_horario_ahbb: curso_ahbb.id_curso_ahbb },
    });

    await prisma.td_sesion_curso_ahbb.deleteMany({
      where: { id_curso_sesion_ahbb: curso_ahbb.id_curso_ahbb },
    });

    console.log(`Curso demo actualizado: ${curso_ahbb.nombre_ahbb}`);
  } else {
    curso_ahbb = await prisma.td_curso_ahbb.create({
      data: {
        nombre_ahbb: config_ahbb.nombre_ahbb,
        tematica_ahbb: config_ahbb.tematica_ahbb,
        descripcion_ahbb: config_ahbb.descripcion_ahbb,
        temarioTexto_ahbb: config_ahbb.temarioTexto_ahbb,
        fechaInicio_ahbb,
        fechaFin_ahbb,
        fechaDuracion_ahbb: fechaFin_ahbb,
        horasDefinidas_ahbb: config_ahbb.horasDefinidas_ahbb,
        diasDefinidos_ahbb: config_ahbb.diasDefinidos_ahbb,
        topeEstudiantes_ahbb: config_ahbb.topeEstudiantes_ahbb,
        estadoAprobacion_ahbb: 'ACTIVO',
        isPublished_ahbb: true,
        imagenBloqueada_ahbb: false,
        id_usuario_curso_ahbb: profesorId_ahbb,
      },
    });
    console.log(`Curso demo creado: ${curso_ahbb.nombre_ahbb}`);
  }

  await prisma.td_horario_ahbb.create({
    data: {
      ...config_ahbb.horario_ahbb,
      id_curso_horario_ahbb: curso_ahbb.id_curso_ahbb,
    },
  });

  await prisma.$queryRaw`SELECT fn_generar_sesiones_curso_ahbb(
    ${curso_ahbb.id_curso_ahbb}::INT,
    ${fechaInicio_ahbb.toISOString().split('T')[0]}::DATE,
    ${[config_ahbb.horario_ahbb.diaSemana_ahbb]}::TEXT[],
    ${[config_ahbb.horario_ahbb.horaInicio_ahbb]}::TEXT[],
    ${[config_ahbb.horario_ahbb.horaFin_ahbb]}::TEXT[],
    ${config_ahbb.horasDefinidas_ahbb}::NUMERIC
  )`;

  return curso_ahbb;
}

async function resetearInscripcionesDemo_ahbb(cursoId_ahbb, usuarioIds_ahbb) {
  const inscripciones_ahbb = await prisma.td_inscripcion_ahbb.findMany({
    where: {
      id_curso_inscripcion_ahbb: cursoId_ahbb,
      id_usuario_inscripcion_ahbb: { in: usuarioIds_ahbb },
    },
    select: { id_inscripcion_ahbb: true },
  });

  const inscripcionIds_ahbb = inscripciones_ahbb.map(
    (item_ahbb) => item_ahbb.id_inscripcion_ahbb,
  );

  if (inscripcionIds_ahbb.length > 0) {
    await prisma.td_certificado_ahbb.deleteMany({
      where: {
        id_inscripcion_certificado_ahbb: { in: inscripcionIds_ahbb },
      },
    });

    await prisma.td_inscripcion_ahbb.deleteMany({
      where: {
        id_inscripcion_ahbb: { in: inscripcionIds_ahbb },
      },
    });
  }
}

async function limpiarCursosDemoLegados_ahbb(profesorDemoId_ahbb) {
  const nombresDemo_ahbb = [
    DEMO_COURSES_AHBB.finalizado.nombre_ahbb,
    DEMO_COURSES_AHBB.progreso.nombre_ahbb,
  ];

  const cursosLegados_ahbb = await prisma.td_curso_ahbb.findMany({
    where: {
      nombre_ahbb: { in: nombresDemo_ahbb },
      id_usuario_curso_ahbb: { not: profesorDemoId_ahbb },
    },
    select: {
      id_curso_ahbb: true,
      nombre_ahbb: true,
    },
  });

  for (const cursoLegado_ahbb of cursosLegados_ahbb) {
    await prisma.td_curso_ahbb.delete({
      where: { id_curso_ahbb: cursoLegado_ahbb.id_curso_ahbb },
    });
    console.log(`Curso demo legado eliminado: ${cursoLegado_ahbb.nombre_ahbb}`);
  }
}

async function crearInscripcionDemo_ahbb({
  alumnoId_ahbb,
  cursoId_ahbb,
  estatus_ahbb,
  notaFinal_ahbb,
  observaciones_ahbb,
  crearCertificado_ahbb = false,
}) {
  const inscripcion_ahbb = await prisma.td_inscripcion_ahbb.create({
    data: {
      id_usuario_inscripcion_ahbb: alumnoId_ahbb,
      id_curso_inscripcion_ahbb: cursoId_ahbb,
      estatus_ahbb,
      intento_ahbb: 1,
      notaFinal_ahbb:
        notaFinal_ahbb !== undefined && notaFinal_ahbb !== null
          ? String(notaFinal_ahbb)
          : null,
      observaciones_ahbb: observaciones_ahbb ?? null,
    },
  });

  if (crearCertificado_ahbb) {
    const codigo_ahbb = crypto.randomUUID();
    await prisma.td_certificado_ahbb.create({
      data: {
        codigoQrUrl_ahbb: `https://demo.academiah-b.edu/certificados/${codigo_ahbb}`,
        id_inscripcion_certificado_ahbb: inscripcion_ahbb.id_inscripcion_ahbb,
      },
    });
    console.log(
      `Certificado demo creado para inscripcion ${inscripcion_ahbb.id_inscripcion_ahbb}`,
    );
  }

  return inscripcion_ahbb;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta definida.');
  }

  console.log('Preparando escenario demo cursosFinalizados...');

  const hash_ahbb = await bcrypt.hash(DEMO_PASSWORD_AHBB, 10);
  await restaurarProfesorBase_ahbb();

  const profesor_ahbb = await asegurarUsuarioDemo_ahbb(
    DEMO_USERS_AHBB.profesor,
    hash_ahbb,
  );
  const alumnoAprobado_ahbb = await asegurarUsuarioDemo_ahbb(
    DEMO_USERS_AHBB.aprobado,
    hash_ahbb,
  );
  const alumnoReprobado_ahbb = await asegurarUsuarioDemo_ahbb(
    DEMO_USERS_AHBB.reprobado,
    hash_ahbb,
  );
  const alumnoPendiente_ahbb = await asegurarUsuarioDemo_ahbb(
    DEMO_USERS_AHBB.pendiente,
    hash_ahbb,
  );

  await limpiarCursosDemoLegados_ahbb(profesor_ahbb.id_usuario_ahbb);

  const cursoFinalizado_ahbb = await asegurarCursoDemo_ahbb(
    DEMO_COURSES_AHBB.finalizado,
    profesor_ahbb.id_usuario_ahbb,
  );
  const cursoProgreso_ahbb = await asegurarCursoDemo_ahbb(
    DEMO_COURSES_AHBB.progreso,
    profesor_ahbb.id_usuario_ahbb,
  );

  const alumnoIds_ahbb = [
    alumnoAprobado_ahbb.id_usuario_ahbb,
    alumnoReprobado_ahbb.id_usuario_ahbb,
    alumnoPendiente_ahbb.id_usuario_ahbb,
  ];

  await resetearInscripcionesDemo_ahbb(
    cursoFinalizado_ahbb.id_curso_ahbb,
    alumnoIds_ahbb,
  );
  await resetearInscripcionesDemo_ahbb(
    cursoProgreso_ahbb.id_curso_ahbb,
    alumnoIds_ahbb,
  );

  await crearInscripcionDemo_ahbb({
    alumnoId_ahbb: alumnoAprobado_ahbb.id_usuario_ahbb,
    cursoId_ahbb: cursoFinalizado_ahbb.id_curso_ahbb,
    estatus_ahbb: 'APROBADO',
    notaFinal_ahbb: 19,
    observaciones_ahbb: 'Alumno demo aprobado para pruebas de certificado.',
    crearCertificado_ahbb: true,
  });

  await crearInscripcionDemo_ahbb({
    alumnoId_ahbb: alumnoReprobado_ahbb.id_usuario_ahbb,
    cursoId_ahbb: cursoFinalizado_ahbb.id_curso_ahbb,
    estatus_ahbb: 'REPROBADO',
    notaFinal_ahbb: 8,
    observaciones_ahbb: 'Alumno demo reprobado para pruebas de historial.',
  });

  await crearInscripcionDemo_ahbb({
    alumnoId_ahbb: alumnoPendiente_ahbb.id_usuario_ahbb,
    cursoId_ahbb: cursoFinalizado_ahbb.id_curso_ahbb,
    estatus_ahbb: 'OYENTE',
    observaciones_ahbb:
      'Alumno demo pendiente de calificacion para pruebas del profesor.',
  });

  await crearInscripcionDemo_ahbb({
    alumnoId_ahbb: alumnoPendiente_ahbb.id_usuario_ahbb,
    cursoId_ahbb: cursoProgreso_ahbb.id_curso_ahbb,
    estatus_ahbb: 'INSCRITO',
    observaciones_ahbb: 'Alumno demo inscrito en curso aun activo.',
  });

  console.log('Escenario cursosFinalizados listo.');
  console.log(
    `Profesor demo: ${DEMO_USERS_AHBB.profesor.correo_ahbb} / ${DEMO_PASSWORD_AHBB}`,
  );
  console.log(
    `Profesor base restaurado: ${BASE_PROFESSOR_AHBB.correo_ahbb} / ${BASE_PROFESSOR_PASSWORD_AHBB}`,
  );
  console.log(
    `Alumno demo aprobado: ${DEMO_USERS_AHBB.aprobado.correo_ahbb} / ${DEMO_PASSWORD_AHBB}`,
  );
  console.log(
    `Alumno demo reprobado: ${DEMO_USERS_AHBB.reprobado.correo_ahbb} / ${DEMO_PASSWORD_AHBB}`,
  );
  console.log(
    `Alumno demo pendiente: ${DEMO_USERS_AHBB.pendiente.correo_ahbb} / ${DEMO_PASSWORD_AHBB}`,
  );
}

main()
  .catch((error_ahbb) => {
    console.error('Error preparando cursosFinalizados:', error_ahbb);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
