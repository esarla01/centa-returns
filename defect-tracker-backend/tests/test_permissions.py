"""Who may call what.

Each row lists the roles that get past authentication and authorization for
an endpoint ("ANON" = not logged in). This records the behaviour of the code
as it is today, including gaps that are marked KNOWN GAP and are scheduled to
be closed in the next step of the rebuild. When one is closed, update its row.
"""
import pytest

from models import ReturnCase, db
from tests.conftest import ROLES

ALL = set(ROLES)
EVERYONE = ALL | {"ANON"}
REPORT_QS = "?start_date=2024-01-01&end_date=2024-06-30"

# (method, path, roles that are let in)
MATRIX = [
    # Return cases
    ("GET", "/returns", EVERYONE),                                   # KNOWN GAP: no login required
    ("POST", "/returns/simple", {"SUPPORT"}),
    ("PUT", "/returns/{case}/teslim-alindi", {"SUPPORT"}),
    ("POST", "/returns/{case}/complete-teslim-alindi", {"SUPPORT"}),
    ("PUT", "/returns/{case}/teknik-inceleme", {"TECHNICIAN"}),
    ("POST", "/returns/{case}/complete-teknik-inceleme", {"TECHNICIAN"}),
    ("PUT", "/returns/{case}/odeme-tahsilati", {"SALES"}),
    ("POST", "/returns/{case}/complete-odeme-tahsilati", {"SALES"}),
    ("PUT", "/returns/{case}/kargoya-verildi", {"LOGISTICS"}),
    ("POST", "/returns/{case}/complete-kargoya-verildi", {"LOGISTICS"}),
    ("PUT", "/returns/{case}/tamamlandi", ALL),                      # KNOWN GAP: any logged-in role
    ("POST", "/returns/{case}/complete-tamamlandi", set()),          # KNOWN GAP: no role has the permission
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
    ("GET", "/admin", ALL),                                          # KNOWN GAP: any logged-in role
    ("POST", "/admin/invite-user", {"ADMIN"}),
    ("DELETE", "/admin", {"ADMIN"}),
    ("PATCH", "/admin/toggle-email-notifications", {"ADMIN"}),
    ("GET", "/user-action-logs", ALL),
    ("GET", "/auth/whoami", ALL),
    # Reports                                                        # KNOWN GAP: no login required on any
    ("GET", "/reports/items-by-customer" + REPORT_QS, EVERYONE),
    ("GET", "/reports/items-by-product-model" + REPORT_QS, EVERYONE),
    ("GET", "/reports/returns-breakdown" + REPORT_QS, EVERYONE),
    ("GET", "/reports/defects-by-production-month" + REPORT_QS, EVERYONE),
    ("GET", "/reports/fault-responsibility-stats" + REPORT_QS, EVERYONE),
    ("GET", "/reports/resolution-method-stats" + REPORT_QS, EVERYONE),
    ("GET", "/reports/product-type-stats" + REPORT_QS, EVERYONE),
    ("GET", "/reports/top-defects" + REPORT_QS, EVERYONE),
    ("GET", "/reports/production-date-distribution" + REPORT_QS, EVERYONE),
    ("GET", "/reports/service-type-stats", EVERYONE),
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
