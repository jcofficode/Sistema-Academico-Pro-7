require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Sembrando datos demo multimedia (_jf)...');

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'lecciones_jf');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create dummy mp4 files for testing streams
  fs.writeFileSync(path.join(uploadsDir, 'video_demo1.mp4'), Buffer.alloc(1024 * 1024)); // 1MB dummy
  fs.writeFileSync(path.join(uploadsDir, 'video_demo2.mp4'), Buffer.alloc(1024 * 1024)); // 1MB dummy

  // 1. Buscar curso demo
  let curso = await prisma.td_curso_ahbb.findFirst({
    where: { nombre_ahbb: 'Diplomado en Alta Relojería de Precisión' },
  });

  if (!curso) {
    // Si no existe, buscamos el primero disponible o lo creamos
    curso = await prisma.td_curso_ahbb.findFirst();
    if (!curso) {
      console.error('No se encontró ningún curso existente. Ejecuta el backend primero.');
      process.exit(1);
    }
  }

  console.log(`Usando curso: "${curso.nombre_ahbb}" (ID: ${curso.id_curso_ahbb})`);

  // 2. Buscar alumno Maria y profesor Carlos
  const maria = await prisma.td_usuario_ahbb.findFirst({
    where: { correo_ahbb: 'maria@estudiante.edu' },
  });

  if (!maria) {
    console.error('No se encontró el alumno Maria. Asegúrate de correr la inicialización base.');
    process.exit(1);
  }

  // Asegurar inscripción
  let inscripcion = await prisma.td_inscripcion_ahbb.findFirst({
    where: {
      id_curso_inscripcion_ahbb: curso.id_curso_ahbb,
      id_usuario_inscripcion_ahbb: maria.id_usuario_ahbb,
    },
  });

  if (!inscripcion) {
    inscripcion = await prisma.td_inscripcion_ahbb.create({
      data: {
        id_curso_inscripcion_ahbb: curso.id_curso_ahbb,
        id_usuario_inscripcion_ahbb: maria.id_usuario_ahbb,
        estatus_ahbb: 'INSCRITO',
      },
    });
  } else {
    // Forzar estatus inscrito para probar el flujo de avance
    await prisma.td_inscripcion_ahbb.update({
      where: { id_inscripcion_ahbb: inscripcion.id_inscripcion_ahbb },
      data: { estatus_ahbb: 'INSCRITO' },
    });
  }

  // 3. Limpiar bloques/lecciones anteriores del curso para resembrar
  await prisma.td_bloques_jf.deleteMany({
    where: { id_curso_bloque_jf: curso.id_curso_ahbb },
  });

  // 4. Crear Bloque 1: Introducción a la Relojería Mecánica
  const bloque1 = await prisma.td_bloques_jf.create({
    data: {
      id_curso_bloque_jf: curso.id_curso_ahbb,
      nombre_jf: 'Bloque I: Principios de la Relojería Mecánica',
      descripcion_jf: 'Conceptos fundamentales y herramientas de precisión.',
      orden_jf: 1,
    },
  });

  // Crear Lecciones Bloque 1
  const leccion1 = await prisma.td_lecciones_jf.create({
    data: {
      id_bloque_leccion_jf: bloque1.id_bloque_jf,
      titulo_jf: '1. Herramientas y banco de trabajo',
      descripcion_jf: 'Conoce los destornilladores, lupas y pinzas necesarios.',
      orden_jf: 1,
      tipo_jf: 'VIDEO',
      urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4',
    },
  });

  const leccion2 = await prisma.td_lecciones_jf.create({
    data: {
      id_bloque_leccion_jf: bloque1.id_bloque_jf,
      titulo_jf: '2. Desarmando el calibre base',
      descripcion_jf: 'Procedimiento paso a paso para el desmontaje del tren de rodaje.',
      orden_jf: 2,
      tipo_jf: 'VIDEO',
      urlArchivo_jf: 'uploads/lecciones_jf/video_demo2.mp4',
    },
  });

  const leccion3 = await prisma.td_lecciones_jf.create({
    data: {
      id_bloque_leccion_jf: bloque1.id_bloque_jf,
      titulo_jf: '3. Guía de lubricación técnica',
      descripcion_jf: 'Lectura sobre el uso de aceites Moebius de diferente densidad.',
      orden_jf: 3,
      tipo_jf: 'LECTURA',
      contenidoTexto_jf: 'En relojería, la lubricación es crítica. El tren de rodaje requiere aceites de baja viscosidad en los pivotes rápidos (escape, segundero) y grasas de alta presión en el muelle real. Siempre aplique una gota micrométrica utilizando un aceitador de horquilla limpia bajo la lupa de 5x.',
    },
  });

  // Crear Evaluación del Bloque 1
  const evaluacion1 = await prisma.td_evaluaciones_jf.create({
    data: {
      id_bloque_evaluacion_jf: bloque1.id_bloque_jf,
      titulo_jf: 'Evaluación del Bloque I: Mecanismos Básicos',
      descripcion_jf: 'Pon a prueba tus conocimientos sobre desmontaje y herramientas.',
      notaMinima_jf: 12, // Mínimo 12 puntos sobre 20
      intentosMaximos_jf: 3,
      preguntasJson_jf: [
        {
          pregunta: '¿Cuál es la función principal del muelle real?',
          opciones: [
            'Regular el isocronismo del volante',
            'Almacenar la energía mecánica para el reloj',
            'Soportar los rubíes del puente de rodaje',
          ],
          respuestaCorrecta: 1,
        },
        {
          pregunta: '¿Qué tipo de lubricante se utiliza en los pivotes de escape?',
          opciones: [
            'Grasa de alta densidad',
            'Aceite sintético fluido de baja viscosidad',
            'No requiere lubricante',
          ],
          respuestaCorrecta: 1,
        },
        {
          pregunta: 'Para quitar los puentes del rodaje, ¿qué herramienta es imprescindible?',
          opciones: [
            'Destornillador plano antimagnético de precisión',
            'Pinza de forja pesada',
            'Soplete de soldadura',
          ],
          respuestaCorrecta: 0,
        },
      ],
    },
  });

  // 5. Crear Bloque 2: Calibración y Volante Espiral
  const bloque2 = await prisma.td_bloques_jf.create({
    data: {
      id_curso_bloque_jf: curso.id_curso_ahbb,
      nombre_jf: 'Bloque II: Órgano Regulador e Isocronismo',
      descripcion_jf: 'Alineación de espirales, ajuste del volante y corrección en el cronocomparador.',
      orden_jf: 2,
    },
  });

  const leccion4 = await prisma.td_lecciones_jf.create({
    data: {
      id_bloque_leccion_jf: bloque2.id_bloque_jf,
      titulo_jf: '4. El órgano regulador (volante-espiral)',
      descripcion_jf: 'Introducción al sistema oscilante y balance dinámico.',
      orden_jf: 1,
      tipo_jf: 'VIDEO',
      urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4', // reutilizado
    },
  });

  // 6. Sembrar Progreso Parcial para María (Mitad de progreso)
  // - Lección 1 COMPLETADA
  await prisma.td_progreso_lecciones_jf.create({
    data: {
      id_inscripcion_progreso_jf: inscripcion.id_inscripcion_ahbb,
      id_leccion_progreso_jf: leccion1.id_leccion_jf,
      id_usuario_alumno_jf: maria.id_usuario_ahbb,
      completada_jf: true,
      porcentajeVisto_jf: 100,
    },
  });

  // - Lección 2 EN PROGRESO (desbloqueada, pero porcentaje de vista a la mitad)
  await prisma.td_progreso_lecciones_jf.create({
    data: {
      id_inscripcion_progreso_jf: inscripcion.id_inscripcion_ahbb,
      id_leccion_progreso_jf: leccion2.id_leccion_jf,
      id_usuario_alumno_jf: maria.id_usuario_ahbb,
      completada_jf: false,
      porcentajeVisto_jf: 45,
    },
  });

  // - Lección 3 y Evaluación quedan bloqueadas (no hay progreso)

  // 7. Crear una Sala de Videollamadas de prueba para mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(15, 0, 0, 0);

  // Borrar salas previas del curso
  await prisma.td_salas_videollamadas_jf.deleteMany({
    where: { id_curso_sala_jf: curso.id_curso_ahbb },
  });

  await prisma.td_salas_videollamadas_jf.create({
    data: {
      id_curso_sala_jf: curso.id_curso_ahbb,
      id_usuario_creador_jf: curso.id_usuario_curso_ahbb, // el profesor
      nombreSala_jf: `Sala_Demo_Relojeria_${Date.now()}`,
      titulo_jf: 'Clase en Vivo: Dudas sobre Lubricación Moebius',
      estado_jf: 'PROGRAMADA',
      fechaProgramada_jf: manana,
    },
  });

  console.log('Seed multimedia completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error sembrando multimedia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
