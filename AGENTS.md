# SueldoYa — AGENTS.md

## App

SueldoYa - Argentine salary calculator for private security workers. Backend/Frontend architecture.

## Architecture

```
backend/          ← FastAPI (Python) — Railway
├── app/
│   ├── main.py         # FastAPI entry point, CORS, routers
│   ├── config.py       # Pydantic Settings (env vars)
│   ├── database.py     # Async SQLAlchemy engine + session
│   ├── models/         # SQLAlchemy ORM (User, Employee, TimesheetRecord, Payroll)
│   ├── schemas/        # Pydantic request/response
│   ├── api/            # Route handlers (auth, employees, timesheet, payroll)
│   ├── services/       # Business logic (salary engine, holidays)
│   └── core/           # Security (JWT), dependencies (auth, roles)
├── alembic/            # DB migrations
├── Dockerfile
└── requirements.txt

frontend/         ← Next.js 16 (React) — Vercel
├── app/
│   ├── page.tsx          # Root redirect (auth check → /empleados or /login)
│   ├── layout.tsx        # Root layout with AuthProvider
│   ├── login/page.tsx    # Login form with Logo
│   ├── empleados/page.tsx    # Employee CRUD (admin)
│   ├── fichadas/page.tsx     # Timesheet records per employee
│   ├── liquidaciones/page.tsx # Payroll calculation + export
│   └── importar/page.tsx     # Excel import (admin)
├── components/
│   ├── AppLayout.tsx     # Auth guard + Sidebar wrapper
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── Logo.tsx          # SueldoYa logo component
├── lib/
│   ├── api.ts            # API client (fetch wrapper)
│   ├── auth.tsx          # Auth context + useAuth hook
│   └── types.ts          # TypeScript interfaces
└── .env.local            # NEXT_PUBLIC_API_URL (gitignored)

legacy/           ← Backup of original Flet app (main.py, don't edit)
txt/              ← Salary scale reference files
```

## Frontend — Logo

**File:** `frontend/components/Logo.tsx`

Logo format: **Sueldo⚡ YA**
- "SUELDO" → cyan, italic, bold (`text-cyan-400`)
- "⚡" → yellow-300, NOT italic, largest element (one size bigger than YA), with glow
- "YA" → yellow-400, NOT italic, bold

Size tiers (sm/md/lg):
| Part | sm | md | lg |
|------|----|----|-----|
| SUELDO | text-lg | text-2xl | text-4xl |
| YA | text-xl | text-3xl | text-5xl |
| ⚡ | text-2xl | text-4xl | text-6xl |

**Design decisions:**
- ⚡ is the largest element, positioned between SUELDO and YA
- Drop shadow glow on ⚡: `drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]`
- `items-baseline` alignment for all three parts
- Logo appears in: sidebar (md), login page (lg)

## Frontend — Run

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## Frontend — Deploy (Vercel)

1. Connect GitHub repo `Gmork2026/Sueldo_App_Ant` to Vercel
2. Root directory: `frontend`
3. Env var: `NEXT_PUBLIC_API_URL` = `https://sueldoappant-production.up.railway.app`
4. Framework: Next.js (auto-detected)
5. Auto-deploys from `main` branch on push

## Backend — Deploy (Railway)

- Dockerfile at repo root (`Dockerfile`)
- Entrypoint: `backend/entrypoint.sh` (runs alembic + uvicorn)
- Health check: `GET /api/health`
- Env vars required:
  - `DATABASE_URL` (asyncpg format)
  - `DATABASE_URL_SYNC` (psycopg2 format)
  - `JWT_SECRET`
  - `CORS_ORIGINS` = `["http://localhost:3000","http://localhost:5173","https://sueldo-ya.vercel.app"]`

## Backend — Run

```bash
cd backend
# First time: python -m venv venv && pip install -r requirements.txt
# Copy .env.example to .env, configure DATABASE_URL and JWT_SECRET
.\venv\Scripts\activate    # Windows
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

## Backend — API Endpoints (16)

```
POST   /api/auth/register       → Create user (admin only)
POST   /api/auth/login          → JWT token (httpOnly cookie)
GET    /api/auth/me             → Current user
POST   /api/auth/logout         → Clear cookie

GET    /api/employees           → List employees
POST    /api/employees           → Create (admin)
GET    /api/employees/{id}      → Get one
PUT    /api/employees/{id}      → Update (admin)
DELETE /api/employees/{id}      → Soft delete (admin)

POST   /api/import/employees/preview  → Preview Excel import (validate)
POST   /api/import/employees/execute  → Execute Excel import

GET    /api/timesheet/{emp}?month=&year=  → Monthly records
POST   /api/timesheet           → Create/update daily record
PUT    /api/timesheet/{id}      → Update record
DELETE /api/timesheet/{id}      → Delete record

POST   /api/payroll/calculate   → Calculate payroll
GET    /api/payroll/{emp}       → Get payroll history
GET    /api/payroll/{id}/export → Download Excel

GET    /api/health              → Health check
GET    /api/categories          → List 9 categories
```

## Salaries

Scales hardcoded in `backend/app/services/salary.py` (Jan–Dec 2026). Adding months requires editing the dict. Reference scales in `txt/UPSRA Convenio de salarios.txt` and `txt/Upsra_Convenio_6MFin_de_año.txt`.

Categories (9):
1. Vigilador General
2. Vigilador Bombero
3. Administrativo
4. Vigilador Principal
5. Verificación de Eventos
6. Operador de Monitoreo
7. Guía Técnico
8. Instalador Sist. Electrónicos
9. Controlador de Admisión y Permanencia General

## Dependencies

- Python venv in root `venv/` (gitignored)
- Backend: `pip install -r backend/requirements.txt`
- Key deps: `fastapi>=0.139.0`, `sqlalchemy[asyncio]>=2.0.51`, `asyncpg>=0.29.0`, `pyjwt>=2.13.0`, `passlib[bcrypt]>=1.7.4`, `openpyxl>=3.1.0`, `holidays>=0.95`
- Frontend: `next@16.2.10`, `react@19.2.4`, `tailwindcss@4`

## Database

PostgreSQL (Railway). Schema managed by Alembic. Tables: `users`, `employees`, `timesheet_records`, `payrolls`.

## Auth

JWT (PyJWT) in httpOnly cookies. Roles: `admin` (full access) / `employee` (own data only). Passwords hashed with bcrypt.

## Conventions

- Spanish identifiers and comments
- `legacy/main.py` = original Flet app (reference, don't edit)
- `txt/main.py.txt` = older backup
- `.env.local` is gitignored — production env vars go in Vercel/Railway dashboards
