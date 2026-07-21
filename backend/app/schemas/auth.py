from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    role: str = "employee"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"
    employee_id: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class RegisterByDNI(BaseModel):
    dni: str
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str
