require('dotenv/config');
const { Client } = require('pg');

const tablasEsperadas_ahbb = [
  '_prisma_migrations',
  'td_usuario_ahbb',
  'td_curso_ahbb',
  'td_sesion_curso_ahbb',
  'td_horario_ahbb',
  'td_inscripcion_ahbb',
  'td_certificado_ahbb',
  'td_configuracionglobal_ahbb',
  'td_auditoria_aprobacion_ahbb',
  'td_producto_ahbb',
  'td_carrito_ahbb',
  'td_factura_ahbb',
  'td_detalle_factura_ahbb',
  'td_favorito_ahbb',
];

const funcionesEsperadas_ahbb = ['fn_generar_sesiones_curso_ahbb'];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta definida.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Base de datos lista:', new URL(process.env.DATABASE_URL).pathname.slice(1));

    const tablas_ahbb = await client.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name
      `,
      [tablasEsperadas_ahbb],
    );

    const tablasEncontradas_ahbb = new Set(
      tablas_ahbb.rows.map((row) => row.table_name),
    );

    for (const tabla_ahbb of tablasEsperadas_ahbb) {
      if (!tablasEncontradas_ahbb.has(tabla_ahbb)) {
        throw new Error(`Falta la tabla requerida: ${tabla_ahbb}`);
      }

      console.log(`Tabla lista: ${tabla_ahbb}`);
    }

    const funciones_ahbb = await client.query(
      `
        SELECT p.proname
        FROM pg_proc p
        INNER JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY($1::text[])
        ORDER BY p.proname
      `,
      [funcionesEsperadas_ahbb],
    );

    const funcionesEncontradas_ahbb = new Set(
      funciones_ahbb.rows.map((row) => row.proname),
    );

    for (const funcion_ahbb of funcionesEsperadas_ahbb) {
      if (!funcionesEncontradas_ahbb.has(funcion_ahbb)) {
        throw new Error(`Falta la funcion requerida: ${funcion_ahbb}`);
      }

      console.log(`Stored procedure lista: ${funcion_ahbb}`);
    }

    const triggers_ahbb = await client.query(
      `
        SELECT tg.tgname
        FROM pg_trigger tg
        INNER JOIN pg_class c ON c.oid = tg.tgrelid
        INNER JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND NOT tg.tgisinternal
        ORDER BY tg.tgname
      `,
    );

    if (triggers_ahbb.rowCount === 0) {
      console.log('Triggers configurados: ninguno');
    } else {
      for (const trigger_ahbb of triggers_ahbb.rows) {
        console.log(`Trigger listo: ${trigger_ahbb.tgname}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error_ahbb) => {
  console.error('Error verificando la base de datos:', error_ahbb.message);
  process.exit(1);
});
