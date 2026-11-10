"""Shared test setup.

These tests run against a real PostgreSQL database (the reports use
PostgreSQL-only SQL). Point TEST_DATABASE_URI at an empty, disposable
database: every table in it is dropped and recreated.
"""
import os
import sys
from datetime import date, datetime

import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

os.environ["DATABASE_URI"] = os.environ.get(
    "TEST_DATABASE_URI", "postgresql+psycopg2://centa:centa@localhost:5432/centa_test"
)
os.environ["JWT_SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ.pop("RAILWAY_ENVIRONMENT", None)
os.environ.pop("RESEND_API_KEY", None)
os.environ.pop("SEED_ADMIN_PASSWORD", None)

from app import app as flask_app  # noqa: E402
from models import (  # noqa: E402
    Customers, ProductModel, ProductTypeEnum, ReturnCase, Role, ServiceDefinition,
    User, UserRole, bcrypt, db,
)
from seed import seed_roles_permissions, seed_services  # noqa: E402

PASSWORD = "Test1234!"
ROLES = ["ADMIN", "MANAGER", "SUPPORT", "TECHNICIAN", "SALES", "LOGISTICS"]


def email_for(role):
    return f"{role.lower()}@example.com"


@pytest.fixture(scope="session")
def app():
    flask_app.config["PROPAGATE_EXCEPTIONS"] = False
    bcrypt._log_rounds = 4  # fast password hashing for tests
    with flask_app.app_context():
        db.drop_all()
        db.create_all()
    yield flask_app
    with flask_app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Start every test from the same seeded state: roles, permissions,
    service definitions and one active user per role."""
    with app.app_context():
        db.session.remove()
        tables = ", ".join(f'"{t.name}"' for t in db.metadata.sorted_tables)
        db.session.execute(db.text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
        db.session.commit()
        seed_roles_permissions()
        seed_services()
        for role_name in ROLES:
            role = Role.query.filter_by(name=UserRole[role_name]).first()
            user = User(
                email=email_for(role_name),
                first_name=role_name.title(),
                last_name="User",
                role=role,
                accepted_at=datetime(2024, 6, 1, 10, 0, 0),
            )
            user.set_password(PASSWORD)
            db.session.add(user)
        db.session.commit()
        yield
        db.session.remove()


@pytest.fixture(autouse=True)
def sent_emails(monkeypatch):
    """Capture outgoing emails instead of calling Resend."""
    import resend

    outbox = []

    def fake_send(params):
        outbox.append(params)
        return {"id": f"test-{len(outbox)}"}

    monkeypatch.setattr(resend.Emails, "send", fake_send)
    return outbox


def make_client(app, role=None):
    # Cookies are marked Secure, so the client has to speak https.
    client = app.test_client()
    client.environ_base["wsgi.url_scheme"] = "https"
    if role:
        res = client.post("/auth/login", json={"email": email_for(role), "password": PASSWORD})
        assert res.status_code == 200, res.get_data(as_text=True)
    return client


@pytest.fixture
def client_for(app):
    """client_for("SUPPORT") -> logged-in client; client_for(None) -> anonymous."""
    cache = {}

    def get(role=None):
        if role not in cache:
            cache[role] = make_client(app, role)
        return cache[role]

    return get


@pytest.fixture
def customer(app):
    c = Customers(name="Acme Asansör", representative="Ali Veli",
                  contact_info="ali@acme.example", address="İstanbul")
    db.session.add(c)
    db.session.commit()
    return c.id


@pytest.fixture
def product(app):
    p = ProductModel(name="DT-25", product_type=ProductTypeEnum.door_detector)
    db.session.add(p)
    db.session.commit()
    return p.id


@pytest.fixture
def service(app):
    return ServiceDefinition.query.filter_by(
        product_type=ProductTypeEnum.door_detector, service_name="Kablo kopması"
    ).first().id


def item_payload(product_id, service_id, **overrides):
    payload = {
        "product_model_id": product_id,
        "product_count": 2,
        "production_date": "2024-03",
        "warranty_status": "Garanti Dahilinde",
        "fault_responsibility": "Teknik Sorun",
        "resolution_method": "Tamir",
        "has_control_unit": False,
        "cable_check": True,
        "profile_check": False,
        "packaging": True,
        "services": [{"service_definition_id": service_id, "is_performed": True}],
    }
    payload.update(overrides)
    return payload


def technical_review_payload(product_id, service_id, **item_overrides):
    return {
        "yedek_parca": 100,
        "bakim": 50,
        "iscilik": 25.5,
        "performed_services": "Kablo değiştirildi",
        "items": [item_payload(product_id, service_id, **item_overrides)],
    }


def create_case(client, customer_id, arrival_date="2024-05-10", receipt_method="shipment"):
    res = client.post("/returns/simple", json={
        "customerId": customer_id,
        "arrivalDate": arrival_date,
        "receiptMethod": receipt_method,
        "notes": "test",
    })
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["caseId"]


def advance_to(client_for, case_id, target, product_id=None, service_id=None):
    """Drive a case forward to `target` (a CaseStatusEnum name) using the
    role that owns each stage."""
    order = ["DELIVERED", "TECHNICAL_REVIEW", "PAYMENT_COLLECTION", "SHIPPING", "COMPLETED"]
    start = order.index(case_status(case_id))
    for stage in order[start:order.index(target)]:
        if stage == "DELIVERED":
            res = client_for("SUPPORT").post(f"/returns/{case_id}/complete-teslim-alindi")
        elif stage == "TECHNICAL_REVIEW":
            tech = client_for("TECHNICIAN")
            res = tech.put(f"/returns/{case_id}/teknik-inceleme",
                           json=technical_review_payload(product_id, service_id))
            assert res.status_code == 200, res.get_data(as_text=True)
            res = tech.post(f"/returns/{case_id}/complete-teknik-inceleme")
        elif stage == "PAYMENT_COLLECTION":
            sales = client_for("SALES")
            res = sales.put(f"/returns/{case_id}/odeme-tahsilati", json={"payment_status": "Ödendi"})
            assert res.status_code == 200, res.get_data(as_text=True)
            res = sales.post(f"/returns/{case_id}/complete-odeme-tahsilati")
        elif stage == "SHIPPING":
            logistics = client_for("LOGISTICS")
            res = logistics.put(f"/returns/{case_id}/kargoya-verildi", json={
                "shippingInfo": "Yurtiçi Kargo", "trackingNumber": "TR123", "shippingDate": "2024-05-20",
            })
            assert res.status_code == 200, res.get_data(as_text=True)
            res = logistics.post(f"/returns/{case_id}/complete-kargoya-verildi")
        assert res.status_code == 200, res.get_data(as_text=True)


def case_status(case_id):
    db.session.expire_all()
    return db.session.get(ReturnCase, case_id).workflow_status.name
