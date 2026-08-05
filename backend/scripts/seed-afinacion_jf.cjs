require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma_ahbb/index.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const curso = await prisma.td_curso_ahbb.findFirst({
    where: { id_curso_ahbb: 10 }
  });

  if (!curso) {
    console.error('Curso 10 no encontrado');
    process.exit(1);
  }

  console.log('Poblando módulo multimedia para:', curso.nombre_ahbb);

  // Asegurar directorio de uploads para videos
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

  // Limpiar bloques anteriores del curso 10 si los hay
  await prisma.td_bloques_jf.deleteMany({
    where: { id_curso_bloque_jf: 10 }
  });
  await prisma.td_salas_videollamadas_jf.deleteMany({
    where: { id_curso_sala_jf: 10 }
  });

  // Bloque 1
  const b1 = await prisma.td_bloques_jf.create({
    data: {
      id_curso_bloque_jf: 10,
      nombre_jf: 'Bloque I: Refinación Química y Precipitación de Oro/Plata',
      descripcion_jf: 'Procesos de disolución en agua regia, filtrado y precipitación selectiva.',
      orden_jf: 1,
    }
  });

  await prisma.td_lecciones_jf.createMany({
    data: [
      {
        id_bloque_leccion_jf: b1.id_bloque_jf,
        titulo_jf: '1. Fundamentos de Agua Regia y Ataque Químico',
        descripcion_jf: 'Preparación de reactivos y disolución de aleaciones preciosas.',
        orden_jf: 1,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4'
      },
      {
        id_bloque_leccion_jf: b1.id_bloque_jf,
        titulo_jf: '2. Precipitación y Filtrado de Oro Fino',
        descripcion_jf: 'Uso de bisulfito de sodio para recuperar oro de 24K.',
        orden_jf: 2,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo2.mp4'
      },
      {
        id_bloque_leccion_jf: b1.id_bloque_jf,
        titulo_jf: '3. Protocolo de Seguridad en el Manejo de Ácidos',
        descripcion_jf: 'Medidas preventivas, uso de EPP y neutralización de gases nitrosos.',
        orden_jf: 3,
        tipo_jf: 'LECTURA',
        contenidoTexto_jf: 'El uso de agua regia (ácido nítrico y clorhídrico 1:3) requiere campana de extracción de gases, guantes de nitrilo pesado y pantalla facial. La precipitación con bisulfito de sodio debe realizarse a temperatura controlada para maximizar la pureza del sedimento.'
      }
    ]
  });

  await prisma.td_evaluaciones_jf.create({
    data: {
      id_bloque_evaluacion_jf: b1.id_bloque_jf,
      titulo_jf: 'Evaluación I: Refinación y Precipitación Química',
      descripcion_jf: 'Demuestra tu comprensión sobre ataque ácido y neutralización.',
      notaMinima_jf: 12,
      intentosMaximos_jf: 3,
      preguntasJson_jf: [
        {
          pregunta: '¿Qué combinación de ácidos conforma el Agua Regia?',
          opciones: ['Ácido Nítrico y Ácido Clorhídrico (1:3)', 'Ácido Sulfúrico y Ácido Acético', 'Ácido Nítrico puro'],
          respuestaCorrecta: 0
        },
        {
          pregunta: '¿Qué agente precipitante se utiliza comúnmente para recuperar el oro en solución?',
          opciones: ['Bisulfito de sodio', 'Carbonato de calcio', 'Sulfato de cobre'],
          respuestaCorrecta: 0
        },
        {
          pregunta: '¿Qué equipo es indispensable durante la neutralización de gases nitrosos?',
          opciones: ['Campana de extracción y respirador', 'Horno de microfusión', 'Vaso precipitado de vidrio'],
          respuestaCorrecta: 0
        }
      ]
    }
  });

  // Bloque 2
  const b2 = await prisma.td_bloques_jf.create({
    data: {
      id_curso_bloque_jf: 10,
      nombre_jf: 'Bloque II: Procesos Galvánicos, Electropulido y Baños de Rodio',
      descripcion_jf: 'Técnicas de preparación de superficie y electrodeposición metálica.',
      orden_jf: 2,
    }
  });

  await prisma.td_lecciones_jf.createMany({
    data: [
      {
        id_bloque_leccion_jf: b2.id_bloque_jf,
        titulo_jf: '1. Preparación de Baños de Rodio y Dorado Galvánico',
        descripcion_jf: 'Ajuste de temperatura, densidad de corriente y ánodos de titanio.',
        orden_jf: 1,
        tipo_jf: 'VIDEO',
        urlArchivo_jf: 'uploads/lecciones_jf/video_demo1.mp4'
      },
      {
        id_bloque_leccion_jf: b2.id_bloque_jf,
        titulo_jf: '2. Desengrase Electrolítico y Tensión de Celda',
        descripcion_jf: 'Limpieza ultrasónica y desengrase a 6V para adherencia perfecta.',
        orden_jf: 2,
        tipo_jf: 'LECTURA',
        contenidoTexto_jf: 'Para garantizar una adhesión óptima del depósito de rodio u oro, la pieza debe pasar por un desengrase electrolítico a 6V durante 30 segundos, seguido de neutralización ácida y aclarado riguroso en agua desmineralizada.'
      }
    ]
  });

  await prisma.td_evaluaciones_jf.create({
    data: {
      id_bloque_evaluacion_jf: b2.id_bloque_jf,
      titulo_jf: 'Evaluación II: Procesos Galvánicos y Electropulido',
      descripcion_jf: 'Evaluación técnica de parámetros eléctricos y control de micras.',
      notaMinima_jf: 12,
      intentosMaximos_jf: 3,
      preguntasJson_jf: [
        {
          pregunta: '¿Cuál es el voltaje recomendado para el desengrase electrolítico?',
          opciones: ['6 a 8 Voltios', '110 Voltios', '1.5 Voltios'],
          respuestaCorrecta: 0
        },
        {
          pregunta: '¿Por qué es crucial lavar con agua desmineralizada antes del baño galvánico?',
          opciones: ['Para evitar contaminación del baño de rodio/oro', 'Para enfriar el metal rápidamente', 'Para disolver el metal'],
          respuestaCorrecta: 0
        },
        {
          pregunta: '¿Qué ánodo se utiliza preferiblemente en el baño de rodio?',
          opciones: ['Ánodo de titanio platinado', 'Ánodo de hierro fundido', 'Ánodo de aluminio'],
          respuestaCorrecta: 0
        }
      ]
    }
  });

  // Videollamadas
  await prisma.td_salas_videollamadas_jf.createMany({
    data: [
      {
        id_curso_sala_jf: 10,
        id_usuario_creador_jf: 2,
        nombreSala_jf: 'sala-afinacion-galvanica-101',
        titulo_jf: 'Taller en Vivo: Neutralización y Baño de Rodio en Directo',
        estado_jf: 'PROGRAMADA',
        fechaProgramada_jf: new Date('2026-08-10T14:00:00Z')
      },
      {
        id_curso_sala_jf: 10,
        id_usuario_creador_jf: 2,
        nombreSala_jf: 'sala-afinacion-galvanica-102',
        titulo_jf: 'Seminario de Seguridad y Gestión de Residuos Galvánicos',
        estado_jf: 'EN_VIVO',
        fechaProgramada_jf: new Date('2026-08-04T10:00:00Z')
      }
    ]
  });

  console.log('¡Contenido multimedia poblado exitosamente para el curso 10!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
