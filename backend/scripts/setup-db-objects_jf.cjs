const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString.includes('?') ? connectionString.split('?')[0] : connectionString,
  });

  console.log('Connecting to database to setup _jf objects...');
  try {
    await client.connect();
    console.log('Connected. Running RLS and Audit Triggers script...');

    const sql = `
      -- 1. Habilitar RLS
      ALTER TABLE "td_lecciones_jf" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "td_progreso_lecciones_jf" ENABLE ROW LEVEL SECURITY;

      -- Borrar políticas previas si existen
      DROP POLICY IF EXISTS policy_select_lecciones_jf ON "td_lecciones_jf";
      DROP POLICY IF EXISTS policy_modify_lecciones_jf ON "td_lecciones_jf";
      DROP POLICY IF EXISTS policy_progreso_lecciones_jf ON "td_progreso_lecciones_jf";

      -- Crear políticas RLS
      -- Lecciones: Profesores y Admin leen todo. Alumnos solo si están inscritos en el curso.
      CREATE POLICY policy_select_lecciones_jf ON "td_lecciones_jf"
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "td_usuario_ahbb" u
          WHERE u.id_usuario_ahbb = NULLIF(current_setting('app.usuario_actual', true), '')::integer
          AND u.rol_ahbb IN ('ADMIN', 'PROFESOR')
        )
        OR EXISTS (
          SELECT 1 FROM "td_bloques_jf" b
          JOIN "td_inscripcion_ahbb" i ON i.id_curso_inscripcion_ahbb = b.id_curso_bloque_jf
          WHERE b.id_bloque_jf = "id_bloque_leccion_jf"
          AND i.id_usuario_inscripcion_ahbb = NULLIF(current_setting('app.usuario_actual', true), '')::integer
          AND i.estatus_ahbb IN ('INSCRITO', 'OYENTE', 'APROBADO')
        )
      );

      -- Modificación de lecciones: Solo Profesores y Admin
      CREATE POLICY policy_modify_lecciones_jf ON "td_lecciones_jf"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "td_usuario_ahbb" u
          WHERE u.id_usuario_ahbb = NULLIF(current_setting('app.usuario_actual', true), '')::integer
          AND u.rol_ahbb IN ('ADMIN', 'PROFESOR')
        )
      );

      -- Progreso: Profesores/Admin todo. Alumno solo su propio progreso.
      CREATE POLICY policy_progreso_lecciones_jf ON "td_progreso_lecciones_jf"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "td_usuario_ahbb" u
          WHERE u.id_usuario_ahbb = NULLIF(current_setting('app.usuario_actual', true), '')::integer
          AND u.rol_ahbb IN ('ADMIN', 'PROFESOR')
        )
        OR "id_usuario_alumno_jf" = NULLIF(current_setting('app.usuario_actual', true), '')::integer
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "td_usuario_ahbb" u
          WHERE u.id_usuario_ahbb = NULLIF(current_setting('app.usuario_actual', true), '')::integer
          AND u.rol_ahbb IN ('ADMIN', 'PROFESOR')
        )
        OR "id_usuario_alumno_jf" = NULLIF(current_setting('app.usuario_actual', true), '')::integer
      );

      -- 2. Crear trigger de auditoría para lecciones
      CREATE OR REPLACE FUNCTION fn_auditar_lecciones_jf()
      RETURNS TRIGGER AS $$
      DECLARE
        v_usuario VARCHAR(100);
      BEGIN
        v_usuario := COALESCE(NULLIF(current_setting('app.usuario_actual', true), ''), 'SISTEMA');
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, NEW.id_leccion_jf, NULL, to_jsonb(NEW), v_usuario, NOW());
          RETURN NEW;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, NEW.id_leccion_jf, to_jsonb(OLD), to_jsonb(NEW), v_usuario, NOW());
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, OLD.id_leccion_jf, to_jsonb(OLD), NULL, v_usuario, NOW());
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Crear trigger de auditoría para evaluaciones
      CREATE OR REPLACE FUNCTION fn_auditar_evaluaciones_jf()
      RETURNS TRIGGER AS $$
      DECLARE
        v_usuario VARCHAR(100);
      BEGIN
        v_usuario := COALESCE(NULLIF(current_setting('app.usuario_actual', true), ''), 'SISTEMA');
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, NEW.id_evaluacion_jf, NULL, to_jsonb(NEW), v_usuario, NOW());
          RETURN NEW;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, NEW.id_evaluacion_jf, to_jsonb(OLD), to_jsonb(NEW), v_usuario, NOW());
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          INSERT INTO "td_auditoria_multimedia_jf" ("tabla_jf", "operacion_jf", "registro_id_jf", "datos_anteriores_jf", "datos_nuevos_jf", "usuario_jf", "fecha_jf")
          VALUES (TG_TABLE_NAME, TG_OP, OLD.id_evaluacion_jf, to_jsonb(OLD), NULL, v_usuario, NOW());
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Asignar Triggers
      DROP TRIGGER IF EXISTS trg_auditar_lecciones_jf ON "td_lecciones_jf";
      CREATE TRIGGER trg_auditar_lecciones_jf
      AFTER INSERT OR UPDATE OR DELETE ON "td_lecciones_jf"
      FOR EACH ROW EXECUTE FUNCTION fn_auditar_lecciones_jf();

      DROP TRIGGER IF EXISTS trg_auditar_evaluaciones_jf ON "td_evaluaciones_jf";
      CREATE TRIGGER trg_auditar_evaluaciones_jf
      AFTER INSERT OR UPDATE OR DELETE ON "td_evaluaciones_jf"
      FOR EACH ROW EXECUTE FUNCTION fn_auditar_evaluaciones_jf();
    `;

    await client.query(sql);
    console.log('RLS and Audit Triggers registered successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
