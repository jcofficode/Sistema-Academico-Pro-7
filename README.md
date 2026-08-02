# 🎓 AcademiaSenpai — Academia H&B

Sistema integral de gestión académica: cursos certificados, **carreras con
pensum y prelaciones**, **inscripción inteligente por créditos**, **control de
estudios con planes de evaluación parametrizados y actas de seguridad**, tienda
oficial y certificados verificables con QR.

> Proyecto universitario. Sistema base (`_ahbb`) extendido este semestre con
> **seis módulos nuevos**:
>
> | Módulo                                                           |  Sufijo  | Documento                                                                     |
> | ----------------------------------------------------------------- | :-------: | ----------------------------------------------------------------------------- |
> | Carreras y Pensums · Motor de Reglas · Inscripción*(grupal)* | `_cjgp` | [READMEEXPLICACION.md](./READMEEXPLICACION.md)                                 |
> | Control de Estudios · Auditoría · RBAC*(individual)*         |  `_jc`  | [READMEEXPLICACION-CONTROLESTUDIOS.md](./READMEEXPLICACION-CONTROLESTUDIOS.md) |
> | Cursos Multimedia y Videollamadas                                 |  `_jf`  | [READMEEXPLICACION-MULTIMEDIA.md](./READMEEXPLICACION-MULTIMEDIA.md)           |
> | Sistema de Pagos y Nómina                                        |  `_ap`  | [READMEEXPLICACION-PAGOS.md](./READMEEXPLICACION-PAGOS.md)                     |
> | Plan de Estudio (Planificación)                                  |  `_ga`  | [READMEEXPLICACION-PLANESTUDIO.md](./READMEEXPLICACION-PLANESTUDIO.md)         |

---

## 🧱 Arquitectura

| Capa                         | Tecnología                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **Frontend (SPA)**     | Vue 3 + Quasar 2 (Composition API), Axios, Pinia, Vue Router                                       |
| **Backend (API REST)** | NestJS 11 (TypeScript), JWT, class-validator, pdfmake, xlsx                                        |
| **Base de datos**      | PostgreSQL + Prisma ORM (migraciones versionadas, stored procedures, triggers y tablas temporales) |

```
frontend (Quasar :9000)  ── Axios/JSON ──►  backend (NestJS :3000/api)  ── Prisma ──►  PostgreSQL
```

## ✨ Módulos principales

- **Gestión de usuarios** con roles (Administrador, **Control de Estudios**, Profesor, Alumno), consola **RBAC** y aprobación de cuentas.
- **Auditoría del sistema**: bitácora de quién hizo qué, cuándo y sobre quién, alimentada por un interceptor global.
- **Cursos certificados**: horarios, sesiones, inscripciones y certificados PDF con QR verificable.
- **Carreras y Pensums** *(nuevo)*: asistente paso a paso, carga masiva del pensum por Excel, prelaciones visuales.
- **Motor de Reglas Académicas** *(nuevo)*: bloqueo por prelaciones y control del límite de créditos por período.
- **Inscripción de materias** *(nuevo)*: vitrina clara, calculadora de créditos en vivo y mensajes empáticos.
- **Control de Estudios** *(nuevo)*: planes de evaluación configurables por período, carga de notas con columnas dinámicas, **reparaciones por corte**, ETL/CSV con validación en dos fases, acta oficial en PDF con hash SHA-256, **certificados de sobresaliente** con QR verificable y reportes con tablas temporales.
- **Cursos Multimedia y Videollamadas** *(nuevo)*: aula virtual con bloques y lecciones secuenciales, video por streaming con rangos HTTP, evaluaciones con intentos limitados y clases en vivo con Jitsi.
- **Pagos y Nómina** *(nuevo)*: aranceles, pago móvil con confirmación administrativa, **solvencia obligatoria para inscribir**, contratos docentes, nómina del período y recibos PDF verificables.
- **Plan de Estudio** *(nuevo)*: plantillas institucionales por período, elaboración del plan por el profesor, bandeja de revisión y reporte de cumplimiento.
- **Tienda oficial** (e-commerce) con carrito, favoritos y facturación.

## 🚀 Puesta en marcha

### Requisitos

- Node.js ≥ 22 · npm ≥ 10
- PostgreSQL ≥ 14 corriendo en local

### 1. Backend

```bash
cd backend
npm install
```

Crear `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/academiasenpai_ahbb?schema=public"
PORT=3000
MAIL_USER=        # opcional (envío de correos)
MAIL_PASS=        # opcional
```

```bash
npm run start:dev
```

El arranque es autosuficiente: crea la base de datos si no existe, aplica las
migraciones, genera el cliente Prisma, instala el stored procedure y siembra
los usuarios base. Al final verás `Nest application successfully started`.

**Datos académicos de demostración** (carrera INF con profesores asignados,
períodos, plan de evaluación, inscripciones y notas):

```bash
npm run seed:academico     # siembra sin borrar nada
npm run reset:academico    # ⭐ reinicia el módulo académico al estado limpio
                           #    de la ruta de prueba (no toca usuarios/cursos/tienda)
npm run seed:pagos         # ⭐ deja a María SOLVENTE (requisito para inscribir)
node scripts/seed-multimedia_jf.cjs   # curso multimedia de prueba (_jf)
```

> Desde el módulo de Pagos, **inscribir materias exige un pago `CONFIRMADO` del
> período**. Ejecuta `seed:pagos` después de `reset:academico` para reproducir
> la ruta de prueba tal cual está documentada.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # abre http://localhost:9000
```

### 3. Credenciales de demostración

| Rol                           | Correo                      | Contraseña    |
| ----------------------------- | --------------------------- | -------------- |
| Administrador                 | `admin@academiah-b.edu`   | `admin123`   |
| **Control de Estudios** | `control@academiah-b.edu` | `control123` |
| Profesor                      | `carlos@academiah-b.edu`  | `prof123`    |
| Alumna                        | `maria@estudiante.edu`    | `alum123`    |

## 🔐 Seguridad

- **JWT** en todas las rutas privadas + **guards de roles** por endpoint, sobre un catálogo único de roles.
- **Separación de funciones**: el administrador configura y supervisa, pero **no asigna notas ni emite actas**; eso corresponde al profesor y a Control de Estudios.
- **Bitácora de auditoría** de toda operación que modifica datos (nunca registra credenciales).
- **DTOs con class-validator** y `ValidationPipe` global (previene datos maliciosos).
- **CORS** restringido a los orígenes del frontend.
- **Constraints** de integridad en PostgreSQL + transacciones Prisma.
- Actas con **hash SHA-256** registrado (respaldo digital inalterable).
- Credenciales solo en `.env` (nunca en el código).
- **Despliegue recomendado**: NestJS detrás de un **proxy inverso Nginx** que
  termine SSL (HTTPS) y mitigue ataques DoS básicos; el puerto 3000 no se
  expone directamente a Internet.

## 📂 Estructura del repositorio

```
backend/
  prisma/               # schema + migraciones versionadas
  scripts/              # init BD, seeds, stored procedures
  src/
    academico/          # ★ Carreras, períodos, motor de reglas, inscripción (_cjgp)
    control-estudios/   # ★ Planes, notas, reparaciones, actas, certificados (_jc)
    auditoria/          # ★ Bitácora del sistema e interceptor global (_jc)
    rbac/               # ★ Consola de Roles y Accesos (_jc)
    multimedia/         # ★ Aula virtual, streaming, videollamadas (_jf)
    pagos/              # ★ Tarifas, pagos, solvencia, contratos, nómina (_ap)
    plan-estudio/       # ★ Plantillas, planes por materia, revisión (_ga)
    auth/ usuarios/ cursos/ inscripciones/ certificados/ tienda/ ...
frontend/
  public/plantillas/    # ★ CSV de ejemplo para la carga masiva
  src/
    pages/admin|alumno|profesor/     # ★ vistas nuevas _cjgp / _jc / _jf / _ap / _ga
    pages/control-estudios/          # ★ auditoría académica y certificados (_jc)
    servicios/          # capa Axios por módulo
READMEEXPLICACION.md              # ★ módulo grupal _cjgp (carreras, motor de reglas, inscripción)
READMEEXPLICACION-CONTROLESTUDIOS.md  # ★ módulo individual _jc
READMEEXPLICACION-MULTIMEDIA.md   # ★ módulo _jf
READMEEXPLICACION-PAGOS.md        # ★ módulo _ap
READMEEXPLICACION-PLANESTUDIO.md  # ★ módulo _ga
```

★ = incorporado en la ampliación de este semestre.
