from pydantic import BaseModel
from datetime import date


class EmployeeBase(BaseModel):
    name: str
    legajo: str | None = None
    dni: str
    category: str
    admission_date: str


class EmployeeCreate(EmployeeBase):
    user_id: int | None = None


class EmployeeUpdate(BaseModel):
    name: str | None = None
    legajo: str | None = None
    dni: str | None = None
    category: str | None = None
    admission_date: str | None = None
    active: bool | None = None
    user_id: int | None = None


class EmployeeRead(EmployeeBase):
    id: int
    user_id: int | None
    active: bool

    model_config = {"from_attributes": True}
