"""Statistics endpoints, checked against a small hand-computed data set.

Data inside the reporting window (2024-03-01 .. 2024-04-30):
  Case 1  Acme, arrived 2024-03-05
            4 x DT-25 (Fotosel), produced 2023-11, technical issue, repair, "Kablo kopması" performed
  Case 2  Beta, arrived 2024-04-10
            2 x OL-1 (Aşırı Yük Sensörü), produced 2024-03, user error, free replacement,
                "Mekanik darbe hasarı" performed
            1 x DT-25, produced 2023-11, technical issue, repair, "Kablo kopması" listed but NOT performed
Outside the window:
  Case 3  Acme, arrived 2023-01-01, 10 x DT-25
"""
from datetime import date

import pytest

from models import (
    Customers, FaultResponsibilityEnum, ProductModel, ProductTypeEnum, ResolutionMethodEnum,
    ReturnCase, ReturnCaseItem, ReturnCaseItemService, ServiceDefinition, db,
)

QS = "?start_date=2024-03-01&end_date=2024-04-30"


@pytest.fixture
def data(app):
    acme = Customers(name="Acme")
    beta = Customers(name="Beta")
    dt25 = ProductModel(name="DT-25", product_type=ProductTypeEnum.door_detector)
    ol1 = ProductModel(name="OL-1", product_type=ProductTypeEnum.overload)
    db.session.add_all([acme, beta, dt25, ol1])
    db.session.flush()
    cable = ServiceDefinition.query.filter_by(
        product_type=ProductTypeEnum.door_detector, service_name="Kablo kopması").one()
    impact = ServiceDefinition.query.filter_by(
        product_type=ProductTypeEnum.overload, service_name="Mekanik darbe hasarı").one()

    def item(case, model, count, produced, fault, resolution, service, performed):
        row = ReturnCaseItem(
            return_case=case, product_model_id=model.id, product_count=count, production_date=produced,
            fault_responsibility=fault, resolution_method=resolution)
        row.services.append(ReturnCaseItemService(service_definition_id=service.id, is_performed=performed))
        db.session.add(row)

    tech, user = FaultResponsibilityEnum.technical_issue, FaultResponsibilityEnum.user_error
    repair, free = ResolutionMethodEnum.repair, ResolutionMethodEnum.free_replacement

    case1 = ReturnCase(customer_id=acme.id, arrival_date=date(2024, 3, 5))
    case2 = ReturnCase(customer_id=beta.id, arrival_date=date(2024, 4, 10))
    case3 = ReturnCase(customer_id=acme.id, arrival_date=date(2023, 1, 1))
    db.session.add_all([case1, case2, case3])
    item(case1, dt25, 4, "2023-11", tech, repair, cable, True)
    item(case2, ol1, 2, "2024-03", user, free, impact, True)
    item(case2, dt25, 1, "2023-11", tech, repair, cable, False)
    item(case3, dt25, 10, "2022-06", tech, repair, cable, True)
    db.session.commit()
    return {"acme": acme.id, "beta": beta.id, "dt25": dt25.id, "ol1": ol1.id,
            "cable": cable.id, "impact": impact.id}


@pytest.fixture
def get(client_for):
    def fetch(path):
        res = client_for("MANAGER").get(path)
        assert res.status_code == 200, res.get_data(as_text=True)
        return res.get_json()
    return fetch


def test_items_by_customer(get, data):
    assert get("/reports/items-by-customer" + QS) == {
        "total_items": 7,
        "data": [
            {"customer_id": data["acme"], "customer_name": "Acme", "item_count": 4, "percentage": 57.14},
            {"customer_id": data["beta"], "customer_name": "Beta", "item_count": 3, "percentage": 42.86},
        ],
    }
    filtered = get("/reports/items-by-customer" + QS + "&product_type=overload")
    assert filtered == {
        "total_items": 2,
        "data": [{"customer_id": data["beta"], "customer_name": "Beta", "item_count": 2, "percentage": 100.0}],
    }
    one = get("/reports/items-by-customer" + QS + f"&customer_id={data['acme']}")
    # The total stays the all-customer total, so the share is still 57.14%.
    assert one["total_items"] == 7
    assert [(r["customer_name"], r["percentage"]) for r in one["data"]] == [("Acme", 57.14)]


def test_items_by_product_model(get, data):
    body = get("/reports/items-by-product-model" + QS)
    assert body["total_items"] == 7
    assert sorted(body["data"], key=lambda r: r["product_model_name"]) == [
        {"product_model_name": "DT-25", "item_count": 5, "percentage": 71.43},
        {"product_model_name": "OL-1", "item_count": 2, "percentage": 28.57},
    ]


def test_returns_breakdown(get, data):
    body = get("/reports/returns-breakdown" + QS)
    assert body["group_unit"] == "month"
    assert sorted(body["customers"]) == ["Acme", "Beta"]
    assert sorted(body["productModels"]) == ["DT-25", "OL-1"]
    assert body["data"] == [
        {"period": "2024-03", "DT-25|Acme": 4, "DT-25|Beta": 0, "OL-1|Acme": 0, "OL-1|Beta": 0},
        {"period": "2024-04", "DT-25|Acme": 0, "DT-25|Beta": 1, "OL-1|Acme": 0, "OL-1|Beta": 2},
    ]
    weekly = get("/reports/returns-breakdown?start_date=2024-03-01&end_date=2024-03-20")
    assert weekly["group_unit"] == "week"
    assert weekly["data"] == [{"period": "2024-10", "DT-25|Acme": 4}]


def test_defects_by_production_month(get, data, client_for):
    # Only production months that fall inside the selected window are listed.
    assert get("/reports/defects-by-production-month" + QS) == {
        "data": [{"month": "2024-03", "defect_count": 2}, {"month": "2024-04", "defect_count": 0}]}
    assert get("/reports/defects-by-production-month" + QS + "&product_type=door_detector") == {
        "data": [{"month": "2024-03", "defect_count": 0}, {"month": "2024-04", "defect_count": 0}]}
    assert get("/reports/defects-by-production-month" + QS + f"&service_id={data['impact']}") == {
        "data": [{"month": "2024-03", "defect_count": 2}, {"month": "2024-04", "defect_count": 0}]}

    short = client_for("MANAGER").get(
        "/reports/defects-by-production-month?start_date=2024-03-01&end_date=2024-03-10")
    assert short.status_code == 400


def test_fault_responsibility_stats(get, data):
    assert get("/reports/fault-responsibility-stats" + QS) == {
        "total_items": 7,
        "data": [
            {"fault_responsibility": "Kullanıcı Hatası", "item_count": 2, "percentage": 28.57},
            {"fault_responsibility": "Teknik Sorun", "item_count": 5, "percentage": 71.43},
            {"fault_responsibility": "Karışık", "item_count": 0, "percentage": 0},
            {"fault_responsibility": "Bilinmiyor", "item_count": 0, "percentage": 0},
        ],
    }


def test_resolution_method_stats(get, data):
    assert get("/reports/resolution-method-stats" + QS) == {
        "total_items": 7,
        "data": [
            {"resolution_method": "Tamir", "item_count": 5, "percentage": 71.43},
            {"resolution_method": "Bedelsiz Değişim", "item_count": 2, "percentage": 28.57},
            {"resolution_method": "Eski Ürün (Yok)", "item_count": 0, "percentage": 0},
            {"resolution_method": "Bilinmiyor", "item_count": 0, "percentage": 0},
        ],
    }


def test_product_type_stats(get, data):
    assert get("/reports/product-type-stats" + QS) == {
        "total_items": 7,
        "data": [
            {"product_type": "Aşırı Yük Sensörü", "item_count": 2, "percentage": 28.57},
            {"product_type": "Fotosel", "item_count": 5, "percentage": 71.43},
            {"product_type": "Kontrol Ünitesi", "item_count": 0, "percentage": 0},
        ],
    }


def test_top_defects(get, data):
    assert get("/reports/top-defects" + QS) == {
        "total_items": 7,
        "total_service_occurrences": 6,
        "data": [
            {"service_name": "Kablo kopması", "product_type": "Fotosel",
             "occurrence_count": 4, "percentage": 66.67},
            {"service_name": "Mekanik darbe hasarı", "product_type": "Aşırı Yük Sensörü",
             "occurrence_count": 2, "percentage": 33.33},
        ],
    }
    filtered = get("/reports/top-defects" + QS + "&product_type=overload")
    assert filtered["total_items"] == 2
    assert filtered["total_service_occurrences"] == 2
    assert [r["service_name"] for r in filtered["data"]] == ["Mekanik darbe hasarı"]


def test_production_date_distribution(get, data):
    assert get("/reports/production-date-distribution" + QS) == {
        "total_items": 7,
        "data": [
            {"production_month": "2023-11", "product_type": "Fotosel", "product_model": "DT-25",
             "item_count": 5, "percentage": 71.43},
            {"production_month": "2024-03", "product_type": "Aşırı Yük Sensörü", "product_model": "OL-1",
             "item_count": 2, "percentage": 28.57},
        ],
    }
    by_model = get("/reports/production-date-distribution" + QS + f"&product_model_id={data['ol1']}")
    assert by_model["total_items"] == 2
    by_service = get("/reports/production-date-distribution" + QS + f"&service_id={data['cable']}")
    assert by_service["total_items"] == 4  # the unperformed "Kablo kopması" row is not counted


def test_service_type_stats_is_an_empty_stub(get):
    assert get("/reports/service-type-stats") == {"service_stats": {}, "total_items": 0}


@pytest.mark.parametrize("path", [
    "items-by-customer", "items-by-product-model", "returns-breakdown", "defects-by-production-month",
    "fault-responsibility-stats", "resolution-method-stats", "product-type-stats", "top-defects",
    "production-date-distribution",
])
def test_bad_or_missing_dates_are_rejected(client_for, path):
    client = client_for("MANAGER")
    assert client.get(f"/reports/{path}").status_code == 400
    assert client.get(f"/reports/{path}?start_date=01.03.2024&end_date=2024-04-30").status_code == 400


def test_reports_require_the_statistics_permission(client_for):
    assert client_for(None).get("/reports/product-type-stats" + QS).status_code == 401
    assert client_for("TECHNICIAN").get("/reports/product-type-stats" + QS).status_code == 403
    # A CORS preflight carries no cookie and must still get through.
    assert client_for(None).options("/reports/product-type-stats" + QS).status_code == 200
