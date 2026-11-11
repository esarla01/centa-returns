"""The guards that keep test tools away from real data."""
import pytest

from safety import require_disposable_database


@pytest.mark.parametrize("uri", [
    "postgresql://user:pw@xyz.proxy.rlwy.net:12345/railway",
    "postgresql://user:pw@postgres.railway.internal:5432/railway",
    "postgresql+psycopg2://localhost/centa_local",
    "postgresql://localhost/test_centa",
    "",
    None,
])
def test_real_databases_are_refused(uri):
    with pytest.raises(SystemExit):
        require_disposable_database(uri, "wipe it")


@pytest.mark.parametrize("uri", [
    "postgresql+psycopg2://centa:centa@localhost:5432/centa_test",
    "postgresql://localhost/centa_e2e",
])
def test_throwaway_databases_are_allowed(uri):
    require_disposable_database(uri, "wipe it")


def test_the_baseline_migration_cannot_be_undone():
    import importlib.util
    import pathlib

    path = pathlib.Path(__file__).parent.parent / "migrations" / "versions" / "0001_baseline.py"
    spec = importlib.util.spec_from_file_location("baseline", path)
    baseline = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(baseline)
    with pytest.raises(RuntimeError, match="cannot be undone"):
        baseline.downgrade()
