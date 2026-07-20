from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Payroll(Base):
    __tablename__ = "payrolls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)

    basic_salary: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    seniority_years: Mapped[int] = mapped_column(Integer, default=0)
    seniority_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    presentismo: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    overtime_hours: Mapped[float] = mapped_column(Numeric(4, 2), default=0)
    overtime_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    holiday_hours: Mapped[float] = mapped_column(Numeric(4, 2), default=0)
    holiday_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    night_hours: Mapped[float] = mapped_column(Numeric(4, 2), default=0)
    night_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    viaticos: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    non_remunerative: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    gross_salary: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    deductions: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    net_salary: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    sac_bruto: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    sac_deducciones: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    sac_neto: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    calculated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    employee = relationship("Employee", back_populates="payrolls")
