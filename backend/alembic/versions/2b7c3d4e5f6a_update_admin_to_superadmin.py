"""update admin to superadmin

Revision ID: 2b7c3d4e5f6a
Revises: 1b5af17758cf
Create Date: 2026-07-21
"""
from alembic import op
import sqlalchemy as sa

revision = "2b7c3d4e5f6a"
down_revision = "1b5af17758cf"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET role = 'superadmin' WHERE role = 'admin'")


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'superadmin'")
