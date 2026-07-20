from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.timesheet import TimesheetRecord
from app.schemas.timesheet import (
    TimesheetRecordCreate,
    TimesheetRecordUpdate,
    TimesheetRecordRead,
)
from app.core.deps import CurrentUser, AdminUser

router = APIRouter(prefix="/api/timesheet", tags=["timesheet"])


@router.get("/{employee_id}", response_model=list[TimesheetRecordRead])
async def get_timesheet(
    employee_id: int,
    month: int,
    year: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        from app.models.employee import Employee
        emp_result = await db.execute(
            select(Employee).where(Employee.id == employee_id, Employee.user_id == user.id)
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    month_str = f"{year}-{month:02d}"
    result = await db.execute(
        select(TimesheetRecord)
        .where(
            TimesheetRecord.employee_id == employee_id,
            TimesheetRecord.date.like(f"{month_str}%"),
        )
        .order_by(TimesheetRecord.date)
    )
    return result.scalars().all()


@router.post("", response_model=TimesheetRecordRead)
async def create_or_update_record(
    data: TimesheetRecordCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        from app.models.employee import Employee
        emp_result = await db.execute(
            select(Employee).where(
                Employee.id == data.employee_id, Employee.user_id == user.id
            )
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    result = await db.execute(
        select(TimesheetRecord).where(
            TimesheetRecord.employee_id == data.employee_id,
            TimesheetRecord.date == data.date,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        for field, value in data.model_dump().items():
            if field != "employee_id":
                setattr(existing, field, value)
        await db.flush()
        await db.refresh(existing)
        return existing

    record = TimesheetRecord(**data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.put("/{record_id}", response_model=TimesheetRecordRead)
async def update_record(
    record_id: int,
    data: TimesheetRecordUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TimesheetRecord).where(TimesheetRecord.id == record_id)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    if user.role != "admin":
        from app.models.employee import Employee
        emp_result = await db.execute(
            select(Employee).where(
                Employee.id == record.employee_id, Employee.user_id == user.id
            )
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record


@router.delete("/{record_id}")
async def delete_record(record_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TimesheetRecord).where(TimesheetRecord.id == record_id)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    if user.role != "admin":
        from app.models.employee import Employee
        emp_result = await db.execute(
            select(Employee).where(
                Employee.id == record.employee_id, Employee.user_id == user.id
            )
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    await db.delete(record)
    await db.flush()
    return {"ok": True}
