"""Add PRODUCT_DELETED and CUSTOMER_DELETED to ActionType enum

Revision ID: c2bcbb6a1dcd
Revises: a0d7d206403c
Create Date: 2025-09-08 02:25:29.680931

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2bcbb6a1dcd'
down_revision = 'a0d7d206403c'
branch_labels = None
depends_on = None


def upgrade():
    # Add new enum values to ActionType enum
    op.execute("ALTER TYPE actiontype ADD VALUE 'PRODUCT_DELETED'")
    op.execute("ALTER TYPE actiontype ADD VALUE 'CUSTOMER_DELETED'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For now, we'll leave the enum values in place
    pass
