require('dotenv/config');
const { Client } = require('pg');

function obtenerConfiguracion_ahbb() {
  const databaseUrl_ahbb = process.env.DATABASE_URL;
  if (!databaseUrl_ahbb) {
    throw new Error('DATABASE_URL no está definida.');
  }

  const url_ahbb = new URL(databaseUrl_ahbb);
  const nombreBaseDatos_ahbb = url_ahbb.pathname.replace(/^\//, '');
  const urlMantenimiento_ahbb = new URL(databaseUrl_ahbb);
  urlMantenimiento_ahbb.pathname = '/postgres';

  return {
    nombreBaseDatos_ahbb,
    conexionMantenimiento_ahbb: urlMantenimiento_ahbb.toString(),
  };
}

async function inicializarBaseDatos_ahbb() {
  const {
    nombreBaseDatos_ahbb,
    conexionMantenimiento_ahbb,
  } = obtenerConfiguracion_ahbb();

  const cliente_ahbb = new Client({ connectionString: conexionMantenimiento_ahbb });
  await cliente_ahbb.connect();

  try {
    const resultado_ahbb = await cliente_ahbb.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [nombreBaseDatos_ahbb],
    );

    if (resultado_ahbb.rowCount === 0) {
      await cliente_ahbb.query(`CREATE DATABASE "${nombreBaseDatos_ahbb}"`);
      console.log(`Base de datos creada: ${nombreBaseDatos_ahbb}`);
    } else {
      console.log(`Base de datos existente: ${nombreBaseDatos_ahbb}`);
    }
  } finally {
    await cliente_ahbb.end();
  }
}

inicializarBaseDatos_ahbb().catch((error_ahbb) => {
  console.error('Error inicializando la base de datos:', error_ahbb);
  process.exit(1);
});
