from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import get_settings
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schemas.auth import (
    UserCreate, UserLogin, UserRead, TokenResponse,
    RegisterByDNI, ChangePassword,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.deps import AdminUser, SuperAdminUser, CurrentUser

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserRead)
async def register(data: UserCreate, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    if data.employee_id:
        emp_result = await db.execute(select(Employee).where(Employee.id == data.employee_id))
        emp = emp_result.scalar_one_or_none()
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        if emp.user_id is not None:
            raise HTTPException(status_code=400, detail="Este empleado ya tiene una cuenta de usuario")

    existing = await db.execute(select(User).where(User.email == data.email))
    existing_user = existing.scalar_one_or_none()

    if existing_user:
        if data.employee_id:
            emp.user_id = existing_user.id
            await db.flush()
            return existing_user
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    if data.employee_id:
        emp_result = await db.execute(select(Employee).where(Employee.id == data.employee_id))
        emp = emp_result.scalar_one_or_none()
        if emp:
            emp.user_id = user.id
            await db.flush()

    return user


@router.post("/register-by-dni", response_model=UserRead)
async def register_by_dni(data: RegisterByDNI, db: AsyncSession = Depends(get_db)):
    dni_clean = data.dni.replace(".", "").replace(",", "").strip()
    result = await db.execute(
        select(Employee).where(Employee.dni == dni_clean, Employee.active == True)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="No se encontró un empleado activo con ese DNI")

    if employee.user_id is not None:
        raise HTTPException(status_code=400, detail="Este empleado ya tiene una cuenta de usuario asociada")

    existing_user = await db.execute(select(User).where(User.email == data.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role="employee",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    employee.user_id = user.id
    await db.flush()

    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    is_prod = not settings.DEBUG and "localhost" not in settings.CORS_ORIGINS[0]
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=3600,
    )
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
async def get_me(user=Depends(get_current_user)):
    return user


@router.put("/change-password")
async def change_password(
    data: ChangePassword,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    user.hashed_password = hash_password(data.new_password)
    await db.flush()
    return {"ok": True, "message": "Contraseña actualizada"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


class SeedResponse(BaseModel):
    message: str
    email: str
    password: str


class SeedRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/seed", response_model=SeedResponse)
async def seed_admin(data: SeedRequest, db: AsyncSession = Depends(get_db)):
    count = await db.execute(select(func.count()).select_from(User))
    total = count.scalar()
    if total and total > 0:
        raise HTTPException(status_code=400, detail="Ya existen usuarios en el sistema. Usá /api/auth/register desde un admin.")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role="superadmin",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return SeedResponse(
        message="Superadmin creado exitosamente",
        email=data.email,
        password=data.password,
    )


@router.get("/users", response_model=list[UserRead])
async def list_users(admin: SuperAdminUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: str | None = None
    password: str | None = None


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    data: UserUpdate,
    admin: SuperAdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id and data.role and data.role != "superadmin":
        raise HTTPException(status_code=400, detail="No podés quitarte tu propio rol de superadmin")

    if data.email is not None:
        existing = await db.execute(select(User).where(User.email == data.email, User.id != user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.password is not None:
        user.hashed_password = hash_password(data.password)

    await db.flush()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: SuperAdminUser,
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="No podés eliminarte a vos mismo")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.delete(user)
    await db.flush()
    return {"ok": True}
