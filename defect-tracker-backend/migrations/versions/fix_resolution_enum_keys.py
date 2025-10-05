"""Fix resolution enum to use correct keys

Revision ID: fix_resolution_keys
Revises: ee554ebd2a0c
Create Date: 2025-10-05 21:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_resolution_keys'
down_revision = 'ee554ebd2a0c'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add new enum values FIRST (these need to be committed before use)
    # Using execute with special connection to commit immediately
    connection = op.get_bind()
    connection.execute(sa.text("COMMIT"))
    connection.execute(sa.text("ALTER TYPE resolutionmethodenum ADD VALUE IF NOT EXISTS 'paid_replacement'"))
    connection.execute(sa.text("ALTER TYPE resolutionmethodenum ADD VALUE IF NOT EXISTS 'free_replacement'"))
    connection.execute(sa.text("ALTER TYPE resolutionmethodenum ADD VALUE IF NOT EXISTS 'old_product_none'"))
    
    # Step 2: Temporarily convert the column to text to allow updating
    op.execute("ALTER TABLE return_case_items ALTER COLUMN resolution_method TYPE text")
    
    # Step 3: Update existing records that have 'replacement' to 'paid_replacement'
    op.execute("""
        UPDATE return_case_items 
        SET resolution_method = 'paid_replacement' 
        WHERE resolution_method = 'replacement'
    """)
    
    # Step 4: Convert the column back to enum type
    op.execute("ALTER TABLE return_case_items ALTER COLUMN resolution_method TYPE resolutionmethodenum USING resolution_method::resolutionmethodenum")


def downgrade():
    # Step 1: Convert column to text temporarily
    op.execute("ALTER TABLE return_case_items ALTER COLUMN resolution_method TYPE text")
    
    # Step 2: Update records back to old value
    op.execute("""
        UPDATE return_case_items 
        SET resolution_method = 'replacement' 
        WHERE resolution_method = 'paid_replacement'
    """)
    
    # Step 3: Convert back to enum
    op.execute("ALTER TABLE return_case_items ALTER COLUMN resolution_method TYPE resolutionmethodenum USING resolution_method::resolutionmethodenum")
    
    # Note: PostgreSQL doesn't support removing enum values directly
    # The new enum values will remain in the enum type even after downgrade

