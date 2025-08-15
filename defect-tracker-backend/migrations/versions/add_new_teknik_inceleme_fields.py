"""add new teknik inceleme fields

Revision ID: add_new_teknik_inceleme_fields
Revises: move_services_cost_to_items
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_new_teknik_inceleme_fields'
down_revision = 'move_services_cost_to_items'
branch_labels = None
depends_on = None


def upgrade():
    # Create the ServiceTypeEnum type
    service_type_enum = postgresql.ENUM('maintenance', 'repair', 'calibration', name='servicetypeenum')
    service_type_enum.create(op.get_bind())
    
    # Add new columns to return_case_items table
    op.add_column('return_case_items', sa.Column('service_type', sa.Enum('maintenance', 'repair', 'calibration', name='servicetypeenum'), nullable=True))
    op.add_column('return_case_items', sa.Column('cable_check', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_case_items', sa.Column('profile_check', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_case_items', sa.Column('packaging', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Drop the new columns
    op.drop_column('return_case_items', 'packaging')
    op.drop_column('return_case_items', 'profile_check')
    op.drop_column('return_case_items', 'cable_check')
    op.drop_column('return_case_items', 'service_type')
    
    # Drop the ServiceTypeEnum type
    service_type_enum = postgresql.ENUM('maintenance', 'repair', 'calibration', name='servicetypeenum')
    service_type_enum.drop(op.get_bind())
