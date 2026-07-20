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

frontend/         ← Next.js (React) — Vercel
(Phase 3+)

legacy/           ← Backup of original Flet app (main.py)
```

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

## Dependencies

- Python venv in root `venv/` (gitignored)
- Backend: `pip install -r backend/requirements.txt`
- Key deps: `fastapi>=0.139.0`, `sqlalchemy[asyncio]>=2.0.51`, `asyncpg>=0.29.0`, `pyjwt>=2.13.0`, `passlib[bcrypt]>=1.7.4`, `openpyxl>=3.1.0`, `holidays>=0.95`

## Database

PostgreSQL. Schema managed by Alembic. Tables: `users`, `employees`, `timesheet_records`, `payrolls`.

## Auth

JWT (PyJWT) in httpOnly cookies. Roles: `admin` (full access) / `employee` (own data only). Passwords hashed with bcrypt.

## Conventions

- Spanish identifiers and comments
- `legacy/main.py` = original Flet app (reference, don't edit)
- `txt/main.py.txt` = older backup
