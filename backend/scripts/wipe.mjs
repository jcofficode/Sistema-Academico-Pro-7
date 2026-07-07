import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.td_inscripcion_ahbb.deleteMany({});
  await prisma.td_sesion_ahbb.deleteMany({});
  await prisma.td_horario_ahbb.deleteMany({});
  await prisma.td_curso_ahbb.deleteMany({});
  await prisma.td_producto_ahbb.deleteMany({});
  await prisma.td_usuario_ahbb.deleteMany({});
  console.log('Base de datos limpiada. Lista para repoblar al iniciar.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
