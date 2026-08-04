# 🧪 Manual de Pruebas Integradas E2E — Sistema Académico Pro-7 (UNE)

Este documento guía al equipo de desarrollo y QA en la ejecución secuencial e integrada de pruebas manuales de aceptación (UAT) a lo largo del flujo de negocio institucional de la Universidad (UNE).

---

## 📌 Flujo 1: Administración de Carreras y Pensum (`_cjgp`)

- [ ] **1.1 Iniciar Sesión como Administrador**
  - **Acción**: Ingresar a `http://localhost:9000/#/login` con credenciales de Administrador.
  - **Verificación UI**: Confirmar la presencia de la barra superior institucional (UNE, insignia del rol `ADMINISTRADOR`) y menú lateral desplegable sin llamadas `prompt()`.

- [ ] **1.2 Creación / Verificación de Oferta Académica**
  - **Acción**: Navegar a *Carreras (CJGP)* (`/admin/carreras`).
  - **Verificación UI**: Validar la lista de carreras activas (ej: *Ingeniería en Informática* - Código `INF`).
  - **Verificación DB**: Comprobar registros en la tabla `td_carrera_cjgp`.

- [ ] **1.3 Asignación de Materias y Profesores**
  - **Acción**: Verificar que las materias (`MAT1`, `PRG1`, `BD1`) tengan profesor asignado (ej: `Carlos Mendez`, ID: 2).
  - **Verificación DB**: Consultar `td_materia_cjgp` registrando los atributos `id_profesor_materia_cjgp` e `id_carrera_materia_cjgp`.

---

## 💳 Flujo 2: Registro de Pagos y Guardián de Solvencia (`_ap`)

- [ ] **2.1 Configuración de Tarifas Institucionales**
  - **Acción**: Navegar a *Tarifas de Pago* (`/admin/pagos/tarifas`).
  - **Verificación UI**: Confirmar la existencia de la tarifa activa para el período `2026-II`.
  - **Verificación DB**: Verificar registro en `td_tarifa_ap`.

- [ ] **2.2 Prueba del Guardián de Solvencia (Bloqueo de Morosos)**
  - **Acción**: Iniciar sesión como alumno no solvente (ej: `javier@estudiante.edu`) e intentar inscribir materia en `/alumno/inscripcion-materias`.
  - **Verificación UI**: Confirmar que la interfaz muestre el aviso emergente de morosidad (bloqueo HTTP 400 + banner naranja de insolvencia).
  - **Verificación DB**: Confirmar inexistencia de pago en estado `CONFIRMADO` en `td_pago_ap`.

- [ ] **2.3 Registro y Confirmación de Pago de Alumno**
  - **Acción**: En `/alumno/mis-pagos`, subir comprobante de pago. Luego, desde la cuenta de Administrador en `/admin/pagos/confirmar`, aprobar el pago.
  - **Verificación DB**: Verificar que el estatus en `td_pago_ap` cambie a `CONFIRMADO`.

- [ ] **2.4 Inscripción Exitosa post-Solvencia**
  - **Acción**: Volver a la cuenta del alumno y completar la inscripción de materias (`BD1 — Base de Datos I`).
  - **Verificación DB**: Confirmar creación de registro atómico en `td_inscripcion_materia_cjgp`.

---

## 📋 Flujo 3: Planificación Académica Curricular (`_ga`)

- [ ] **3.1 Configuración Curricular Global**
  - **Acción**: Desde la cuenta de Administrador, ingresar a *Configuración Curricular* (`/admin/plan-estudio/configuracion-curricular`).
  - **Verificación UI**: Validar que la configuración esté fijada en **2 Lapsos**, máx. **4 Evaluaciones** por lapso y formato `CUANTITATIVO`.
  - **Verificación DB**: Confirmar actualización en `td_configuracion_curricular_ga`.

- [ ] **3.2 Elaboración del Plan por el Docente**
  - **Acción**: Iniciar sesión como Profesor (`carlos.mendez@profesor.edu`) y navegar a *Elaborar Plan de Estudio* (`/profesor/plan-estudio`).
  - **Verificación UX**:
    - [ ] Probar autoguardado en borrador local (`localStorage` / Pinia store `planificacionStore_ga`).
    - [ ] Adjuntar archivo oficial PDF/DOCX (`programaUrl_ga`) y verificar subida inmediata.
    - [ ] Cargar cronograma desde plantilla Excel (.xlsx) y validar autocompletado en pantalla.
    - [ ] Intentar guardar con un lapso que sume menos o más del 100%: verificar bloqueo visual y aviso de alerta.
  - **Acción Final**: Completar 2 evaluaciones de 50% cada una en Lapso 1 y Lapso 2 (sumando 100%) y presionar **Guardar y Entregar Planificación**.
  - **Verificación DB**: Confirmar que en `td_planificaciones_ga` el estado cambie a `ENTREGADO` y que `td_actividades_evaluacion_ga` almacene las 4 evaluaciones dentro de la transacción atómica `prisma.$transaction`.

- [ ] **3.3 Bandeja de Revisión y Aprobación Institucional**
  - **Acción**: Entrar como Administrador a *Bandeja de Revisión* (`/admin/plan-estudio/bandeja`) y presionar **Aprobar Plan**.
  - **Verificación DB**: Verificar cambio de estado en `td_planificaciones_ga` a `APROBADO` y registro en `td_revisiones_plan_ga`.

- [ ] **3.4 Consulta de Solo Lectura por el Alumno**
  - **Acción**: Iniciar sesión como Alumno (`maria@estudiante.edu`) y navegar a *Planes de Estudio* (`/alumno/planes-estudio`).
  - **Verificación UI**:
    - [ ] Confirmar visualización del botón para descargar el programa en PDF.
    - [ ] Confirmar la matriz de solo lectura con las 4 evaluaciones (2 por lapso) y la etiqueta informativa `2 de 4 máx.`.
    - [ ] Confirmar la ausencia absoluta de botones de edición o guardado.

---

## 🎥 Flujo 4: Aula Virtual y Lecciones Multimedia (`_jf`)

- [ ] **4.1 Configuración de Lecciones por el Profesor**
  - **Acción**: En `/profesor/cursos-multimedia`, crear lecciones con video adjunto y sala de clase en vivo.
  - **Verificación DB**: Confirmar creación de bloques en `td_bloques_jf` y lecciones en `td_lecciones_jf`.

- [ ] **4.2 Reproducción y Video Streaming por el Alumno**
  - **Acción**: Ingresar a `/alumno/aula-virtual` como alumno e iniciar la reproducción de una lección.
  - **Verificación Técnica**:
    - [ ] Inspeccionar en las herramientas de desarrollo del navegador (F12 -> Network) que el video responda con estado `HTTP 206 Partial Content` (streaming por rangos).
    - [ ] Unirse a la clase sincrónica y verificar la carga del IFrame interactivo de **Jitsi Meet**.

---

## ⚖️ Flujo 5: Control de Estudios, Contingencia y Actas (`_jc` / `_ga`)

- [ ] **5.1 Asentamiento de Nota por Contingencia (`_ga`)**
  - **Acción**: Iniciar sesión como Jefe de Control de Estudios e ingresar a *Nota por Contingencia* (`/control-estudios/contingencia`).
  - **Ejecución**: Seleccionar Materia (`MAT1`), Período (`2026-II`), Alumno (`Maria Garcia`), nota (`18 pts`) y motivo justificativo. Presionar **Registrar Nota por Contingencia**.
  - **Verificación DB**:
    - [ ] Validar actualización inmediata de `notaFinal_cjgp` a `18` y `estatus_cjgp` a `APROBADO` en `td_inscripcion_materia_cjgp`.
    - [ ] Confirmar registro de la auditoría obligatoria en `td_auditoria_jc` con acción `NOTA_CONTINGENCIA_REGISTRADA`.

- [ ] **5.2 Carga Masiva de Notas CSV y Cierre de Actas (`_jc`)**
  - **Acción**: En `/control-estudios/carga-notas`, subir archivo CSV consolidado con calificaciones finales.
  - **Verificación UI**: Confirmar barra de progreso y resumen de registros procesados.
  - **Verificación DB**: Confirmar volcado de datos usando tabla temporal `tmp_rendimiento_jc` y generación de acta con hash **SHA-256**.

---

## 📌 Checklist de Conformidad Técnica Final

- [ ] Todos los botones e inputs utilizan componentes de Quasar Framework (`q-card`, `q-select`, `q-btn`, `q-input`).
- [ ] La interfaz responsive se adapta limpiamente utilizando clases utilitarias de Tailwind CSS.
- [ ] No existen modales o llamadas invasivas `prompt()` de JavaScript puro.
- [ ] Cada operación de escritura en base de datos ejecuta transacciones ACID aisladas con Prisma ORM (`prisma.$transaction`).
- [ ] El código mantiene estricta separación de responsabilidades en módulos (`_cjgp`, `_ap`, `_ga`, `_jf`, `_jc`).
