"""add email notification preference

Revision ID: add_email_notifications
Revises: fix_resolution_keys
Create Date: 2026-02-16 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_email_notifications'
down_revision = 'fix_resolution_keys'
branch_labels = None
depends_on = None


def upgrade():
    # Add email_notifications_enabled column with default True
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('email_notifications_enabled', sa.Boolean(),
                     nullable=False, server_default='true')
        )


def downgrade():
    # Remove email_notifications_enabled column
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('email_notifications_enabled')
