from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
from openpyxl import Workbook

from app.database import get_db
from app.models.employee import Employee
from app.models.timesheet import TimesheetRecord
from app.models.payroll import Payroll
from app.schemas.payroll import PayrollCalculateRequest, PayrollRead
from app.core.deps import CurrentUser, AdminUser

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.post("/calculate", response_model=PayrollRead)
async def calculate_payroll(
    data: PayrollCalculateRequest,
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Employee).where(Employee.id == data.employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    from app.services.salary import SalaryEngine

    engine = SalaryEngine()

    month_str = f"{data.year}-{data.month:02d}"
    ts_result = await db.execute(
        select(TimesheetRecord).where(
            TimesheetRecord.employee_id == data.employee_id,
            TimesheetRecord.date.like(f"{month_str}%"),
        )
    )
    records = ts_result.scalars().all()

    total_hours = sum(float(r.total_hours) for r in records)

    payroll_data = engine.calculate(
        category=employee.category,
        year=data.year,
        month=data.month,
        admission_date=employee.admission_date,
        total_hours=total_hours,
        dias_vacaciones=data.dias_vacaciones,
    )

    existing_result = await db.execute(
        select(Payroll).where(
            Payroll.employee_id == data.employee_id,
            Payroll.month == data.month,
            Payroll.year == data.year,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        for field, value in payroll_data.items():
            setattr(existing, field, value)
        await db.flush()
        await db.refresh(existing)
        return existing

    payroll = Payroll(employee_id=data.employee_id, **payroll_data)
    db.add(payroll)
    await db.flush()
    await db.refresh(payroll)
    return payroll


@router.get("/{employee_id}", response_model=list[PayrollRead])
async def get_payroll(
    employee_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if user.role != "admin":
        emp_result = await db.execute(
            select(Employee).where(
                Employee.id == employee_id, Employee.user_id == user.id
            )
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    result = await db.execute(
        select(Payroll).where(Payroll.employee_id == employee_id)
    )
    return result.scalars().all()


@router.get("/{payroll_id}/export")
async def export_payroll_excel(
    payroll_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payroll).where(Payroll.id == payroll_id))
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Liquidación no encontrada")

    if user.role != "admin":
        emp_result = await db.execute(
            select(Employee).where(
                Employee.id == payroll.employee_id, Employee.user_id == user.id
            )
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Acceso denegado")

    emp_result = await db.execute(
        select(Employee).where(Employee.id == payroll.employee_id)
    )
    employee = emp_result.scalar_one()

    wb = Workbook()
    ws = wb.active
    ws.title = "Liquidación"

    ws.append(["Concepto", "Valor"])
    ws.append(["Empleado", employee.name])
    ws.append(["Categoría", employee.category])
    ws.append(["Período", f"{payroll.month:02d}/{payroll.year}"])
    ws.append([])
    ws.append(["Básico", float(payroll.basic_salary)])
    ws.append(["Antigüedad", f"{payroll.seniority_years} años", float(payroll.seniority_amount)])
    ws.append(["Presentismo", float(payroll.presentismo)])
    ws.append(["Horas Extras", f"{payroll.overtime_hours} hs", float(payroll.overtime_amount)])
    ws.append(["Feriados", f"{payroll.holiday_hours} hs", float(payroll.holiday_amount)])
    ws.append(["Nocturnidad", f"{payroll.night_hours} hs", float(payroll.night_amount)])
    ws.append([])
    ws.append(["Viáticos", float(payroll.viaticos)])
    ws.append(["No Remunerativo", float(payroll.non_remunerative)])
    ws.append([])
    ws.append(["BRUTO", float(payroll.gross_salary)])
    ws.append(["Retenciones", float(payroll.deductions)])
    ws.append(["NETO A COBRAR", float(payroll.net_salary)])

    if payroll.sac_bruto > 0:
        ws.append([])
        ws.append(["SAC Bruto", float(payroll.sac_bruto)])
        ws.append(["SAC Descuentos", float(payroll.sac_deducciones)])
        ws.append(["SAC Neto", float(payroll.sac_neto)])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"liquidacion_{employee.name.replace(' ', '_')}_{payroll.month:02d}_{payroll.year}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
