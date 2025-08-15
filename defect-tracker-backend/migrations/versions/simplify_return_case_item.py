"""simplify return case item remove relationship fields

Revision ID: simplify_return_case_item
Revises: 0f11900b07e6
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'simplify_return_case_item'
down_revision = '0f11900b07e6'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new has_control_unit column
    op.add_column('return_case_items', sa.Column('has_control_unit', sa.Boolean(), nullable=False, server_default='false'))
    
    # Drop the old relationship columns
    op.drop_column('return_case_items', 'attached_to_item_id')
    op.drop_column('return_case_items', 'is_main_product')


def downgrade():
    # Re-add the old relationship columns
    op.add_column('return_case_items', sa.Column('is_main_product', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('return_case_items', sa.Column('attached_to_item_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'return_case_items', 'return_case_items', ['attached_to_item_id'], ['id'])
    
    # Drop the new has_control_unit column
    op.drop_column('return_case_items', 'has_control_unit')
