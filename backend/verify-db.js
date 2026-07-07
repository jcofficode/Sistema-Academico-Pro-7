const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connectionString.includes('?') ? connectionString.split('?')[0] : connectionString,
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        nombre_ahbb, 
        "fechaInicio_ahbb",
        "fechaFin_ahbb", 
        "fechaDuracion_ahbb", 
        "diasDefinidos_ahbb" 
      FROM td_curso_ahbb 
      ORDER BY id_curso_ahbb DESC 
      LIMIT 10
    `);
    console.log('--- CURSOS DATES VERIFICATION ---');
    res.rows.forEach(r => {
      console.log(`- ${r.nombre_ahbb}`);
      console.log(`  Inicio: ${r.fechaInicio_ahbb}`);
      console.log(`  Fin:    ${r.fechaFin_ahbb}`);
      console.log(`  Duración: ${r.fechaDuracion_ahbb}`);
      console.log(`  Días:   ${r.diasDefinidos_ahbb}`);
      console.log('----------------------------');
    });
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

main();
