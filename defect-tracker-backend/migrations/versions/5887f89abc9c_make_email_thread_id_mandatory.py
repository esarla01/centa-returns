"""Make email_thread_id mandatory

Revision ID: 5887f89abc9c
Revises: fd6f571acb9f
Create Date: 2025-08-20 15:30:45.123456

"""
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision = '5887f89abc9c'
down_revision = 'fd6f571acb9f'
branch_labels = None
depends_on = None


def upgrade():
    # First, populate existing NULL email_thread_id values with unique IDs
    connection = op.get_bind()
    
    # Get all return cases with NULL email_thread_id
    result = connection.execute(sa.text("SELECT id FROM return_cases WHERE email_thread_id IS NULL"))
    cases_without_thread_id = result.fetchall()
    
    # Update each case with a unique email thread ID
    for case in cases_without_thread_id:
        case_id = case[0]
        thread_id = f"case-{case_id}-{uuid.uuid4().hex[:8]}@centa.com.tr"
        connection.execute(
            sa.text("UPDATE return_cases SET email_thread_id = :thread_id WHERE id = :case_id"),
            {"thread_id": thread_id, "case_id": case_id}
        )
    
    # Now make the column NOT NULL
    with op.batch_alter_table('return_cases', schema=None) as batch_op:
        batch_op.alter_column('email_thread_id',
               existing_type=sa.String(length=255),
               nullable=False)


def downgrade():
    # Make the column nullable again
    with op.batch_alter_table('return_cases', schema=None) as batch_op:
        batch_op.alter_column('email_thread_id',
               existing_type=sa.String(length=255),
               nullable=True)
