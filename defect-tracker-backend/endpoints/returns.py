from flask import Blueprint, request, jsonify
from models import Role, User, UserRole, db, ReturnCase, ReturnCaseItem, ProductTypeEnum, ReceiptMethodEnum, CaseStatusEnum, Customers, ProductModel
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
            workflow_status=CaseStatusEnum.TECHNICAL_REVIEW,
        )
        db.session.add(case)
        db.session.flush()  # to get case.id

        # handle each product item
        for item in data.get('items', []):
            count = item.get('productCount', 1)
            main_item = ReturnCaseItem(
                return_case_id=case.id,
                product_model_id=item.get('productModelId'),
                product_count=count,
                serial_number=item.get('serialNumber'), 
                is_main_product=True,
            )
            db.session.add(main_item)
            db.session.flush()  # so we can attach sub-items

            # Add attached control unit if flagged
            if item.get('attachControlUnit') and item.get('productModelId'):
                attached_unit = ReturnCaseItem(
                    return_case_id=case.id,
                    product_model_id=item.get('controlUnitModelId'),
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
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        # Get filter parameters
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        start_date = request.args.get('startDate', '').strip()
        end_date = request.args.get('endDate', '').strip()
        user_id = request.args.get('userId', '').strip()
        receipt_method = request.args.get('receiptMethod', '').strip()
        product_type = request.args.get('productType', '').strip()

        # Start with base query
        query = ReturnCase.query.options(
            joinedload(ReturnCase.customer),
            joinedload(ReturnCase.assigned_user),
            joinedload(ReturnCase.items).joinedload(ReturnCaseItem.product_model)
        )

        # Apply search filter (customer name only)
        if search:
            search_term = f"%{search}%"
            try:
                query = query.join(ReturnCase.customer).filter(
                    db.func.lower(Customers.name).ilike(search_term.lower())
                )
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        # Apply status filter
        if status:
            if status == 'not_closed':
                query = query.filter(ReturnCase.workflow_status != CaseStatusEnum.COMPLETED)
            else:
                try:
                    status_enum = CaseStatusEnum[status]
                    query = query.filter(ReturnCase.workflow_status == status_enum)
                except (KeyError, ValueError):
                    pass  # Invalid status, ignore filter

        # Apply date range filters
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(ReturnCase.arrival_date >= start_date_obj)
            except ValueError:
                pass  # Invalid date format, ignore filter

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(ReturnCase.arrival_date <= end_date_obj)
            except ValueError:
                pass  # Invalid date format, ignore filter

        # Apply user filter
        if user_id:
            query = query.filter(ReturnCase.assigned_user_id == user_id)

        # Apply receipt method filter
        if receipt_method:
            try:
                receipt_enum = ReceiptMethodEnum[receipt_method]
                query = query.filter(ReturnCase.receipt_method == receipt_enum)
            except (KeyError, ValueError):
                pass  # Invalid receipt method, ignore filter

        # Apply product type filter
        if product_type:
            try:
                product_enum = ProductTypeEnum[product_type]
                query = query.join(ReturnCase.items).join(ReturnCaseItem.product_model).filter(
                    ProductModel.product_type == product_enum
                )
            except (KeyError, ValueError):
                pass  # Invalid product type, ignore filter

        # Order by arrival date descending
        query = query.order_by(ReturnCase.arrival_date.desc())

        # Get total count before pagination
        total_cases = query.count()
        
        # Apply pagination
        cases = query.offset(offset).limit(limit).all()

        def serialize_item(item):
            return {
                "id": item.id,
                "product_model": {
                    "id": item.product_model.id if item.product_model else None,
                    "name": item.product_model.name if item.product_model else "Bilinmeyen Ürün",
                    "product_type": item.product_model.product_type.value if item.product_model else None
                },
                "product_count": item.product_count,
                "serial_number": item.serial_number,
                "is_main_product": item.is_main_product,
                "warranty_status": item.warranty_status.value,
                "fault_source": item.fault_source.value,
                "attached_to_item_id": item.attached_to_item_id
            }

        data = [{
            "id": c.id,
            "status": c.workflow_status.value,
            "customer": {
                "id": c.customer.id,
                "name": c.customer.name
            },
            "arrival_date": c.arrival_date.isoformat(),
            "assigned_user": {
                "id": c.assigned_user.email if c.assigned_user else None,
                "firstName": c.assigned_user.first_name if c.assigned_user else None,
                "lastName": c.assigned_user.last_name if c.assigned_user else None
            } if c.assigned_user else None,
            "receipt_method": c.receipt_method.value,
            "notes": c.notes,
            "performed_services": c.performed_services,
            "cost": float(c.cost) if c.cost else None,
            "shipping_info": c.shipping_info,
            "payment_status": c.payment_status.value if c.payment_status else None,
            "items": [serialize_item(i) for i in c.items]
        } for c in cases]

        return jsonify({
            "cases": data,
            "totalPages": (total_cases + limit - 1) // limit
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@return_case_bp.route('/simple', methods=['POST'])
def create_simple_return_case():
    data = request.get_json()
    customer_id = data.get('customerId')
    arrival_date = data.get('arrivalDate')
    receipt_method = data.get('receiptMethod')
    notes = data.get('notes')

    # assigned user id is all the Technicians
    role_id = Role.query.filter_by(name=UserRole.TECHNICIAN).first().id
    technician= User.query.filter_by(role_id=role_id).first()

    if not customer_id or not arrival_date or not receipt_method:
        return jsonify({'error': 'customerId, arrivalDate, and receiptMethod are required.'}), 400

    # Look up customer by id
    customer = Customers.query.get(customer_id)
    if not customer:
        return jsonify({'error': f'Customer with id {customer_id} not found.'}), 404

    try:
        case = ReturnCase(
            customer_id=customer.id,
            arrival_date=datetime.strptime(arrival_date, '%Y-%m-%d'),
            receipt_method=ReceiptMethodEnum[receipt_method],
            notes=notes,
            assigned_user_id=technician.email,
            # workflow_status defaults to TECHNICAL_REVIEW
        )
        db.session.add(case)
        db.session.commit()
        return jsonify({'message': 'Return case created', 'caseId': case.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@return_case_bp.route('/<int:return_case_id>', methods=['PUT'])
def update_return_case(return_case_id):
    return_case = ReturnCase.query.get(return_case_id)
    if not return_case:
        return jsonify({'error': 'Vaka bulunamadı.'}), 404

    data = request.get_json()
    
    try:
        # Update basic fields
        if 'status' in data:
            return_case.workflow_status = CaseStatusEnum[data['status'].replace(' ', '_').upper()]
        
        if 'assignedUserId' in data and data['assignedUserId']:
            from models import User
            user = User.query.filter_by(email=data['assignedUserId']).first()
            if user:
                return_case.assigned_user = user
            else:
                return jsonify({'error': 'Kullanıcı bulunamadı.'}), 400
        elif 'assignedUserId' in data and not data['assignedUserId']:
            return_case.assigned_user = None
        
        if 'notes' in data:
            return_case.notes = data['notes']
        
        if 'performedServices' in data:
            return_case.performed_services = data['performedServices']
        
        if 'cost' in data:
            return_case.cost = data['cost'] if data['cost'] else None
        
        if 'shippingInfo' in data:
            return_case.shipping_info = data['shippingInfo']
        
        if 'paymentStatus' in data:
            if data['paymentStatus']:
                return_case.payment_status = ReceiptMethodEnum[data['paymentStatus'].upper()]
            else:
                return_case.payment_status = None
        
        if 'arrivalDate' in data:
            return_case.arrival_date = datetime.strptime(data['arrivalDate'], '%Y-%m-%d')
        
        if 'receiptMethod' in data:
            return_case.receipt_method = ReceiptMethodEnum[data['receiptMethod'].upper()]
        
        db.session.commit()
        return jsonify({'message': 'Vaka başarıyla güncellendi.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


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