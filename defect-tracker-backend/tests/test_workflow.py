"""The five-stage return workflow, end to end and stage by stage."""
import pytest

from models import ActionType, ReturnCase, ReturnCaseItem, UserActionLog, db
from tests.conftest import (
    advance_to, case_status, create_case, item_payload, technical_review_payload,
)


def test_full_happy_path(client_for, customer, product, service, sent_emails):
    case_id = create_case(client_for("SUPPORT"), customer)
    assert case_status(case_id) == "DELIVERED"
    # Creating a case notifies every user with notifications enabled.
    assert len(sent_emails) == 1
    assert len(sent_emails[0]["to"]) == 6

    advance_to(client_for, case_id, "TECHNICAL_REVIEW")
    assert case_status(case_id) == "TECHNICAL_REVIEW"
    advance_to(client_for, case_id, "PAYMENT_COLLECTION", product, service)
    assert case_status(case_id) == "PAYMENT_COLLECTION"
    advance_to(client_for, case_id, "SHIPPING", product, service)
    assert case_status(case_id) == "SHIPPING"
    advance_to(client_for, case_id, "COMPLETED", product, service)
    assert case_status(case_id) == "COMPLETED"

    case = db.session.get(ReturnCase, case_id)
    assert float(case.cost) == 175.5
    assert case.payment_status.name == "paid"
    assert case.tracking_number == "TR123"

    actions = [
        log.action_type for log in
        UserActionLog.query.filter_by(return_case_id=case_id).order_by(UserActionLog.id)
    ]
    assert actions == [
        ActionType.CASE_CREATED,
        ActionType.STAGE_DELIVERED_COMPLETED,
        ActionType.STAGE_TECHNICAL_REVIEW_COMPLETED,
        ActionType.STAGE_PAYMENT_COLLECTION_COMPLETED,
        ActionType.STAGE_SHIPPING_COMPLETED,
    ]
    # Stage completions do not send email today (the calls are commented out).
    assert len(sent_emails) == 1


def test_list_returns_serialized_case(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "PAYMENT_COLLECTION", product, service)

    body = client_for("SUPPORT").get("/returns?page=1&limit=5").get_json()
    assert body["totalItems"] == 1
    assert body["totalPages"] == 1
    assert body["currentPage"] == 1
    assert body["hasNext"] is False and body["hasPrev"] is False
    case = body["cases"][0]
    assert case == {
        "id": case_id,
        "status": "Ödeme Tahsilatı",
        "customer": {"id": customer, "name": "Acme Asansör",
                     "contact_info": "ali@acme.example", "address": "İstanbul"},
        "arrival_date": "2024-05-10",
        "receipt_method": "Kargo",
        "notes": "test",
        "shipping_info": None,
        "tracking_number": None,
        "shipping_date": None,
        "payment_status": None,
        "yedek_parca": 100.0,
        "bakim": 50.0,
        "iscilik": 25.5,
        "cost": 175.5,
        "performed_services": "Kablo değiştirildi",
        "items": [{
            "id": case["items"][0]["id"],
            "product_model": {"id": product, "name": "DT-25", "product_type": "Fotosel"},
            "product_count": 2,
            "production_date": "2024-03",
            "has_control_unit": False,
            "warranty_status": "Garanti Dahilinde",
            "fault_responsibility": "Teknik Sorun",
            "resolution_method": "Tamir",
            "cable_check": True,
            "profile_check": False,
            "packaging": True,
            "services": [{
                "id": case["items"][0]["services"][0]["id"],
                "service_definition_id": service,
                "service_name": "Kablo kopması",
                "is_performed": True,
            }],
        }],
    }


def test_list_filters(client_for, customer, product, service):
    support = client_for("SUPPORT")
    first = create_case(support, customer, arrival_date="2024-01-15", receipt_method="in_person")
    second = create_case(support, customer, arrival_date="2024-03-15")
    advance_to(client_for, second, "PAYMENT_COLLECTION", product, service)

    def ids(query):
        return [c["id"] for c in support.get(f"/returns?limit=5&{query}").get_json()["cases"]]

    assert ids("") == [second, first]  # newest arrival first
    assert ids("search=acme") == [second, first]
    assert ids("search=nobody") == []
    assert ids("status=Teslim Alındı") == [first]
    assert ids("status=not_completed") == [second, first]
    assert ids("startDate=2024-02-01") == [second]
    assert ids("endDate=2024-02-01") == [first]
    assert ids("receiptMethod=in_person") == [first]
    assert ids("productType=door_detector") == [second]
    assert ids("productType=overload") == []
    assert ids(f"productModel={product}") == [second]
    # Unknown filter values are ignored rather than rejected.
    assert ids("status=bogus&receiptMethod=bogus") == [second, first]


def test_create_case_validation(client_for, customer):
    support = client_for("SUPPORT")
    res = support.post("/returns/simple", json={"customerId": customer})
    assert res.status_code == 400
    res = support.post("/returns/simple", json={
        "customerId": 9999, "arrivalDate": "2024-05-10", "receiptMethod": "shipment"})
    assert res.status_code == 404


def test_edit_delivered_stage(client_for, customer):
    support = client_for("SUPPORT")
    case_id = create_case(support, customer)
    res = support.put(f"/returns/{case_id}/teslim-alindi", json={
        "arrivalDate": "2024-04-01", "receiptMethod": "Elden Teslim", "notes": "güncellendi"})
    assert res.status_code == 200
    case = db.session.get(ReturnCase, case_id)
    assert case.arrival_date.isoformat() == "2024-04-01"
    assert case.receipt_method.name == "in_person"
    assert case.notes == "güncellendi"

    assert support.put(f"/returns/{case_id}/teslim-alindi", json={"customerId": 9999}).status_code == 404
    assert support.put("/returns/9999/teslim-alindi", json={}).status_code == 404


@pytest.mark.parametrize("endpoint, wrong_status_role", [
    ("complete-teknik-inceleme", "TECHNICIAN"),
    ("complete-odeme-tahsilati", "SALES"),
    ("complete-kargoya-verildi", "LOGISTICS"),
])
def test_cannot_complete_a_stage_out_of_order(client_for, customer, endpoint, wrong_status_role):
    case_id = create_case(client_for("SUPPORT"), customer)  # still DELIVERED
    res = client_for(wrong_status_role).post(f"/returns/{case_id}/{endpoint}")
    assert res.status_code == 400
    assert "Mevcut durum: Teslim Alındı" in res.get_json()["error"]
    assert case_status(case_id) == "DELIVERED"


def test_complete_unknown_case_is_404(client_for):
    assert client_for("SUPPORT").post("/returns/9999/complete-teslim-alindi").status_code == 404


@pytest.mark.parametrize("payload_change, expected_message", [
    ({"items": []}, "en az bir ürün"),
    ({"item": {"product_count": 0}}, "Ürün adeti eksik"),
    ({"item": {"production_date": "2999-01"}}, "gelecekte olamaz"),
    ({"item": {"production_date": "03-2024"}}, "formatı geçersiz"),
    ({"item": {"warranty_status": ""}}, "Garanti durumu eksik"),
    ({"item": {"fault_responsibility": ""}}, "Hata sorumluluğu eksik"),
    ({"item": {"resolution_method": ""}}, "Çözüm yöntemi eksik"),
    ({"item": {"services": []}}, "En az bir hizmet"),
    ({"performed_services": "  "}, "Teknik servis notu eksik"),
])
def test_technical_review_completion_validation(
        client_for, customer, product, service, payload_change, expected_message):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")

    payload = technical_review_payload(product, service)
    if "item" in payload_change:
        if payload_change["item"].get("services") == []:
            payload["items"][0]["services"] = [{"service_definition_id": service, "is_performed": False}]
        else:
            payload["items"][0].update(payload_change["item"])
    else:
        payload.update(payload_change)

    tech = client_for("TECHNICIAN")
    assert tech.put(f"/returns/{case_id}/teknik-inceleme", json=payload).status_code == 200
    res = tech.post(f"/returns/{case_id}/complete-teknik-inceleme")
    assert res.status_code == 400
    assert expected_message in res.get_json()["error"]
    assert case_status(case_id) == "TECHNICAL_REVIEW"


def test_technical_review_save_replaces_items(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")
    tech = client_for("TECHNICIAN")

    tech.put(f"/returns/{case_id}/teknik-inceleme", json=technical_review_payload(product, service))
    payload = technical_review_payload(product, service)
    payload["items"] = [item_payload(product, service, product_count=1),
                        item_payload(product, service, product_count=4)]
    tech.put(f"/returns/{case_id}/teknik-inceleme", json=payload)

    counts = sorted(i.product_count for i in ReturnCaseItem.query.filter_by(return_case_id=case_id))
    assert counts == [1, 4]


def test_payment_stage_requires_paid_or_waived(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "PAYMENT_COLLECTION", product, service)
    sales = client_for("SALES")

    res = sales.post(f"/returns/{case_id}/complete-odeme-tahsilati")
    assert res.status_code == 400 and "Ödeme durumu eksik" in res.get_json()["error"]

    sales.put(f"/returns/{case_id}/odeme-tahsilati", json={"payment_status": "Ödenmedi"})
    res = sales.post(f"/returns/{case_id}/complete-odeme-tahsilati")
    assert res.status_code == 400 and "'Ücretsiz' veya 'Ödendi'" in res.get_json()["error"]

    sales.put(f"/returns/{case_id}/odeme-tahsilati", json={"payment_status": "Ücretsiz"})
    assert sales.post(f"/returns/{case_id}/complete-odeme-tahsilati").status_code == 200
    assert case_status(case_id) == "SHIPPING"


@pytest.mark.parametrize("missing, expected_message", [
    ("shippingInfo", "Kargo bilgisi eksik"),
    ("trackingNumber", "Takip numarası eksik"),
    ("shippingDate", "Kargo tarihi eksik"),
])
def test_shipping_stage_validation(client_for, customer, product, service, missing, expected_message):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "SHIPPING", product, service)
    logistics = client_for("LOGISTICS")

    payload = {"shippingInfo": "Yurtiçi Kargo", "trackingNumber": "TR123", "shippingDate": "2024-05-20"}
    del payload[missing]
    logistics.put(f"/returns/{case_id}/kargoya-verildi", json=payload)
    res = logistics.post(f"/returns/{case_id}/complete-kargoya-verildi")
    assert res.status_code == 400
    assert expected_message in res.get_json()["error"]


@pytest.mark.parametrize("stage, deletable", [
    ("DELIVERED", True), ("TECHNICAL_REVIEW", True),
    ("PAYMENT_COLLECTION", False), ("SHIPPING", False), ("COMPLETED", False),
])
def test_delete_is_only_allowed_in_the_first_two_stages(
        client_for, customer, product, service, stage, deletable):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, stage, product, service)

    res = client_for("SUPPORT").delete(f"/returns/{case_id}")
    if deletable:
        assert res.status_code == 200
        assert db.session.get(ReturnCase, case_id) is None
        # The case's audit log rows go with it.
        assert UserActionLog.query.filter_by(return_case_id=case_id).count() == 0
    else:
        assert res.status_code == 403
        assert db.session.get(ReturnCase, case_id) is not None


def test_customer_email(client_for, customer, product, service, sent_emails):
    case_id = create_case(client_for("SUPPORT"), customer)
    logistics = client_for("LOGISTICS")
    sent_emails.clear()

    res = logistics.post(f"/returns/{case_id}/send-customer-email",
                         json={"emailContent": "Ürününüz kargoda", "recipientEmail": "ali@acme.example"})
    assert res.status_code == 200
    assert sent_emails[0]["to"] == ["ali@acme.example"]
    assert "Ürününüz kargoda" in sent_emails[0]["html"]

    assert logistics.post(f"/returns/{case_id}/send-customer-email",
                          json={"emailContent": "", "recipientEmail": "a@b.co"}).status_code == 400
    assert logistics.post(f"/returns/{case_id}/send-customer-email",
                          json={"emailContent": "x", "recipientEmail": ""}).status_code == 400


def test_service_definitions_for_product_type(client_for):
    tech = client_for("TECHNICIAN")
    body = tech.get("/returns/service-definitions/overload").get_json()
    assert len(body["services"]) == 6
    assert all(s["product_type"] == "Aşırı Yük Sensörü" for s in body["services"])
    assert tech.get("/returns/service-definitions/bogus").status_code == 400


@pytest.mark.parametrize("role, endpoint, payload", [
    ("TECHNICIAN", "teknik-inceleme", {"performed_services": "erken"}),
    ("SALES", "odeme-tahsilati", {"payment_status": "Ödendi"}),
    ("LOGISTICS", "kargoya-verildi", {"trackingNumber": "TR999"}),
    ("MANAGER", "tamamlandi", {"paymentStatus": "Ödendi"}),
])
def test_a_stage_cannot_be_edited_before_the_case_reaches_it(client_for, customer, role, endpoint, payload):
    case_id = create_case(client_for("SUPPORT"), customer)  # still DELIVERED
    res = client_for(role).put(f"/returns/{case_id}/{endpoint}", json=payload)
    assert res.status_code == 400
    assert "henüz düzenlenemez" in res.get_json()["error"]
    case = db.session.get(ReturnCase, case_id)
    assert (case.performed_services, case.payment_status, case.tracking_number) == (None, None, None)


def test_earlier_stages_stay_editable_after_the_case_moves_on(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "SHIPPING", product, service)

    res = client_for("SUPPORT").put(f"/returns/{case_id}/teslim-alindi", json={"notes": "sonradan"})
    assert res.status_code == 200
    res = client_for("TECHNICIAN").put(f"/returns/{case_id}/teknik-inceleme", json={"performed_services": "düzeltme"})
    assert res.status_code == 200
    case = db.session.get(ReturnCase, case_id)
    assert (case.notes, case.performed_services) == ("sonradan", "düzeltme")
    assert case_status(case_id) == "SHIPPING"


def test_manager_can_change_payment_status_on_a_completed_case(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "COMPLETED", product, service)

    res = client_for("MANAGER").put(f"/returns/{case_id}/tamamlandi", json={"paymentStatus": "Ücretsiz"})
    assert res.status_code == 200
    assert db.session.get(ReturnCase, case_id).payment_status.name == "waived"
    assert client_for("SALES").put(f"/returns/{case_id}/tamamlandi", json={"paymentStatus": "Ödendi"}).status_code == 403


def test_list_requires_login(client_for):
    assert client_for(None).get("/returns").status_code == 401


# --- Exact wording of responses (the interface shows these to users) ---------

def test_stage_response_messages(client_for, customer, product, service):
    support, tech = client_for("SUPPORT"), client_for("TECHNICIAN")
    sales, logistics = client_for("SALES"), client_for("LOGISTICS")
    case_id = create_case(support, customer)
    url = f"/returns/{case_id}"

    def message(res):
        assert res.status_code == 200, res.get_data(as_text=True)
        return res.get_json()["message"]

    assert message(support.put(f"{url}/teslim-alindi", json={"notes": "n"})) == \
        "Teslim Alındı bilgileri güncellendi"
    assert message(support.post(f"{url}/complete-teslim-alindi")) == \
        "Teslim Alındı aşaması tamamlandı, durum Teknik İnceleme olarak güncellendi"
    assert message(tech.put(f"{url}/teknik-inceleme", json=technical_review_payload(product, service))) == \
        "Teknik İnceleme bilgileri güncellendi"
    assert message(tech.post(f"{url}/complete-teknik-inceleme")) == \
        "Teknik İnceleme aşaması tamamlandı, durum Ödeme Tahsilatı olarak güncellendi"
    assert message(sales.put(f"{url}/odeme-tahsilati", json={"payment_status": "Ödendi"})) == \
        "Ödeme tahsilatı bilgileri güncellendi"
    assert message(sales.post(f"{url}/complete-odeme-tahsilati")) == \
        "Ödeme tahsilatı aşaması tamamlandı, durum Kargoya Veriliyor olarak güncellendi"
    assert message(logistics.put(f"{url}/kargoya-verildi", json={
        "shippingInfo": "Aras", "trackingNumber": "T1", "shippingDate": "2024-05-20"})) == \
        "Kargo bilgileri güncellendi"
    assert message(logistics.post(f"{url}/complete-kargoya-verildi")) == \
        "Kargoya Verildi aşaması tamamlandı, durum Tamamlandı olarak güncellendi"
    assert message(client_for("MANAGER").put(f"{url}/tamamlandi", json={"paymentStatus": "Ödendi"})) == \
        "Tamamlandı bilgileri güncellendi"


def test_enum_fields_accept_the_turkish_label_or_the_key(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")
    tech = client_for("TECHNICIAN")

    payload = technical_review_payload(
        product, service, warranty_status="out_of_warranty", fault_responsibility="Karışık", resolution_method="")
    assert tech.put(f"/returns/{case_id}/teknik-inceleme", json=payload).status_code == 200
    item = ReturnCaseItem.query.filter_by(return_case_id=case_id).one()
    assert (item.warranty_status.name, item.fault_responsibility.name, item.resolution_method) == \
        ("out_of_warranty", "mixed", None)

    # A value that is neither a label nor a key fails the whole save and changes nothing.
    bad = technical_review_payload(product, service, warranty_status="bogus")
    res = tech.put(f"/returns/{case_id}/teknik-inceleme", json=bad)
    assert res.status_code == 500 and res.get_json()["error"].startswith("Bir hata oluştu")
    assert ReturnCaseItem.query.filter_by(return_case_id=case_id).one().warranty_status.name == "out_of_warranty"

    support = client_for("SUPPORT")
    assert support.put(f"/returns/{case_id}/teslim-alindi", json={"receiptMethod": "in_person"}).status_code == 200
    assert support.put(f"/returns/{case_id}/teslim-alindi", json={"receiptMethod": ""}).status_code == 500
    assert db.session.get(ReturnCase, case_id).receipt_method.name == "in_person"


def test_technical_review_partial_update_keeps_items_and_recomputes_cost(client_for, customer, product, service):
    case_id = create_case(client_for("SUPPORT"), customer)
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")
    tech = client_for("TECHNICIAN")
    tech.put(f"/returns/{case_id}/teknik-inceleme", json=technical_review_payload(product, service))

    assert tech.put(f"/returns/{case_id}/teknik-inceleme", json={"bakim": None, "iscilik": 10}).status_code == 200
    case = db.session.get(ReturnCase, case_id)
    assert (float(case.yedek_parca), float(case.bakim), float(case.iscilik), float(case.cost)) == (100, 0, 10, 110)
    assert len(case.items) == 1


def test_final_completion_when_a_role_holds_the_permission(client_for, customer, product, service, sent_emails):
    """No seeded role holds CASE_COMPLETE_COMPLETED. This grants it to
    LOGISTICS inside the test only, to cover what the endpoint does."""
    from models import AppPermissions, Permission, Role, RolePermission, UserRole
    role = Role.query.filter_by(name=UserRole.LOGISTICS).one()
    perm = Permission.query.filter_by(name=AppPermissions.CASE_COMPLETE_COMPLETED).one()
    db.session.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.session.commit()

    logistics = client_for("LOGISTICS")
    case_id = create_case(client_for("SUPPORT"), customer)
    res = logistics.post(f"/returns/{case_id}/complete-tamamlandi")
    assert res.status_code == 400 and "Mevcut durum: Teslim Alındı" in res.get_json()["error"]

    advance_to(client_for, case_id, "COMPLETED", product, service)
    db.session.get(ReturnCase, case_id).payment_status = None
    db.session.commit()
    res = logistics.post(f"/returns/{case_id}/complete-tamamlandi")
    assert res.status_code == 400 and "Ödeme durumu eksik" in res.get_json()["error"]

    client_for("MANAGER").put(f"/returns/{case_id}/tamamlandi", json={"paymentStatus": "Ödendi"})
    sent_emails.clear()
    res = logistics.post(f"/returns/{case_id}/complete-tamamlandi")
    assert res.status_code == 200
    assert res.get_json()["message"] == "Tamamlandı aşaması tamamlandı"
    # Managers and admins are told the case is finished.
    assert sorted(sent_emails[0]["to"]) == ["admin@example.com", "manager@example.com"]
    assert case_status(case_id) == "COMPLETED"


# --- The case list: paging and efficiency -------------------------------------

def test_product_filter_counts_a_case_once_however_many_items_match(client_for, customer, product, service):
    support, tech = client_for("SUPPORT"), client_for("TECHNICIAN")
    case_ids = []
    for _ in range(3):
        case_id = create_case(support, customer)
        advance_to(client_for, case_id, "TECHNICAL_REVIEW")
        payload = technical_review_payload(product, service)
        payload["items"] = [item_payload(product, service), item_payload(product, service), item_payload(product, service)]
        assert tech.put(f"/returns/{case_id}/teknik-inceleme", json=payload).status_code == 200
        case_ids.append(case_id)

    body = support.get("/returns?limit=2&page=1&productType=door_detector").get_json()
    assert body["totalItems"] == 3
    assert body["totalPages"] == 2
    assert [c["id"] for c in body["cases"]] == [case_ids[2], case_ids[1]]
    assert all(len(c["items"]) == 3 for c in body["cases"])

    body = support.get(f"/returns?limit=2&page=2&productModel={product}").get_json()
    assert [c["id"] for c in body["cases"]] == [case_ids[0]]


def test_listing_cases_does_not_query_per_item(app, client_for, customer, product, service):
    from sqlalchemy import event

    support, tech = client_for("SUPPORT"), client_for("TECHNICIAN")

    def add_cases(count):
        for _ in range(count):
            case_id = create_case(support, customer)
            advance_to(client_for, case_id, "TECHNICAL_REVIEW")
            payload = technical_review_payload(product, service)
            payload["items"] = [item_payload(product, service) for _ in range(3)]
            tech.put(f"/returns/{case_id}/teknik-inceleme", json=payload)

    def queries_for_list():
        statements = []

        def record(conn, cursor, statement, parameters, context, executemany):
            statements.append(statement)

        event.listen(db.engine, "before_cursor_execute", record)
        try:
            assert support.get("/returns?limit=5").status_code == 200
        finally:
            event.remove(db.engine, "before_cursor_execute", record)
        return len(statements)

    add_cases(1)
    with_one_case = queries_for_list()
    add_cases(4)
    with_five_cases = queries_for_list()
    # More cases and items must not mean more queries.
    assert with_five_cases == with_one_case
    assert with_five_cases <= 10
