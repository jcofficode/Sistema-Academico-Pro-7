-- ============================================================
-- SP: fn_generar_sesiones_curso_ahbb
-- Genera las sesiones individuales de un curso respetando
-- el tope de 3 horas diarias de clase y la disponibilidad del profesor.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generar_sesiones_curso_ahbb(
    p_id_curso      INT,
    p_fecha_inicio  DATE,
    p_dias_semana   TEXT[],
    p_horas_inicio  TEXT[], -- Array de horas de inicio por día
    p_horas_fin     TEXT[],    -- Array de horas de fin por día
    p_total_horas   NUMERIC
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha_actual      DATE;
    v_nombre_dia        TEXT;
    v_inicio_time       TIME;
    v_fin_time          TIME;
    v_horas_bloque      NUMERIC;       
    v_horas_sesion      NUMERIC;       
    v_hora_fin_real     TIME;          
    v_horas_acumuladas  NUMERIC := 0;
    v_nro_sesion        INT := 0;
    v_dia_dow          INT;            
    v_nombres_dow       TEXT[] := ARRAY['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];
    v_max_iter          INT := 0;
    v_idx_dia           INT;
BEGIN
    -- Eliminar sesiones previas del curso
    DELETE FROM td_sesion_curso_ahbb WHERE id_curso_sesion_ahbb = p_id_curso;

    v_fecha_actual := p_fecha_inicio;

    WHILE v_horas_acumuladas < p_total_horas AND v_max_iter < 2000 LOOP
        v_max_iter := v_max_iter + 1;

        v_dia_dow    := EXTRACT(DOW FROM v_fecha_actual)::INT;  
        v_nombre_dia := v_nombres_dow[v_dia_dow + 1];           

        -- Iterar por todos los bloques configurados para ver si alguno coincide con el día actual
        FOR i IN 1..array_length(p_dias_semana, 1) LOOP
            -- Salir si ya completamos las horas en un bloque anterior del mismo día o de días previos
            IF v_horas_acumuladas >= p_total_horas THEN
                EXIT;
            END IF;

            IF p_dias_semana[i] = v_nombre_dia THEN
                v_inicio_time := p_horas_inicio[i]::TIME;
                v_fin_time    := p_horas_fin[i]::TIME;

                -- Manejo de medianoche (00:00 = 24:00)
                IF v_fin_time = '00:00:00'::TIME THEN
                    v_horas_bloque := CAST(EXTRACT(EPOCH FROM ('24:00:00'::INTERVAL - v_inicio_time::INTERVAL)) / 3600.0 AS NUMERIC);
                ELSEIF v_fin_time < v_inicio_time THEN
                    v_horas_bloque := CAST((EXTRACT(EPOCH FROM (v_fin_time - v_inicio_time)) / 3600.0) + 24.0 AS NUMERIC);
                ELSE
                    v_horas_bloque := CAST(EXTRACT(EPOCH FROM (v_fin_time - v_inicio_time)) / 3600.0 AS NUMERIC);
                END IF;

                -- Aplicar tope de 3 horas por bloque o la disponibilidad real (lo menor)
                -- Nota: El tope de 3 horas diarias totales se valida en el backend (TS)
                v_horas_sesion := LEAST(v_horas_bloque, CAST(3.0 AS NUMERIC));

                DECLARE
                    v_horas_restantes   NUMERIC;
                    v_horas_esta_sesion NUMERIC;
                BEGIN
                    v_horas_restantes := p_total_horas - v_horas_acumuladas;
                    v_horas_esta_sesion := LEAST(v_horas_sesion, v_horas_restantes);

                    -- DOBLE CHEQUEO DE SEGURIDAD PARA EL TOPE DE 3 HORAS POR SESION
                    IF v_horas_esta_sesion > 3.0 THEN
                        v_horas_esta_sesion := 3.0;
                    END IF;

                    IF v_horas_esta_sesion > 0 THEN
                        v_nro_sesion := v_nro_sesion + 1;
                        v_hora_fin_real := v_inicio_time + (v_horas_esta_sesion * INTERVAL '1 hour');

                        INSERT INTO td_sesion_curso_ahbb (
                            "nroSesion_ahbb",
                            "fechaSesion_ahbb",
                            "horaInicio_ahbb",
                            "horaFin_ahbb",
                            "horasDuracion_ahbb",
                            "diaSemana_ahbb",
                            "id_curso_sesion_ahbb"
                        ) VALUES (
                            v_nro_sesion,
                            v_fecha_actual,
                            TO_CHAR(v_inicio_time, 'HH24:MI'),
                            TO_CHAR(v_hora_fin_real, 'HH24:MI'),
                            v_horas_esta_sesion,
                            v_nombre_dia,
                            p_id_curso
                        );

                        v_horas_acumuladas := v_horas_acumuladas + v_horas_esta_sesion;
                    END IF;
                END;
            END IF;
        END LOOP;

        -- Si es la primera iteración y no se generó ninguna sesión, la fecha de inicio es inválida
        IF v_max_iter = 1 AND v_nro_sesion = 0 THEN
            RAISE EXCEPTION 'Incoherencia: La fecha de inicio del curso (%) no coincide con ningun dia de clase configurado (%).', v_fecha_actual, p_dias_semana;
        END IF;

        v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
    END LOOP;

    RETURN v_nro_sesion;
END;
$$;
