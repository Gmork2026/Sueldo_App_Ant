# App Sueldo Tabla

Calculadora salarial para trabajadores de seguridad privada basada en el Convenio Colectivo de Trabajo UPSRA 507/07.

## Stack

- **Backend**: FastAPI (Python) + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js + shadcn/ui (próximamente)
- **Deploy**: Railway (backend) + Vercel (frontend)

## Desarrollo

```bash
cd backend
python -m venv venv
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Estructura

```
backend/
├── app/
│   ├── main.py         # FastAPI entry point
│   ├── models/         # SQLAlchemy ORM
│   ├── schemas/        # Pydantic schemas
│   ├── api/            # Route handlers
│   ├── services/       # Business logic
│   └── core/           # Auth, config
├── alembic/            # DB migrations
├── Dockerfile
└── requirements.txt

legacy/                 # Backup del Flet original
txt/                    # Documentos de referencia (convenio, LCT)
```

## Categorías (9)

Vigilador General, Vigilador Bombero, Administrativo, Vigilador Principal, Verificación de Eventos, Operador de Monitoreo, Guía Técnico, Instalador Sist. Electrónicos, Controlador de Admisión.

## Licencia

Uso interno.
