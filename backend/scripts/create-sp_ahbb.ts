import { PrismaClient } from '../src/generated/prisma_ahbb';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const prisma = new PrismaClient();
  const sqlPath = path.join(__dirname, '..', 'prisma', 'sp_generar_sesiones_ahbb.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Creating Stored Procedure in the database...');
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('Stored Procedure created successfully!');
  } catch (error) {
    console.error('Error creating Stored Procedure:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
