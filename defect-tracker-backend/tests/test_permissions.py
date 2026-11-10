"""Who may call what.

Each row lists the roles that get past authentication and authorization for
an endpoint ("ANON" = not logged in). The permission table itself lives in
seed.py (ROLE_PERMISSIONS); this file checks that every endpoint enforces it.
"""
import pytest

from models import ReturnCase, db
from tests.conftest import ROLES

ALL = set(ROLES)
STATS = {"ADMIN", "MANAGER", "SALES"}  # roles with PAGE_VIEW_STATISTICS
REPORT_QS = "?start_date=2024-01-01&end_date=2024-06-30"

# (method, path, roles that are let in)
MATRIX = [
    # Return cases
    ("GET", "/returns", ALL),
    ("POST", "/returns/simple", {"SUPPORT"}),
    ("PUT", "/returns/{case}/teslim-alindi", {"SUPPORT"}),
    ("POST", "/returns/{case}/complete-teslim-alindi", {"SUPPORT"}),
    ("PUT", "/returns/{case}/teknik-inceleme", {"TECHNICIAN"}),
    ("POST", "/returns/{case}/complete-teknik-inceleme", {"TECHNICIAN"}),
    ("PUT", "/returns/{case}/odeme-tahsilati", {"SALES"}),
    ("POST", "/returns/{case}/complete-odeme-tahsilati", {"SALES"}),
    ("PUT", "/returns/{case}/kargoya-verildi", {"LOGISTICS"}),
    ("POST", "/returns/{case}/complete-kargoya-verildi", {"LOGISTICS"}),
    ("PUT", "/returns/{case}/tamamlandi", {"MANAGER"}),
    ("POST", "/returns/{case}/complete-tamamlandi", set()),          # no role holds CASE_COMPLETE_COMPLETED
    ("DELETE", "/returns/{case}", {"SUPPORT", "MANAGER", "ADMIN"}),
    ("POST", "/returns/{case}/send-customer-email", {"LOGISTICS"}),
    ("GET", "/returns/service-definitions/overload", {"TECHNICIAN"}),
    # Customers
    ("GET", "/customers", ALL),
    ("POST", "/customers", {"ADMIN", "SUPPORT", "SALES"}),
    ("PUT", "/customers/9999", {"ADMIN", "SUPPORT", "SALES"}),
    ("DELETE", "/customers/9999", {"ADMIN", "SUPPORT", "SALES"}),
    # Products and fault types
    ("GET", "/products", ALL),
    ("POST", "/products", {"ADMIN", "MANAGER"}),
    ("PUT", "/products/9999", {"ADMIN", "MANAGER"}),
    ("DELETE", "/products/9999", {"ADMIN", "MANAGER"}),
    ("GET", "/services", ALL),
    ("POST", "/services", {"ADMIN", "MANAGER"}),
    ("DELETE", "/services/9999", {"ADMIN", "MANAGER"}),
    # Users
    ("GET", "/admin", {"ADMIN"}),
    ("POST", "/admin/invite-user", {"ADMIN"}),
    ("DELETE", "/admin", {"ADMIN"}),
    ("PATCH", "/admin/toggle-email-notifications", {"ADMIN"}),
    ("GET", "/user-action-logs", ALL),
    ("GET", "/auth/whoami", ALL),
    # Reports
    ("GET", "/reports/items-by-customer" + REPORT_QS, STATS),
    ("GET", "/reports/items-by-product-model" + REPORT_QS, STATS),
    ("GET", "/reports/defects-by-production-month" + REPORT_QS, STATS),
    ("GET", "/reports/fault-responsibility-stats" + REPORT_QS, STATS),
    ("GET", "/reports/resolution-method-stats" + REPORT_QS, STATS),
    ("GET", "/reports/product-type-stats" + REPORT_QS, STATS),
    ("GET", "/reports/top-defects" + REPORT_QS, STATS),
    ("GET", "/reports/production-date-distribution" + REPORT_QS, STATS),
]


@pytest.mark.parametrize("method, path, allowed", MATRIX, ids=[f"{m} {p.split('?')[0]}" for m, p, _ in MATRIX])
def test_access(client_for, customer, method, path, allowed):
    let_in = set()
    for who in ["ANON"] + ROLES:
        # A fresh case per caller, so that one caller deleting it cannot
        # change the answer for the next.
        case = ReturnCase(customer_id=customer)
        db.session.add(case)
        db.session.commit()

        client = client_for(None if who == "ANON" else who)
        res = client.open(path.format(case=case.id), method=method, json={})
        if res.status_code not in (401, 403):
            let_in.add(who)
    assert let_in == allowed


def test_anonymous_is_rejected_with_401(client_for):
    assert client_for(None).get("/customers").status_code == 401


def test_wrong_role_is_rejected_with_403(client_for):
    assert client_for("TECHNICIAN").post("/customers", json={}).status_code == 403


def test_token_of_a_deleted_user_is_rejected(app, client_for):
    from models import User
    client = client_for("SALES")
    db.session.delete(db.session.get(User, "sales@example.com"))
    db.session.commit()
    assert client.get("/returns").status_code == 401


def test_errors_are_returned_as_json(client_for, product):
    manager = client_for("MANAGER")
    # Not found
    res = manager.put("/products/9999", json={"name": "X", "product_type": "overload"})
    assert res.status_code == 404 and "error" in res.get_json()
    # A crash inside an endpoint (a list where an object is expected)
    res = manager.put(f"/products/{product}", json=[])
    assert res.status_code == 500
    assert res.get_json() == {"error": "Beklenmeyen bir hata oluştu."}
