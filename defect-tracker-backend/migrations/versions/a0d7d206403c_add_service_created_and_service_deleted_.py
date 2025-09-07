"""Add SERVICE_CREATED and SERVICE_DELETED to ActionType enum

Revision ID: a0d7d206403c
Revises: e431dbed91f8
Create Date: 2025-09-08 02:07:12.630562

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a0d7d206403c'
down_revision = 'e431dbed91f8'
branch_labels = None
depends_on = None


def upgrade():
    # Add new enum values to ActionType enum
    op.execute("ALTER TYPE actiontype ADD VALUE 'SERVICE_CREATED'")
    op.execute("ALTER TYPE actiontype ADD VALUE 'SERVICE_DELETED'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For now, we'll leave the enum values in place
    pass
