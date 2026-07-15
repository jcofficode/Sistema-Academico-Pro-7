# 🎓 AcademiaSenpai — Academia H&B

Sistema integral de gestión académica: cursos certificados, **carreras con
pensum y prelaciones**, **inscripción inteligente por créditos**, **control de
estudios con planes de evaluación parametrizados y actas de seguridad**, tienda
oficial y certificados verificables con QR.

> Proyecto universitario. Sistema base (`_ahbb`) extendido este semestre con el
> **Módulo Académico de Carreras** (`_cjgp` — Coffi, Jorge, Guillermo y Padrino)
> y el **Módulo de Control de Estudios** (`_jc`).
> La explicación técnica detallada de la ampliación está en
> [`READMEEXPLICACION.md`](./READMEEXPLICACION.md).

---

## 🧱 Arquitectura

| Capa | Tecnología |
|---|---|
| **Frontend (SPA)** | Vue 3 + Quasar 2 (Composition API), Axios, Pinia, Vue Router |
| **Backend (API REST)** | NestJS 11 (TypeScript), JWT, class-validator, pdfmake, xlsx |
| **Base de datos** | PostgreSQL + Prisma ORM (migraciones versionadas, stored procedures, triggers y tablas temporales) |

```
frontend (Quasar :9000)  ── Axios/JSON ──►  backend (NestJS :3000/api)  ── Prisma ──►  PostgreSQL
```

## ✨ Módulos principales

- **Gestión de usuarios** con roles (Administrador, Profesor, Alumno) y aprobación de cuentas.
- **Cursos certificados**: horarios, sesiones, inscripciones y certificados PDF con QR verificable.
- **Carreras y Pensums** *(nuevo)*: asistente paso a paso, carga masiva del pensum por Excel, prelaciones visuales.
- **Motor de Reglas Académicas** *(nuevo)*: bloqueo por prelaciones y control del límite de créditos por período.
- **Inscripción de materias** *(nuevo)*: vitrina clara, calculadora de créditos en vivo y mensajes empáticos.
- **Control de Estudios** *(nuevo)*: planes de evaluación configurables por período, carga de notas con columnas dinámicas, ETL/CSV con validación en dos fases, actas PDF (blanca de auditoría y verde de seguridad con hash SHA-256) y reportes con tablas temporales.
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
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # abre http://localhost:9000
```

### 3. Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@academiah-b.edu` | `admin123` |
| Profesor | `carlos@academiah-b.edu` | `prof123` |
| Alumna | `maria@estudiante.edu` | `alum123` |

## 🔐 Seguridad

- **JWT** en todas las rutas privadas + **guards de roles** por endpoint.
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
    control-estudios/   # ★ Planes, notas, ETL/CSV, actas PDF, reportes (_jc)
    auth/ usuarios/ cursos/ inscripciones/ certificados/ tienda/ ...
frontend/
  public/plantillas/    # ★ CSV de ejemplo para la carga masiva
  src/
    pages/admin|alumno|profesor/   # ★ vistas nuevas _cjgp / _jc
    servicios/          # capa Axios por módulo
READMEEXPLICACION.md    # ★ documento técnico de la ampliación (flujo + DER)
```

★ = incorporado en la ampliación de este semestre.
