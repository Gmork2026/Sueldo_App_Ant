from pydantic import BaseModel


class TimesheetRecordBase(BaseModel):
    date: str
    entry_time: str | None = None
    exit_time: str | None = None
    total_hours: float = 0
    is_franco: bool = False
    is_holiday: bool = False
    holiday_name: str | None = None
    notes: str | None = None


class TimesheetRecordCreate(TimesheetRecordBase):
    employee_id: int


class TimesheetRecordUpdate(BaseModel):
    entry_time: str | None = None
    exit_time: str | None = None
    total_hours: float | None = None
    is_franco: bool | None = None
    is_holiday: bool | None = None
    holiday_name: str | None = None
    notes: str | None = None


class TimesheetRecordRead(TimesheetRecordBase):
    id: int
    employee_id: int

    model_config = {"from_attributes": True}


class TimesheetMonthRequest(BaseModel):
    employee_id: int
    month: int
    year: int


class TimesheetBulkFillRequest(BaseModel):
    employee_id: int
    month: int
    year: int
    entry_time: str
    exit_time: str
    skip_dates: list[str] | None = None
