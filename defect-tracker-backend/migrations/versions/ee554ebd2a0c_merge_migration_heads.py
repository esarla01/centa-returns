"""merge migration heads

Revision ID: ee554ebd2a0c
Revises: 0c865dbcab69, 5887f89abc9c
Create Date: 2025-10-05 21:35:08.044925

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ee554ebd2a0c'
down_revision = ('0c865dbcab69', '5887f89abc9c')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
