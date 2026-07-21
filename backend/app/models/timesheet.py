from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, Text, Date, Time, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TimesheetRecord(Base):
    __tablename__ = "timesheet_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[str] = mapped_column(String(10), index=True)
    entry_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    exit_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    total_hours: Mapped[float] = mapped_column(Numeric(4, 2), default=0)
    is_franco: Mapped[bool] = mapped_column(Boolean, default=False)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False)
    holiday_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow()
    )

    employee = relationship("Employee", back_populates="timesheet_records")
