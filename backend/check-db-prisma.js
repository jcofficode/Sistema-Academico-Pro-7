const { PrismaClient } = require('./src/generated/prisma_ahbb');
const prisma = new PrismaClient();

async function main() {
  const cursos = await prisma.td_curso_ahbb.findMany({
    select: {
      nombre_ahbb: true,
      fechaInicio_ahbb: true,
      fechaFin_ahbb: true,
      fechaDuracion_ahbb: true,
      diasDefinidos_ahbb: true
    },
    orderBy: { id_curso_ahbb: 'desc' },
    take: 10
  });
  console.log('--- CURSOS DATA ---');
  cursos.forEach(c => {
    console.log(`- ${c.nombre_ahbb}`);
    console.log(`  Inicio: ${c.fechaInicio_ahbb}`);
    console.log(`  Fin:    ${c.fechaFin_ahbb}`);
    console.log(`  Dias:   ${c.diasDefinidos_ahbb}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
