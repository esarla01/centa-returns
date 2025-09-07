"""Added services

Revision ID: 2e50b347b468
Revises: a174c669d808
Create Date: 2025-09-07 21:45:06.361641

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2e50b347b468'
down_revision = 'a174c669d808'
branch_labels = None
depends_on = None


def upgrade():
    # Reuse the existing producttypeenum enum
    product_type_enum = postgresql.ENUM(
        'overload', 'door_detector', 'control_unit',
        name='producttypeenum',
        create_type=False
    )

    # Create service_definitions
    op.create_table(
        'service_definitions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('product_type', product_type_enum, nullable=False),
        sa.Column('service_name', sa.String(length=100), nullable=False),
    )

    # Create return_case_item_services
    op.create_table(
        'return_case_item_services',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('return_case_item_id', sa.Integer(), sa.ForeignKey('return_case_items.id'), nullable=False),
        sa.Column('service_definition_id', sa.Integer(), sa.ForeignKey('service_definitions.id'), nullable=False),
        sa.Column('is_performed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    # Drop email_thread_id from return_cases
    with op.batch_alter_table('return_cases', schema=None) as batch_op:
        batch_op.drop_constraint('return_cases_email_thread_id_key', type_='unique')
        batch_op.drop_column('email_thread_id')


def downgrade():
    # Add email_thread_id back to return_cases
    with op.batch_alter_table('return_cases', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email_thread_id', sa.VARCHAR(length=255), nullable=False))
        batch_op.create_unique_constraint(
            'return_cases_email_thread_id_key',
            ['email_thread_id'],
            postgresql_nulls_not_distinct=False
        )

    # Drop return_case_item_services and service_definitions
    op.drop_table('return_case_item_services')
    op.drop_table('service_definitions')
