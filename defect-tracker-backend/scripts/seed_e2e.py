"""Reset a throwaway database for the browser tests.

Creates the tables, the roles and fault types, one active user per role
(<role>@example.com), one customer and one product model.

DESTRUCTIVE: every table in DATABASE_URI is dropped first. To make an accident
impossible, the database name must end in "_e2e" or "_test".

    DATABASE_URI=postgresql+psycopg2://USER:PASSWORD@localhost:5432/centa_e2e \\
        E2E_PASSWORD=... python scripts/seed_e2e.py
"""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

database = os.environ.get("DATABASE_URI", "").rsplit("/", 1)[-1].split("?")[0]
if not database.endswith(("_e2e", "_test")):
    sys.exit(f'Refusing to reset "{database}": the database name must end in _e2e or _test.')
password = os.environ.get("E2E_PASSWORD")
if not password:
    sys.exit("Set E2E_PASSWORD to the password the test users should get.")

from app import app  # noqa: E402
from models import Customers, ProductModel, ProductTypeEnum, Role, User, UserRole, db  # noqa: E402
from seed import seed_roles_permissions, seed_services  # noqa: E402

with app.app_context():
    db.drop_all()
    db.create_all()
    seed_roles_permissions()
    seed_services()
    for role in Role.query.all():
        user = User(
            email=f"{role.name.value.lower()}@example.com",
            first_name=role.name.value.title(), last_name="Test",
            role=role, accepted_at=datetime(2024, 6, 1, 10, 0, 0),
        )
        user.set_password(password)
        db.session.add(user)
    db.session.add(Customers(name="Acme Asansör", representative="Ali Veli",
                             contact_info="ali@acme.example", address="İstanbul"))
    db.session.add(ProductModel(name="DT-25", product_type=ProductTypeEnum.door_detector))
    db.session.commit()
    print(f"Database {database} reset for browser tests.")
