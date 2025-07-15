from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime

from models import (
    db,
    ReturnCase, 
    ReturnCaseItem, 
    CaseStatusEnum,
    ReceiptMethodEnum,
    FaultSourceEnum,
)

return_case_bp = Blueprint("return_case_api", __name__, url_prefix="/api/return-cases")


# Helper function to serialize a case object to a JSON-friendly dictionary
def serialize_case(case):
    """Serializes a ReturnCase object into a detailed dictionary for API responses."""
    return {
        "id": case.id,
        "status": case.status.value,
        "arrival_date": case.arrival_date.isoformat(),
        "receipt_method": case.receipt_method.value,
        "fault_source": case.fault_source.value,
        "warranty_status": case.warranty_status.value,
        "cost": float(case.cost) if case.cost is not None else None,
        "payment_status": case.payment_status,
        "shipping_info": case.shipping_info,
        "notes": case.notes,
        "customer": {
            "id": case.customer.id,
            "name": case.customer.name
        },
        "assigned_user": {
            "id": case.assigned_user.id,
            "firstName": case.assigned_user.firstName,
            "lastName": case.assigned_user.lastName
        } if case.assigned_user else None,
        "items": [
            {
                "id": item.id,
                "product_model": {
                    "id": item.product_model.id,
                    "name": item.product_model.name
                },
                "product_count": item.product_count,
                "serial_number": item.serial_number,
                "is_main_product": item.is_main_product
            } for item in sorted(case.items, key=lambda x: x.is_main_product, reverse=True)
        ]
    }

@return_case_bp.route('', methods=['POST'])
@jwt_required()
def create_return_case():
    """
    Creates a new return case and its associated items.
    Expects a nested JSON payload from the AddReturnCaseModal.
    """
    data = request.get_json()

    

    # if not data or not data.get('customer_id') or not data.get('arrival_date'):
    #     return jsonify({"msg": "Customer and arrival date are required."}), 400

    # items_data = data.get('items', [])
    # if not items_data:
    #     return jsonify({"msg": "At least one product item is required."}), 400

    # try:
    #     # 1. Create the main ReturnCase object
    #     new_case = ReturnCase(
    #         customer_id=data['customer_id'],
    #         arrival_date=datetime.strptime(data['arrival_date'], '%Y-%m-%d').date(),
    #         receipt_method=ReceiptMethodEnum[data.get('receiptMethod', 'shipment')],
    #         fault_source=FaultSourceEnum[data.get('faultSource', 'unknown')],
    #         assigned_user_id=data.get('assigned_user_id') or None,
    #         notes=data.get('notes', '')
    #         # Other fields like warranty, cost can be set here if provided
    #     )
    #     db.session.add(new_case)
    #     # Flush to get the ID for the new case, which is needed for the items
    #     db.session.flush()

    #     # 2. Create the ReturnCaseItem objects and link them
    #     # NOTE: This simplified version does not link accessories to main items via `attached_to_item_id`.
    #     # The `is_main_product` flag provides the primary grouping.
    #     for item_data in items_data:
    #         item = ReturnCaseItem(
    #             return_case_id=new_case.id,
    #             product_model_id=item_data['product_model_id'],
    #             product_count=item_data.get('product_count', 1),
    #             serial_number=item_data.get('serial_number'),
    #             is_main_product=item_data.get('is_main_product', True)
    #         )
    #         db.session.add(item)

    #     # 3. Commit the entire transaction
    #     db.session.commit()

    #     return jsonify({
    #         "msg": "Return case created successfully.",
    #         "case": serialize_case(new_case)
    #     }), 201

    # except Exception as e:
    #     db.session.rollback()
    #     # Provide a more specific error in development if possible
    #     print(f"Error creating case: {e}") 
    #     return jsonify({"msg": "An internal error occurred while creating the case."}), 500


# --- READ a single, detailed Return Case (for the Edit modal) ---
@return_case_bp.route('/<int:case_id>', methods=['GET'])
@jwt_required()
def get_single_return_case(case_id):
    """
    Retrieves the full details for a single return case.
    """
    case = ReturnCase.query.get_or_404(case_id)
    return jsonify(serialize_case(case)), 200


# --- UPDATE an existing Return Case ---
@return_case_bp.route('/<int:case_id>', methods=['PUT'])
@jwt_required()
def update_return_case(case_id):
    """
    Updates a return case. This uses a "delete-then-insert" strategy for items
    to simplify logic and ensure consistency.
    """
    case = ReturnCase.query.get_or_404(case_id)
    data = request.get_json()

    try:
        # 1. Update the main case fields
        case.status = CaseStatusEnum[data.get('status', case.status.name)]
        case.assigned_user_id = data.get('assigned_user_id') or None
        case.notes = data.get('notes', case.notes)
        case.fault_source = FaultSourceEnum[data.get('faultSource', case.fault_source.name)]
        # ... update other fields as needed ...

        # 2. Delete all existing items associated with this case
        ReturnCaseItem.query.filter_by(return_case_id=case_id).delete()

        # 3. Re-create items from the payload (same logic as POST)
        items_data = data.get('items', [])
        for item_data in items_data:
            item = ReturnCaseItem(
                return_case_id=case.id,
                product_model_id=item_data['product_model_id'],
                product_count=item_data.get('product_count', 1),
                serial_number=item_data.get('serial_number'),
                is_main_product=item_data.get('is_main_product', True)
            )
            db.session.add(item)
        
        # 4. Commit transaction
        db.session.commit()

        return jsonify({
            "msg": "Return case updated successfully.",
            "case": serialize_case(case)
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating case: {e}")
        return jsonify({"msg": "An internal error occurred while updating the case."}), 500


# --- DELETE a Return Case ---
@return_case_bp.route('/<int:case_id>', methods=['DELETE'])
@jwt_required()
def delete_return_case(case_id):
    """
    Deletes a return case. The 'cascade' option on the model
    will automatically delete its associated items.
    """
    case = ReturnCase.query.get_or_404(case_id)
    
    try:
        db.session.delete(case)
        db.session.commit()
        return jsonify({"msg": f"Return case #{case_id} has been deleted."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting case: {e}")
        return jsonify({"msg": "An internal error occurred while deleting the case."}), 500