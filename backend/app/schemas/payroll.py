from pydantic import BaseModel


class PayrollCalculateRequest(BaseModel):
    employee_id: int
    month: int
    year: int
    dias_vacaciones: int = 0


class PayrollRead(BaseModel):
    id: int
    employee_id: int
    month: int
    year: int

    basic_salary: float
    seniority_years: int
    seniority_amount: float
    presentismo: float
    overtime_hours: float
    overtime_amount: float
    holiday_hours: float
    holiday_amount: float
    night_hours: float
    night_amount: float
    viaticos: float
    non_remunerative: float

    gross_salary: float
    deductions: float
    net_salary: float

    sac_bruto: float
    sac_deducciones: float
    sac_neto: float

    model_config = {"from_attributes": True}
