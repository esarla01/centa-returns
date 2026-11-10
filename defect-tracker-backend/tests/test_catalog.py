"""Customers, product models, fault types ("services") and the audit log."""
from models import ActionType, Customers, ProductModel, ServiceDefinition, UserActionLog, db
from tests.conftest import advance_to, create_case


def actions():
    return [log.action_type for log in UserActionLog.query.order_by(UserActionLog.id)]


# --- Customers --------------------------------------------------------------

def test_customer_crud(client_for):
    support = client_for("SUPPORT")
    res = support.post("/customers", json={
        "name": " Beta Lift ", "representative": "Ayşe", "contact_info": "+90 212 555 00 00", "address": "Ankara"})
    assert res.status_code == 201
    customer = Customers.query.filter_by(name="Beta Lift").one()

    body = support.get("/customers?limit=5&search=beta").get_json()
    assert body["totalPages"] == 1 and body["currentPage"] == 1
    listed = body["customers"][0]
    assert {k: listed[k] for k in ("id", "name", "representative", "contact_info", "address")} == {
        "id": customer.id, "name": "Beta Lift", "representative": "Ayşe",
        "contact_info": "+90 212 555 00 00", "address": "Ankara"}

    res = support.put(f"/customers/{customer.id}", json={
        "representative": "Mehmet", "contact_info": "mehmet@beta.example", "address": "İzmir"})
    assert res.status_code == 200
    db.session.refresh(customer)
    assert (customer.representative, customer.contact_info, customer.address) == (
        "Mehmet", "mehmet@beta.example", "İzmir")

    assert support.delete(f"/customers/{customer.id}").status_code == 200
    assert db.session.get(Customers, customer.id) is None
    assert actions() == [ActionType.CUSTOMER_CREATED, ActionType.CUSTOMER_DELETED]


def test_customer_validation(client_for, customer):
    support = client_for("SUPPORT")
    assert support.post("/customers", json={"name": "  "}).status_code == 400
    assert support.post("/customers", json={"name": "No Contact"}).status_code == 400
    assert support.post("/customers", json={"name": "Bad", "contact_info": "not-a-contact"}).status_code == 400
    assert support.post("/customers", json={"name": "Acme Asansör", "representative": "x"}).status_code == 409
    assert support.put(f"/customers/{customer}", json={"contact_info": ""}).status_code == 400
    assert support.put(f"/customers/{customer}", json={"contact_info": "nope"}).status_code == 400
    assert support.put("/customers/9999", json={"contact_info": "a@b.co"}).status_code == 404
    assert support.delete("/customers/9999").status_code == 404


def test_customer_with_cases_cannot_be_deleted(client_for, customer):
    support = client_for("SUPPORT")
    create_case(support, customer)
    res = support.delete(f"/customers/{customer}")
    assert res.status_code == 400
    assert res.get_json()["return_case_count"] == 1


# --- Product models ---------------------------------------------------------

def test_product_crud(client_for):
    manager = client_for("MANAGER")
    assert manager.post("/products", json={"name": "OL-1", "product_type": "overload"}).status_code == 201
    product = ProductModel.query.filter_by(name="OL-1").one()

    body = manager.get("/products?limit=5&type=overload").get_json()
    assert body["products"] == [{"id": product.id, "name": "OL-1", "product_type": "Aşırı Yük Sensörü"}]
    assert manager.get("/products?type=control_unit").get_json()["products"] == []

    res = manager.put(f"/products/{product.id}", json={"name": "OL-2", "product_type": "control_unit"})
    assert res.status_code == 200
    db.session.refresh(product)
    assert (product.name, product.product_type.name) == ("OL-2", "control_unit")

    assert manager.delete(f"/products/{product.id}").status_code == 200
    assert actions() == [ActionType.PRODUCT_CREATED, ActionType.PRODUCT_DELETED]


def test_product_validation(client_for, product):
    manager = client_for("MANAGER")
    assert manager.post("/products", json={"name": "", "product_type": "overload"}).status_code == 400
    assert manager.post("/products", json={"name": "X", "product_type": "bogus"}).status_code == 400
    assert manager.post("/products", json={"name": "DT-25", "product_type": "door_detector"}).status_code == 409
    assert manager.put("/products/9999", json={"name": "X", "product_type": "overload"}).status_code == 404
    assert manager.delete("/products/9999").status_code == 404


def test_product_in_use_cannot_be_deleted(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "PAYMENT_COLLECTION", product, service)
    res = client_for("MANAGER").delete(f"/products/{product}")
    assert res.status_code == 400
    assert res.get_json()["return_case_item_count"] == 1


# --- Fault types ------------------------------------------------------------

def test_service_crud(client_for):
    manager = client_for("MANAGER")
    res = manager.post("/services", json={"service_name": "Yeni arıza", "product_type": "overload"})
    assert res.status_code == 201
    created = ServiceDefinition.query.filter_by(service_name="Yeni arıza").one()

    body = manager.get("/services?limit=5&search=Yeni").get_json()
    assert body["services"] == [
        {"id": created.id, "service_name": "Yeni arıza", "product_type": "Aşırı Yük Sensörü"}]

    assert manager.post("/services", json={"service_name": "Yeni arıza", "product_type": "overload"}).status_code == 409
    assert manager.post("/services", json={"service_name": "", "product_type": "overload"}).status_code == 400
    assert manager.post("/services", json={"service_name": "X", "product_type": "bogus"}).status_code == 400

    assert manager.delete(f"/services/{created.id}").status_code == 200
    assert db.session.get(ServiceDefinition, created.id) is None
    assert manager.delete("/services/9999").status_code == 404


def test_service_in_use_cannot_be_deleted(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "PAYMENT_COLLECTION", product, service)
    assert client_for("MANAGER").delete(f"/services/{service}").status_code == 400


# --- Audit log --------------------------------------------------------------

def test_audit_log_listing(client_for, customer):
    support = client_for("SUPPORT")
    case_id = create_case(support, customer)
    support.post(f"/returns/{case_id}/complete-teslim-alindi")

    body = support.get("/user-action-logs?limit=5").get_json()
    assert body["totalCount"] == 2
    assert body["totalPages"] == 1
    newest, oldest = body["logs"]
    assert newest["action_type"] == "STAGE_DELIVERED_COMPLETED"
    assert oldest["action_type"] == "CASE_CREATED"
    assert oldest["return_case_id"] == case_id
    assert oldest["user_email"] == "support@example.com"
    assert oldest["user_name"] == "Support User"
    assert oldest["created_at"].endswith("Z")

    assert support.get("/user-action-logs?search=support").get_json()["totalCount"] == 2
    assert support.get("/user-action-logs?search=nobody").get_json()["totalCount"] == 0


def test_service_changes_are_logged(client_for):
    manager = client_for("MANAGER")
    manager.post("/services", json={"service_name": "Yeni arıza", "product_type": "overload"})
    created = ServiceDefinition.query.filter_by(service_name="Yeni arıza").one()
    manager.delete(f"/services/{created.id}")
    logs = UserActionLog.query.order_by(UserActionLog.id).all()
    assert [(log.action_type, log.additional_info) for log in logs] == [
        (ActionType.SERVICE_CREATED, "Arıza Tipi: Yeni arıza"),
        (ActionType.SERVICE_DELETED, "Arıza Tipi: Yeni arıza"),
    ]


def test_a_failed_change_leaves_no_audit_entry(client_for, customer, monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(db.session, "delete", fail)
    res = client_for("SUPPORT").delete(f"/customers/{customer}")
    assert res.status_code == 500
    monkeypatch.undo()
    assert db.session.get(Customers, customer) is not None
    assert actions() == []  # the deletion did not happen, so it is not logged
