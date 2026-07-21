from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeRead
from app.core.deps import CurrentUser, AdminUser

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeRead])
async def list_employees(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if user.role in ("admin", "superadmin"):
        result = await db.execute(select(Employee).where(Employee.active == True))
    else:
        result = await db.execute(
            select(Employee).where(Employee.user_id == user.id)
        )
    return result.scalars().all()


@router.post("", response_model=EmployeeRead)
async def create_employee(data: EmployeeCreate, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Employee).where(Employee.dni == data.dni))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya existe un empleado con ese DNI")

    employee = Employee(**data.model_dump())
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(employee_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()

    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    if user.role != "admin" and employee.user_id != user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    return employee


@router.put("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()

    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)

    await db.flush()
    await db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
async def delete_employee(employee_id: int, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()

    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    employee.active = False
    await db.flush()
    return {"ok": True, "detail": "Empleado desactivado"}
