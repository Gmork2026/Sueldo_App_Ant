"""add payroll detail columns

Revision ID: 3c8d5e7f9a1b
Revises: 2b7c3d4e5f6a
Create Date: 2026-07-21
"""
from alembic import op
import sqlalchemy as sa

revision = "3c8d5e7f9a1b"
down_revision = "2b7c3d4e5f6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("payrolls", sa.Column("has_presentismo", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("payrolls", sa.Column("deduccion_porcentaje", sa.Numeric(10, 2), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("deduccion_os_fija", sa.Numeric(10, 2), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("base_hours", sa.Integer(), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("total_hours_worked", sa.Numeric(8, 2), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("dias_vacaciones", sa.Integer(), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("dias_trabajados", sa.Integer(), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("pago_basico_trabajado", sa.Numeric(10, 2), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("pago_vacaciones", sa.Numeric(10, 2), server_default="0", nullable=False))
    op.add_column("payrolls", sa.Column("plus_vacacional", sa.Numeric(10, 2), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("payrolls", "plus_vacacional")
    op.drop_column("payrolls", "pago_vacaciones")
    op.drop_column("payrolls", "pago_basico_trabajado")
    op.drop_column("payrolls", "dias_trabajados")
    op.drop_column("payrolls", "dias_vacaciones")
    op.drop_column("payrolls", "total_hours_worked")
    op.drop_column("payrolls", "base_hours")
    op.drop_column("payrolls", "deduccion_os_fija")
    op.drop_column("payrolls", "deduccion_porcentaje")
    op.drop_column("payrolls", "has_presentismo")
