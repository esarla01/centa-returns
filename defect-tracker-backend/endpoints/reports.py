from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import (
    db, ReturnCase, ReturnCaseItem, Customers, ProductModel,
    ServiceDefinition, ReturnCaseItemService, ProductTypeEnum,
    FaultResponsibilityEnum, ResolutionMethodEnum
)
from datetime import datetime
from dateutil.relativedelta import relativedelta

reports_bp = Blueprint("reports", __name__)


def parse_date_range():
    start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
    end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    return start_date, end_date


def date_filtered_items():
    """Base query joining ReturnCaseItem -> ReturnCase, filtered by arrival_date."""
    start_date, end_date = parse_date_range()
    query = (
        db.session.query(ReturnCaseItem)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
    )
    return query, start_date, end_date


def pct(count, total):
    return round((count / total) * 100, 2) if total > 0 else 0


@reports_bp.route("/reports/items-by-customer", methods=["GET"])
def items_by_customer():
    try:
        start_date, end_date = parse_date_range()
        product_type_filter = request.args.get("product_type", "")
        customer_id_filter = request.args.get("customer_id", "")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
        db.session.query(
            Customers.id.label("customer_id"),
            Customers.name.label("customer_name"),
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCase, ReturnCase.customer_id == Customers.id)
        .join(ReturnCaseItem, ReturnCaseItem.return_case_id == ReturnCase.id)
        .join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
    )

    if product_type_filter and product_type_filter in ProductTypeEnum._member_map_:
        query = query.filter(ProductModel.product_type == ProductTypeEnum[product_type_filter])

    if customer_id_filter:
        try:
            query = query.filter(Customers.id == int(customer_id_filter))
        except ValueError:
            return jsonify({"error": "Invalid customer_id"}), 400

    # Total items across ALL customers (before limiting to top 5)
    total_query = (
        db.session.query(func.sum(ReturnCaseItem.product_count))
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
    )
    if product_type_filter and product_type_filter in ProductTypeEnum._member_map_:
        total_query = total_query.join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id).filter(ProductModel.product_type == ProductTypeEnum[product_type_filter])
    total_items = total_query.scalar() or 0

    results_data = (
        query.group_by(Customers.id, Customers.name)
        .order_by(func.sum(ReturnCaseItem.product_count).desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_items": total_items,
        "data": [
            {
                "customer_id": row.customer_id,
                "customer_name": row.customer_name,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }
            for row in results_data
        ]
    })


@reports_bp.route("/reports/items-by-product-model", methods=["GET"])
def items_by_product_model():
    try:
        start_date, end_date = parse_date_range()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    results = (
        db.session.query(
            ProductModel.name.label("product_model_name"),
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCaseItem, ReturnCaseItem.product_model_id == ProductModel.id)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .group_by(ProductModel.name)
        .all()
    )

    total_items = sum(row.item_count for row in results)
    return jsonify({
        "total_items": total_items,
        "data": [
            {
                "product_model_name": row.product_model_name,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }
            for row in results
        ]
    })


@reports_bp.route("/reports/returns-breakdown", methods=["GET"])
def returns_breakdown():
    try:
        start_date, end_date = parse_date_range()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    delta_days = (end_date - start_date).days
    group_unit = "month" if delta_days >= 30 else "week"
    date_fmt = "YYYY-MM" if group_unit == "month" else "IYYY-IW"

    results = (
        db.session.query(
            func.to_char(ReturnCase.arrival_date, date_fmt).label("period"),
            ProductModel.name.label("product_model"),
            Customers.name.label("customer_name"),
            func.sum(ReturnCaseItem.product_count).label("return_count")
        )
        .join(ReturnCase, ReturnCaseItem.return_case_id == ReturnCase.id)
        .join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)
        .join(Customers, Customers.id == ReturnCase.customer_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .group_by("period", "product_model", "customer_name")
        .order_by("period")
        .all()
    )

    customers = set()
    product_models = set()
    for row in results:
        customers.add(row.customer_name)
        product_models.add(row.product_model)

    all_keys = {f"{m}|{c}" for m in product_models for c in customers}
    period_data = {}
    for row in results:
        entry = period_data.setdefault(row.period, {"period": row.period, **{k: 0 for k in all_keys}})
        entry[f"{row.product_model}|{row.customer_name}"] = row.return_count

    return jsonify({
        "group_unit": group_unit,
        "data": list(period_data.values()),
        "customers": list(customers),
        "productModels": list(product_models)
    })


@reports_bp.route("/reports/defects-by-production-month", methods=["GET"])
def defects_by_production_month():
    try:
        start_date, end_date = parse_date_range()
        product_type_filter = request.args.get("product_type", "")
        product_model_id_filter = request.args.get("product_model_id", "")
        service_id_filter = request.args.get("service_id", "")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if (end_date - start_date).days < 30:
        return jsonify({"error": "Date range must be at least one month", "data": []}), 400

    months_in_range = []
    current_date = start_date.replace(day=1)
    while current_date <= end_date:
        months_in_range.append(current_date.strftime("%Y-%m"))
        current_date += relativedelta(months=1)

    query = (
        db.session.query(
            func.substring(ReturnCaseItem.production_date, 1, 7).label("production_month"),
            func.sum(ReturnCaseItem.product_count).label("defect_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItem.production_date.isnot(None))
    )

    if product_type_filter and product_type_filter in ProductTypeEnum._member_map_:
        query = query.filter(ProductModel.product_type == ProductTypeEnum[product_type_filter])

    if product_model_id_filter:
        try:
            query = query.filter(ReturnCaseItem.product_model_id == int(product_model_id_filter))
        except ValueError:
            return jsonify({"error": "Invalid product_model_id"}), 400

    if service_id_filter:
        try:
            query = (
                query.join(ReturnCaseItemService, ReturnCaseItemService.return_case_item_id == ReturnCaseItem.id)
                .filter(ReturnCaseItemService.service_definition_id == int(service_id_filter))
                .filter(ReturnCaseItemService.is_performed == True)
            )
        except ValueError:
            return jsonify({"error": "Invalid service_id"}), 400

    defect_counts = {
        row.production_month: row.defect_count
        for row in query.group_by(func.substring(ReturnCaseItem.production_date, 1, 7)).all()
    }

    return jsonify({
        "data": [{"month": m, "defect_count": defect_counts.get(m, 0)} for m in months_in_range]
    })


@reports_bp.route("/reports/fault-responsibility-stats", methods=["GET"])
def fault_responsibility_stats():
    try:
        start_date, end_date = parse_date_range()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
        db.session.query(
            ReturnCaseItem.fault_responsibility,
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItem.fault_responsibility.isnot(None))
        .group_by(ReturnCaseItem.fault_responsibility)
        .all()
    )

    total_items = (
        db.session.query(func.sum(ReturnCaseItem.product_count))
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .scalar()
    ) or 0

    fault_stats = {
        ft.value: {"fault_responsibility": ft.value, "item_count": 0, "percentage": 0}
        for ft in FaultResponsibilityEnum
    }
    for row in query:
        if row.fault_responsibility:
            fault_stats[row.fault_responsibility.value] = {
                "fault_responsibility": row.fault_responsibility.value,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }

    return jsonify({"total_items": total_items, "data": list(fault_stats.values())})


@reports_bp.route("/reports/service-type-stats", methods=["GET"])
def service_type_stats():
    return jsonify({"service_stats": {}, "total_items": 0}), 200


@reports_bp.route("/reports/resolution-method-stats", methods=["GET"])
def resolution_method_stats():
    try:
        start_date, end_date = parse_date_range()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
        db.session.query(
            ReturnCaseItem.resolution_method,
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItem.resolution_method.isnot(None))
        .group_by(ReturnCaseItem.resolution_method)
        .all()
    )

    total_items = (
        db.session.query(func.sum(ReturnCaseItem.product_count))
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .scalar()
    ) or 0

    resolution_stats = {
        rt.value: {"resolution_method": rt.value, "item_count": 0, "percentage": 0}
        for rt in ResolutionMethodEnum
    }
    for row in query:
        if row.resolution_method:
            resolution_stats[row.resolution_method.value] = {
                "resolution_method": row.resolution_method.value,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }

    return jsonify({"total_items": total_items, "data": list(resolution_stats.values())})


@reports_bp.route("/reports/product-type-stats", methods=["GET"])
def product_type_stats():
    try:
        start_date, end_date = parse_date_range()
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
        db.session.query(
            ProductModel.product_type,
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCaseItem, ReturnCaseItem.product_model_id == ProductModel.id)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .group_by(ProductModel.product_type)
        .all()
    )

    total_items = sum(row.item_count for row in query)
    product_stats = {
        pt.value: {"product_type": pt.value, "item_count": 0, "percentage": 0}
        for pt in ProductTypeEnum
    }
    for row in query:
        if row.product_type:
            product_stats[row.product_type.value] = {
                "product_type": row.product_type.value,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }

    return jsonify({"total_items": total_items, "data": list(product_stats.values())})


@reports_bp.route("/reports/top-defects", methods=["GET"])
def top_defects():
    try:
        start_date, end_date = parse_date_range()
        product_type_filter = request.args.get("product_type", "")
        service_id_filter = request.args.get("service_id", "")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid parameters"}), 400

    query = (
        db.session.query(
            ServiceDefinition.service_name,
            ServiceDefinition.product_type,
            func.sum(ReturnCaseItem.product_count).label("occurrence_count")
        )
        .join(ReturnCaseItemService, ReturnCaseItemService.service_definition_id == ServiceDefinition.id)
        .join(ReturnCaseItem, ReturnCaseItem.id == ReturnCaseItemService.return_case_item_id)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItemService.is_performed == True)
    )

    # Total items in date range (no service join)
    total_items_query = (
        db.session.query(func.sum(ReturnCaseItem.product_count))
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
    )

    # Total service occurrences (with service join) — used as percentage denominator
    total_service_query = (
        db.session.query(func.sum(ReturnCaseItem.product_count))
        .join(ReturnCaseItemService, ReturnCaseItemService.return_case_item_id == ReturnCaseItem.id)
        .join(ServiceDefinition, ServiceDefinition.id == ReturnCaseItemService.service_definition_id)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItemService.is_performed == True)
    )

    if product_type_filter and product_type_filter in ProductTypeEnum._member_map_:
        pt = ProductTypeEnum[product_type_filter]
        query = query.filter(ServiceDefinition.product_type == pt)
        total_items_query = total_items_query.join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id).filter(ProductModel.product_type == pt)
        total_service_query = total_service_query.filter(ServiceDefinition.product_type == pt)

    if service_id_filter:
        try:
            query = query.filter(ServiceDefinition.id == int(service_id_filter))
        except ValueError:
            return jsonify({"error": "Invalid service_id"}), 400

    total_items = total_items_query.scalar() or 0
    total_service_occurrences = total_service_query.scalar() or 0
    results = (
        query.group_by(ServiceDefinition.service_name, ServiceDefinition.product_type)
        .order_by(func.sum(ReturnCaseItem.product_count).desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_items": total_items,
        "total_service_occurrences": total_service_occurrences,
        "data": [
            {
                "service_name": row.service_name,
                "product_type": row.product_type.value,
                "occurrence_count": row.occurrence_count,
                "percentage": pct(row.occurrence_count, total_service_occurrences)
            }
            for row in results
        ]
    })


@reports_bp.route("/reports/production-date-distribution", methods=["GET"])
def production_date_distribution():
    try:
        start_date, end_date = parse_date_range()
        product_type_filter = request.args.get("product_type", "")
        product_model_id_filter = request.args.get("product_model_id", "")
        service_id_filter = request.args.get("service_id", "")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
        db.session.query(
            ReturnCaseItem.production_date.label("production_month"),
            ProductModel.product_type,
            ProductModel.name.label("product_model"),
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItem.production_date.isnot(None))
    )

    if product_type_filter and product_type_filter in ProductTypeEnum._member_map_:
        query = query.filter(ProductModel.product_type == ProductTypeEnum[product_type_filter])

    if product_model_id_filter:
        try:
            query = query.filter(ReturnCaseItem.product_model_id == int(product_model_id_filter))
        except ValueError:
            return jsonify({"error": "Invalid product_model_id"}), 400

    if service_id_filter:
        try:
            query = (
                query.join(ReturnCaseItemService, ReturnCaseItemService.return_case_item_id == ReturnCaseItem.id)
                .filter(ReturnCaseItemService.service_definition_id == int(service_id_filter))
                .filter(ReturnCaseItemService.is_performed == True)
            )
        except ValueError:
            return jsonify({"error": "Invalid service_id"}), 400

    results = (
        query.group_by(ReturnCaseItem.production_date, ProductModel.product_type, ProductModel.name)
        .order_by(ReturnCaseItem.production_date)
        .all()
    )
    total_items = sum(row.item_count for row in results)

    return jsonify({
        "total_items": total_items,
        "data": [
            {
                "production_month": row.production_month,
                "product_type": row.product_type.value,
                "product_model": row.product_model,
                "item_count": row.item_count,
                "percentage": pct(row.item_count, total_items)
            }
            for row in results
        ]
    })
