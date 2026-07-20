from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api import auth_router, employees_router, timesheet_router, payroll_router
from app.api.import_routes import router as import_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(timesheet_router)
app.include_router(payroll_router)
app.include_router(import_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/categories")
async def list_categories():
    from app.services.salary import SalaryEngine
    engine = SalaryEngine()
    return {"categories": engine.CATEGORIES}
