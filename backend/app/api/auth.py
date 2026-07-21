from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserRead, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.deps import AdminUser, CurrentUser

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserRead)
async def register(data: UserCreate, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
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
        samesite="lax",
        max_age=3600,
    )
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
async def get_me(user=Depends(get_current_user)):
    return user


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
        role="admin",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return SeedResponse(
        message="Admin creado exitosamente",
        email=data.email,
        password=data.password,
    )


@router.get("/users", response_model=list[UserRead])
async def list_users(admin: AdminUser, db: AsyncSession = Depends(get_db)):
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
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id and data.role and data.role != "admin":
        raise HTTPException(status_code=400, detail="No podés quitarte tu propio rol de admin")

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
    admin: AdminUser,
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
