from datetime import datetime
import holidays as ar_holidays
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

feriados_arg = ar_holidays.country_holidays("AR")


def calc_hours(entry: str | None, exit: str | None) -> float:
    if not entry or not exit:
        return 0.0
    try:
        fmt = "%H:%M"
        e = datetime.strptime(entry, fmt)
        x = datetime.strptime(exit, fmt)
        diff = (x - e).total_seconds() / 3600
        return round(max(diff, 0), 2)
    except ValueError:
        return 0.0


def detect_holiday(date_str: str) -> tuple[bool, str | None]:
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return False, None
    if d in feriados_arg:
        name = ar_holidays.country_holidays("AR").get(d, None)
        return True, name or "Feriado"
    return False, None


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

    update_data = data.model_dump()

    if not data.is_franco and data.entry_time and data.exit_time and not data.total_hours:
        update_data["total_hours"] = calc_hours(data.entry_time, data.exit_time)

    if not data.is_holiday and not data.is_franco:
        is_h, h_name = detect_holiday(data.date)
        if is_h:
            update_data["is_holiday"] = True
            update_data["holiday_name"] = h_name

    if existing:
        for field, value in update_data.items():
            if field != "employee_id":
                setattr(existing, field, value)
        await db.flush()
        await db.refresh(existing)
        return existing

    record = TimesheetRecord(**update_data)
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

    update_data = data.model_dump(exclude_unset=True)

    entry = update_data.get("entry_time", record.entry_time)
    exit_t = update_data.get("exit_time", record.exit_time)
    is_franco = update_data.get("is_franco", record.is_franco)
    if not is_franco and entry and exit_t and "total_hours" not in update_data:
        update_data["total_hours"] = calc_hours(entry, exit_t)

    for field, value in update_data.items():
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
