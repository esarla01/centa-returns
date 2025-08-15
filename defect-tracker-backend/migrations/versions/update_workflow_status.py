"""update workflow status

Revision ID: update_workflow_status
Revises: 0f11900b07e6
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_workflow_status'
down_revision = '0f11900b07e6'
branch_labels = None
depends_on = None


def upgrade():
    # Update the SHIPPING enum value from 'Kargoya Verildi' to 'Kargoya Veriliyor'
    op.execute("UPDATE return_cases SET workflow_status = 'Kargoya Veriliyor' WHERE workflow_status = 'Kargoya Verildi'")
    
    # Drop the individual completion tracking columns
    op.drop_column('return_cases', 'teslim_alindi_completed')
    op.drop_column('return_cases', 'teknik_inceleme_completed')
    op.drop_column('return_cases', 'dokumantasyon_completed')
    op.drop_column('return_cases', 'kargoya_verildi_completed')
    op.drop_column('return_cases', 'tamamlandi_completed')


def downgrade():
    # Add back the individual completion tracking columns
    op.add_column('return_cases', sa.Column('teslim_alindi_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_cases', sa.Column('teknik_inceleme_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_cases', sa.Column('dokumantasyon_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_cases', sa.Column('kargoya_verildi_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('return_cases', sa.Column('tamamlandi_completed', sa.Boolean(), nullable=False, server_default='false'))
    
    # Revert the SHIPPING enum value
    op.execute("UPDATE return_cases SET workflow_status = 'Kargoya Verildi' WHERE workflow_status = 'Kargoya Veriliyor'") 