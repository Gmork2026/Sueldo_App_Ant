from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import AdminUser
from app.services.import_excel import preview_import, execute_import

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/employees/preview")
async def import_preview(
    admin: AdminUser,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel (.xlsx, .xls)")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo no puede superar 10MB")

    try:
        result = await preview_import(content, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

    return result


@router.post("/employees/execute")
async def import_execute(
    skip_errors: bool = True,
    admin: AdminUser = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel (.xlsx, .xls)")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo no puede superar 10MB")

    try:
        result = await execute_import(content, db, skip_errors=skip_errors)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al importar: {str(e)}")

    return result
