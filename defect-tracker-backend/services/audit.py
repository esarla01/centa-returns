"""The audit log: who did what.

record() adds an entry to the current database session without committing.
The caller commits once, so the entry and the change it describes are saved
together or not at all.
"""
from flask import g

from models import UserActionLog, db


def record(action_type, return_case_id=None, additional_info=None):
    entry = UserActionLog(
        user_email=g.user.email,
        return_case_id=return_case_id,
        action_type=action_type,
        additional_info=additional_info,
    )
    db.session.add(entry)
    return entry
