"""Statistics for the reports page.

Every report covers the cases that ARRIVED inside a date range and counts
product units (an item's product_count), not rows. The shared pieces are at
the top: reading the range, the base query, and the optional filters.
"""
from datetime import datetime
from functools import wraps

from dateutil.relativedelta import relativedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from models import (
    AppPermissions, Customers, FaultResponsibilityEnum, ProductModel, ProductTypeEnum,
    ResolutionMethodEnum, ReturnCase, ReturnCaseItem, ReturnCaseItemService,
    ServiceDefinition, db,
)
from permissions import permission_required

reports_bp = Blueprint("reports", __name__)

UNITS = func.sum(ReturnCaseItem.product_count)


@permission_required(AppPermissions.PAGE_VIEW_STATISTICS)
def _check_statistics_permission():
    return None


@reports_bp.before_request
def require_statistics_permission():
    # CORS preflight requests carry no cookie and must pass through.
    if request.method == "OPTIONS":
        return None
    return _check_statistics_permission()


# --- Shared building blocks --------------------------------------------------

class BadFilter(Exception):
    """A query-string value that cannot be used; becomes a 400 response."""


def report(fn):
    """Read start_date/end_date, pass them to the report, and turn bad input
    into a 400 response."""
    @wraps(fn)
    def wrapper():
        try:
            start = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
            end = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        try:
            return fn(start, end)
        except BadFilter as problem:
            return jsonify({"error": str(problem)}), 400
    return wrapper


def items_in_range(start, end, *columns):
    """Base query: the given columns over items whose case arrived in range."""
    return (
        db.session.query(*columns)
        .select_from(ReturnCaseItem)
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start)
        .filter(ReturnCase.arrival_date <= end)
    )


def with_product_model(query):
    return query.join(ProductModel, ProductModel.id == ReturnCaseItem.product_model_id)


def with_customer(query):
    return query.join(Customers, Customers.id == ReturnCase.customer_id)


def with_performed_services(query):
    """One row per fault type that was actually found on an item."""
    return (
        query
        .join(ReturnCaseItemService, ReturnCaseItemService.return_case_item_id == ReturnCaseItem.id)
        .filter(ReturnCaseItemService.is_performed.is_(True))
    )


def product_type_arg():
    """The product_type filter, or None. An unknown value is ignored."""
    value = request.args.get("product_type", "")
    return ProductTypeEnum[value] if value in ProductTypeEnum.__members__ else None


def int_arg(name):
    """An optional whole-number filter; anything else is a 400."""
    value = request.args.get(name, "")
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        raise BadFilter(f"Invalid {name}")


def total_units(query):
    return query.scalar() or 0


def pct(count, total):
    return round((count / total) * 100, 2) if total > 0 else 0


def distribution(start, end, column, enum_class, key):
    """Units per value of an enum column, listing every possible value (zero
    when unused). Percentages are of all units in range, including items
    where the column is still empty."""
    rows = (
        items_in_range(start, end, column, UNITS.label("item_count"))
        .filter(column.isnot(None))
        .group_by(column)
        .all()
    )
    total = total_units(items_in_range(start, end, UNITS))
    counts = {row[0]: row.item_count for row in rows}
    return jsonify({
        "total_items": total,
        "data": [
            {key: member.value,
             "item_count": counts.get(member, 0),
             "percentage": pct(counts[member], total) if member in counts else 0}
            for member in enum_class
        ],
    })


def production_filters(query):
    """Filters shared by the two production-date reports. Expects the query
    to be joined to ProductModel already."""
    product_type = product_type_arg()
    if product_type:
        query = query.filter(ProductModel.product_type == product_type)
    product_model_id = int_arg("product_model_id")
    if product_model_id is not None:
        query = query.filter(ReturnCaseItem.product_model_id == product_model_id)
    service_id = int_arg("service_id")
    if service_id is not None:
        query = with_performed_services(query).filter(
            ReturnCaseItemService.service_definition_id == service_id)
    return query


# --- Reports -----------------------------------------------------------------

@reports_bp.route("/reports/items-by-customer", methods=["GET"])
@report
def items_by_customer(start, end):
    """Top five customers by returned units."""
    product_type = product_type_arg()
    customer_id = int_arg("customer_id")

    def scoped(query):
        if product_type:
            query = with_product_model(query).filter(ProductModel.product_type == product_type)
        return query

    # The total covers all customers, so a single customer's share stays
    # meaningful when the list is narrowed to that customer.
    total = total_units(scoped(items_in_range(start, end, UNITS)))

    query = scoped(with_customer(items_in_range(
        start, end,
        Customers.id.label("customer_id"), Customers.name.label("customer_name"), UNITS.label("item_count"),
    )))
    if customer_id is not None:
        query = query.filter(Customers.id == customer_id)
    rows = query.group_by(Customers.id, Customers.name).order_by(UNITS.desc()).limit(5).all()

    return jsonify({
        "total_items": total,
        "data": [
            {"customer_id": row.customer_id, "customer_name": row.customer_name,
             "item_count": row.item_count, "percentage": pct(row.item_count, total)}
            for row in rows
        ],
    })


@reports_bp.route("/reports/items-by-product-model", methods=["GET"])
@report
def items_by_product_model(start, end):
    rows = (
        with_product_model(items_in_range(
            start, end, ProductModel.name.label("product_model_name"), UNITS.label("item_count")))
        .group_by(ProductModel.name)
        .all()
    )
    total = sum(row.item_count for row in rows)
    return jsonify({
        "total_items": total,
        "data": [
            {"product_model_name": row.product_model_name, "item_count": row.item_count,
             "percentage": pct(row.item_count, total)}
            for row in rows
        ],
    })


@reports_bp.route("/reports/returns-breakdown", methods=["GET"])
@report
def returns_breakdown(start, end):
    """Units per period, for every product model / customer pair. Periods are
    months for ranges of 30 days or more, ISO weeks otherwise."""
    group_unit = "month" if (end - start).days >= 30 else "week"
    period = func.to_char(ReturnCase.arrival_date, "YYYY-MM" if group_unit == "month" else "IYYY-IW")

    rows = (
        with_customer(with_product_model(items_in_range(
            start, end,
            period.label("period"), ProductModel.name.label("product_model"),
            Customers.name.label("customer_name"), UNITS.label("return_count"),
        )))
        .group_by("period", "product_model", "customer_name")
        .order_by("period")
        .all()
    )

    customers = {row.customer_name for row in rows}
    product_models = {row.product_model for row in rows}
    all_keys = {f"{model}|{customer}" for model in product_models for customer in customers}
    periods = {}
    for row in rows:
        entry = periods.setdefault(row.period, {"period": row.period, **{key: 0 for key in all_keys}})
        entry[f"{row.product_model}|{row.customer_name}"] = row.return_count

    return jsonify({
        "group_unit": group_unit,
        "data": list(periods.values()),
        "customers": list(customers),
        "productModels": list(product_models),
    })


@reports_bp.route("/reports/defects-by-production-month", methods=["GET"])
@report
def defects_by_production_month(start, end):
    """Units per production month, for the months inside the selected range."""
    if (end - start).days < 30:
        return jsonify({"error": "Date range must be at least one month", "data": []}), 400

    months = []
    month = start.replace(day=1)
    while month <= end:
        months.append(month.strftime("%Y-%m"))
        month += relativedelta(months=1)

    production_month = func.substring(ReturnCaseItem.production_date, 1, 7)
    query = production_filters(with_product_model(items_in_range(
        start, end, production_month.label("production_month"), UNITS.label("defect_count"),
    )).filter(ReturnCaseItem.production_date.isnot(None)))
    counts = {row.production_month: row.defect_count for row in query.group_by(production_month).all()}

    return jsonify({"data": [{"month": m, "defect_count": counts.get(m, 0)} for m in months]})


@reports_bp.route("/reports/fault-responsibility-stats", methods=["GET"])
@report
def fault_responsibility_stats(start, end):
    return distribution(start, end, ReturnCaseItem.fault_responsibility,
                        FaultResponsibilityEnum, "fault_responsibility")


@reports_bp.route("/reports/resolution-method-stats", methods=["GET"])
@report
def resolution_method_stats(start, end):
    return distribution(start, end, ReturnCaseItem.resolution_method,
                        ResolutionMethodEnum, "resolution_method")


@reports_bp.route("/reports/product-type-stats", methods=["GET"])
@report
def product_type_stats(start, end):
    rows = (
        with_product_model(items_in_range(start, end, ProductModel.product_type, UNITS.label("item_count")))
        .group_by(ProductModel.product_type)
        .all()
    )
    counts = {row.product_type: row.item_count for row in rows}
    total = sum(counts.values())
    return jsonify({
        "total_items": total,
        "data": [
            {"product_type": member.value,
             "item_count": counts.get(member, 0),
             "percentage": pct(counts[member], total) if member in counts else 0}
            for member in ProductTypeEnum
        ],
    })


@reports_bp.route("/reports/top-defects", methods=["GET"])
@report
def top_defects(start, end):
    """The five most common fault types. Percentages are of all fault
    occurrences, which can exceed the unit total when an item has several."""
    product_type = product_type_arg()
    service_id = int_arg("service_id")

    def faults(*columns):
        query = with_performed_services(items_in_range(start, end, *columns)).join(
            ServiceDefinition, ServiceDefinition.id == ReturnCaseItemService.service_definition_id)
        if product_type:
            query = query.filter(ServiceDefinition.product_type == product_type)
        return query

    units_query = items_in_range(start, end, UNITS)
    if product_type:
        units_query = with_product_model(units_query).filter(ProductModel.product_type == product_type)
    total = total_units(units_query)
    total_occurrences = total_units(faults(UNITS))

    query = faults(ServiceDefinition.service_name, ServiceDefinition.product_type,
                   UNITS.label("occurrence_count"))
    if service_id is not None:
        query = query.filter(ServiceDefinition.id == service_id)
    rows = (
        query.group_by(ServiceDefinition.service_name, ServiceDefinition.product_type)
        .order_by(UNITS.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_items": total,
        "total_service_occurrences": total_occurrences,
        "data": [
            {"service_name": row.service_name, "product_type": row.product_type.value,
             "occurrence_count": row.occurrence_count,
             "percentage": pct(row.occurrence_count, total_occurrences)}
            for row in rows
        ],
    })


@reports_bp.route("/reports/production-date-distribution", methods=["GET"])
@report
def production_date_distribution(start, end):
    """Units per production month, product type and model."""
    rows = (
        production_filters(with_product_model(items_in_range(
            start, end,
            ReturnCaseItem.production_date.label("production_month"), ProductModel.product_type,
            ProductModel.name.label("product_model"), UNITS.label("item_count"),
        )).filter(ReturnCaseItem.production_date.isnot(None)))
        .group_by(ReturnCaseItem.production_date, ProductModel.product_type, ProductModel.name)
        .order_by(ReturnCaseItem.production_date)
        .all()
    )
    total = sum(row.item_count for row in rows)
    return jsonify({
        "total_items": total,
        "data": [
            {"production_month": row.production_month, "product_type": row.product_type.value,
             "product_model": row.product_model, "item_count": row.item_count,
             "percentage": pct(row.item_count, total)}
            for row in rows
        ],
    })
