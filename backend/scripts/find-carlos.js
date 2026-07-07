const { PrismaClient } = require('./academia-backend/src/generated/prisma_ahbb');
const prisma = new PrismaClient();

async function main() {
  const carlos = await prisma.td_usuario_ahbb.findFirst({
    where: { 
      nombre_ahbb: { contains: 'Carlos', mode: 'insensitive' },
      rol_ahbb: 'PROFESOR'
    }
  });

  if (!carlos) {
    console.log('Professor Carlos not found');
    return;
  }

  console.log('Found Carlos:', JSON.stringify(carlos, null, 2));

  const alumnos = await prisma.td_usuario_ahbb.findMany({
    where: { rol_ahbb: 'ALUMNO' },
    take: 2
  });
  console.log('Found Students:', JSON.stringify(alumnos, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
