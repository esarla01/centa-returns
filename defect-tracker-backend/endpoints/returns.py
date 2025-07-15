from flask import Blueprint, request, jsonify
from models import db, ReturnCase, ReturnCaseItem, ProductTypeEnum, ReceiptMethodEnum, CaseStatusEnum
from datetime import datetime
from sqlalchemy.orm import joinedload


return_case_bp = Blueprint('returns', __name__, url_prefix='/returns')

@return_case_bp.route('/', methods=['POST'])
def create_return_case():
    data = request.get_json()

    try:
        case = ReturnCase(
            customer_id=data['customerId'],
            arrival_date=datetime.strptime(data['arrivalDate'], '%Y-%m-%d'),
            receipt_method=ReceiptMethodEnum[data['receiptMethod']],
            status=CaseStatusEnum.open,
        )
        db.session.add(case)
        db.session.flush()  # to get case.id

        # handle each product item
        for item in data.get('items', []):
            count = item.get('productCount', 1)
            main_item = ReturnCaseItem(
                return_case_id=case.id,
                product_type = ProductTypeEnum[item['productType']],
                product_count=count,
                serial_number=item.get('serialNumber'), 
                is_main_product=True,
            )
            db.session.add(main_item)
            db.session.flush()  # so we can attach sub-items

            # Add attached control unit if flagged
            if item.get('attachControlUnit') and item['productType'] in ['overload', 'door_detector']:
                attached_unit = ReturnCaseItem(
                    return_case_id=case.id,
                    product_type=ProductTypeEnum.control_unit,
                    product_count=count,
                    is_main_product=False,
                    attached_to_item_id=main_item.id
                )
                db.session.add(attached_unit)

        db.session.commit()
        return jsonify({"message": "Return case created", "caseId": case.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@return_case_bp.route('/clear', methods=['DELETE'])
def clear_return_cases():
    try:
        # Delete all records from ReturnCaseItem
        db.session.query(ReturnCaseItem).delete()

        # Delete all records from ReturnCase
        db.session.query(ReturnCase).delete()

        # Commit the changes
        db.session.commit()

        return jsonify({"message": "All return cases and items have been cleared."}), 200

    except Exception as e:
        # Rollback in case of an error
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@return_case_bp.route('/', methods=['GET'])
def get_return_cases():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        query = ReturnCase.query.options(
            joinedload(ReturnCase.customer),
            joinedload(ReturnCase.assigned_user),
            joinedload(ReturnCase.items).joinedload(ReturnCaseItem.product_model)
        ).order_by(ReturnCase.arrival_date.desc())

        total_cases = query.count()
        cases = query.offset(offset).limit(limit).all()

        def serialize_item(item):
            return {
                "id": item.id,
                "attached_to_item_id": item.attached_to_item_id,
                "is_main_product": item.is_main_product,
                "product_type": item.product_type.value,
                "product_name": item.product_model.name if item.product_model else item.product_type.value,
                "product_count": item.product_count,
            }

        data = [{
            "id": c.id,
            "status": c.status.value,
            "customer_name": c.customer.name,
            "arrival_date": c.arrival_date.isoformat(),
            "assigned_user": f"{c.assigned_user.first_name} {c.assigned_user.last_name}" if c.assigned_user else "—",
            "items": [serialize_item(i) for i in c.items]
        } for c in cases]

        return jsonify({
            "cases": data,
            "totalPages": (total_cases + limit - 1) // limit
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@return_case_bp.route('/<int:return_case_id>', methods=['DELETE'])
def delete_return_case(return_case_id):
    return_case = ReturnCase.query.get(return_case_id)
    if not return_case:
        return jsonify({'msg': 'Vaka bulunamadı.'}), 404

    try:
        db.session.delete(return_case)
        db.session.commit()
        return jsonify({'msg': f'Vaka {return_case_id} başarıyla silindi.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Silme işlemi sırasında bir hata oluştu.', 'error': str(e)}), 500