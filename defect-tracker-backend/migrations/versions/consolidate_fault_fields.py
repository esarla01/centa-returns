"""consolidate fault fields

Revision ID: consolidate_fault_fields
Revises: add_new_teknik_inceleme_fields
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'consolidate_fault_fields'
down_revision = 'add_new_teknik_inceleme_fields'
branch_labels = None
depends_on = None


def upgrade():
    # First, update existing fault_source values to fault_responsibility
    # Map 'our_firm' -> 'our_firm', 'customer' -> 'customer', 'unknown' -> 'unknown'
    op.execute("""
        UPDATE return_case_items 
        SET fault_responsibility = fault_source 
        WHERE fault_source IS NOT NULL AND fault_responsibility IS NULL
    """)
    
    # Drop the fault_source column
    op.drop_column('return_case_items', 'fault_source')
    
    # Update the fault_responsibility enum to include the new values
    # This will be handled by the model change


def downgrade():
    # Add back the fault_source column
    op.add_column('return_case_items', sa.Column('fault_source', sa.Enum('our_firm', 'customer', 'unknown', name='faultsourceenum'), nullable=True))
    
    # Copy fault_responsibility values back to fault_source where they match the old enum
    op.execute("""
        UPDATE return_case_items 
        SET fault_source = fault_responsibility 
        WHERE fault_responsibility IN ('our_firm', 'customer', 'unknown')
    """)
