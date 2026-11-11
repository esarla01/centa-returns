"""Guards against wiping a database that holds real data.

Anything that drops or empties tables must call
require_disposable_database() first. Throwaway databases are recognised by
name: it must end in "_test" or "_e2e". The production database ("railway")
and any local copy of it never match, so these tools refuse to touch them.
"""
from sqlalchemy.engine import make_url

DISPOSABLE_SUFFIXES = ("_test", "_e2e")


def require_disposable_database(uri, purpose):
    """Stop with an explanation unless `uri` names a throwaway database."""
    name = make_url(uri).database if uri else None
    if not name or not name.endswith(DISPOSABLE_SUFFIXES):
        raise SystemExit(
            f'Refusing to {purpose}: database "{name}" is not a throwaway database. '
            f'Its name must end in {" or ".join(DISPOSABLE_SUFFIXES)}.'
        )
