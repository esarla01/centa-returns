from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db
from models import ReturnCase, ReturnCaseItem, Customers, ProductModel
from datetime import datetime
from dateutil.relativedelta import relativedelta
import calendar

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/reports/items-by-customer", methods=["GET"])
def items_by_customer():
    # Parse date range
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Aggregate counts
    query = (
        db.session.query(
            Customers.name.label("customer_name"),
            func.sum(ReturnCaseItem.product_count).label("item_count")
        )
        .join(ReturnCase, ReturnCase.customer_id == Customers.id)
        .join(ReturnCaseItem, ReturnCaseItem.return_case_id == ReturnCase.id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .group_by(Customers.name)
        .all()
    )

    total_items = sum(row.item_count for row in query)
    results = [
        {
            "customer_name": row.customer_name,
            "item_count": row.item_count,
            "percentage": round((row.item_count / total_items) * 100, 2) if total_items > 0 else 0
        }
        for row in query
    ]

    return jsonify({"total_items": total_items, "data": results})


@reports_bp.route("/reports/items-by-product-model", methods=["GET"])
def items_by_product_model():
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    query = (
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

    total_items = sum(row.item_count for row in query)
    results = [
        {
            "product_model_name": row.product_model_name,
            "item_count": row.item_count,
            "percentage": round((row.item_count / total_items) * 100, 2) if total_items > 0 else 0
        }
        for row in query
    ]

    return jsonify({"total_items": total_items, "data": results})

@reports_bp.route("/reports/returns-breakdown", methods=["GET"])
def returns_breakdown():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    
    print(f"Received start_date: {start_date_str}, end_date: {end_date_str}")
    
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except (TypeError, ValueError) as e:
        print(f"Date parsing error: {e}")
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Decide grouping: month or week
    delta_days = (end_date - start_date).days
    group_unit = "month" if delta_days >= 30 else "week"

    # Query - using PostgreSQL date grouping functions
    if group_unit == "month":
        results = (
            db.session.query(
                func.to_char(ReturnCase.arrival_date, "YYYY-MM").label("period"),
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
    else:  # week
        results = (
            db.session.query(
                func.to_char(ReturnCase.arrival_date, "IYYY-IW").label("period"),
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

    # Transform for frontend
    data = []
    customers = set()
    product_models = set()
    
    # First pass: collect all unique customers and product models
    for row in results:
        customers.add(row.customer_name)
        product_models.add(row.product_model)
    
    # Second pass: create data structure
    period_data = {}
    for row in results:
        period_str = row.period  # Already a string from strftime
        if period_str not in period_data:
            period_data[period_str] = {"period": period_str}
        
        # Create combined key for each product_model|customer combination
        for model in product_models:
            for customer in customers:
                key = f"{model}|{customer}"
                if key not in period_data[period_str]:
                    period_data[period_str][key] = 0
        
        # Set the actual value
        key = f"{row.product_model}|{row.customer_name}"
        period_data[period_str][key] = row.return_count
    
    data = list(period_data.values())

    print(data)

    return jsonify({
        "group_unit": group_unit,
        "data": data,
        "customers": list(customers),
        "productModels": list(product_models)
    })

@reports_bp.route("/reports/defects-by-production-month", methods=["GET"])
def defects_by_production_month():
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Check if date range is less than one month
    delta_days = (end_date - start_date).days
    if delta_days < 30:
        return jsonify({
            "error": "Date range must be at least one month",
            "data": []
        }), 400
    
    months_in_range = []
    current_date = start_date.replace(day=1)  # Start from first day of start month
    
    while current_date <= end_date:
        month_key = current_date.strftime("%Y-%m")
        months_in_range.append(month_key)
        current_date += relativedelta(months=1)

    # Query defects grouped by production month
    query = (
        db.session.query(
            func.substring(ReturnCaseItem.production_date, 1, 7).label("production_month"),
            func.sum(ReturnCaseItem.product_count).label("defect_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .filter(ReturnCaseItem.production_date.isnot(None))
        .group_by(func.substring(ReturnCaseItem.production_date, 1, 7))
        .all()
    )

    # Create a dictionary of actual defect counts
    defect_counts = {row.production_month: row.defect_count for row in query}

    # Build results with all months in range, including zero counts
    results = [
        {
            "month": month,
            "defect_count": defect_counts.get(month, 0)
        }
        for month in months_in_range
    ]

    return jsonify({"data": results})

@reports_bp.route("/reports/fault-responsibility-stats", methods=["GET"])
def fault_responsibility_stats():
    """Get statistics of return items by fault responsibility within the given timeframe"""
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Query fault responsibility statistics
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

    # Calculate total items - get all items in the date range, not just those with fault_responsibility
    total_query = (
        db.session.query(
            func.sum(ReturnCaseItem.product_count).label("total_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .scalar()
    )
    total_items = total_query or 0

    # Create results with all fault responsibility types, including zero counts
    from models import FaultResponsibilityEnum
    
    # Initialize all fault responsibility types with zero count
    fault_stats = {
        fault_type.value: {
            "fault_responsibility": fault_type.value,
            "item_count": 0,
            "percentage": 0
        }
        for fault_type in FaultResponsibilityEnum
    }

    # Update with actual data
    for row in query:
        if row.fault_responsibility:
            fault_stats[row.fault_responsibility.value] = {
                "fault_responsibility": row.fault_responsibility.value,
                "item_count": row.item_count,
                "percentage": round((row.item_count / total_items) * 100, 2) if total_items > 0 else 0
            }

    results = list(fault_stats.values())

    return jsonify({
        "total_items": total_items,
        "data": results
    })

@reports_bp.route("/reports/service-type-stats", methods=["GET"])
def service_type_stats():
    """Get statistics of return items by service type within the given timeframe"""
    try:
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')
        
        if not start_date_str or not end_date_str:
            return jsonify({"error": "startDate and endDate are required"}), 400
        
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        # Since we removed service_type, return empty stats
        return jsonify({
            "service_stats": {},
            "total_items": 0
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch service type statistics: {str(e)}"}), 500

@reports_bp.route("/reports/resolution-method-stats", methods=["GET"])
def resolution_method_stats():
    """Get statistics of return items by resolution method within the given timeframe"""
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Query resolution method statistics
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

    # Calculate total items - get all items in the date range, not just those with resolution_method
    total_query = (
        db.session.query(
            func.sum(ReturnCaseItem.product_count).label("total_count")
        )
        .join(ReturnCase, ReturnCase.id == ReturnCaseItem.return_case_id)
        .filter(ReturnCase.arrival_date >= start_date)
        .filter(ReturnCase.arrival_date <= end_date)
        .scalar()
        )
    total_items = total_query or 0

    # Create results with all resolution methods, including zero counts
    from models import ResolutionMethodEnum
    
    resolution_stats = {
        resolution_type.value: {
            "resolution_method": resolution_type.value,
            "item_count": 0,
            "percentage": 0
        }
        for resolution_type in ResolutionMethodEnum
    }

    # Update with actual data
    for row in query:
        if row.resolution_method:
            resolution_stats[row.resolution_method.value] = {
                "resolution_method": row.resolution_method.value,
                "item_count": row.item_count,
                "percentage": round((row.item_count / total_items) * 100, 2) if total_items > 0 else 0
            }

    results = list(resolution_stats.values())

    return jsonify({
        "total_items": total_items,
        "data": results
    })

@reports_bp.route("/reports/product-type-stats", methods=["GET"])
def product_type_stats():
    """Get statistics of return items by product type within the given timeframe"""
    try:
        start_date = datetime.strptime(request.args.get("start_date"), "%Y-%m-%d")
        end_date = datetime.strptime(request.args.get("end_date"), "%Y-%m-%d")
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Query product type statistics
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

    # Calculate total items
    total_items = sum(row.item_count for row in query)

    # Create results with all product types, including zero counts
    from models import ProductTypeEnum
    
    product_stats = {
        product_type.value: {
            "product_type": product_type.value,
            "item_count": 0,
            "percentage": 0
        }
        for product_type in ProductTypeEnum
    }

    # Update with actual data
    for row in query:
        if row.product_type:
            product_stats[row.product_type.value] = {
                "product_type": row.product_type.value,
                "item_count": row.item_count,
                "percentage": round((row.item_count / total_items) * 100, 2) if total_items > 0 else 0
            }

    results = list(product_stats.values())

    return jsonify({
        "total_items": total_items,
        "data": results
    })
