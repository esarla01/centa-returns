import logging
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required
from permissions import permission_required
from services.log_service import LogService
from models import ActionType

# Import your db instance and models
from models import AppPermissions, db, ServiceDefinition, ProductTypeEnum, ReturnCaseItemService

service_bp = Blueprint("service", __name__, url_prefix="/services")

@service_bp.route('', methods=['GET'])
@jwt_required()
def get_services():
    """
    Retrieve a paginated and searchable list of service definitions.
    Supports filtering by product_type.
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search_term = request.args.get('search', '', type=str)
        product_type_filter = request.args.get('type', '', type=str)

        query = ServiceDefinition.query

        if search_term:
            query = query.filter(ServiceDefinition.service_name.ilike(f'%{search_term}%'))
        
        if product_type_filter:
            # Validate that the filter value is a valid enum key
            if product_type_filter in ProductTypeEnum._member_map_:
                query = query.filter(ServiceDefinition.product_type == ProductTypeEnum[product_type_filter])

        query = query.order_by(ServiceDefinition.service_name.asc())
        
        paginated_services = query.paginate(page=page, per_page=limit, error_out=False)
        
        services_list = [
            {
                'id': s.id,
                'service_name': s.service_name,
                'product_type': s.product_type.value # Send the user-friendly value
            }
            for s in paginated_services.items
        ]

        return jsonify({
            "services": services_list,
            "totalPages": paginated_services.pages,
            "currentPage": paginated_services.page
        }), 200
    except Exception as e:
        db.session.rollback()  # Rollback on any error
        return jsonify({'error': str(e)}), 500

@service_bp.route('', methods=['POST'])
@service_bp.route('/', methods=['POST'])
@permission_required(AppPermissions.PAGE_VIEW_PRODUCT_LIST)
def create_service():
    """ Create a new service definition. """
    data = request.get_json()
    service_name = data.get('service_name', '').strip()
    product_type_key = data.get('product_type')

    if not service_name:
        return jsonify({"msg": "Arıza tipi adı gereklidir."}), 400
    if not product_type_key or product_type_key not in ProductTypeEnum._member_map_:
        return jsonify({"msg": "Geçerli bir ürün tipi gereklidir."}), 400
    
    if ServiceDefinition.query.filter_by(service_name=service_name, product_type=ProductTypeEnum[product_type_key]).first():
        return jsonify({"msg": "Bu isimle ve tipte bir arıza tipi zaten mevcut."}), 409

    new_service = ServiceDefinition(
        service_name=service_name,
        product_type=ProductTypeEnum[product_type_key]
    )
    db.session.add(new_service)
    db.session.commit()

    try:
        email = g.user.email
        LogService.log_service_creation(
            user_email=email,
            service_id=new_service.id,
        )
        print(f"Service creation logged for {new_service.id}")
    except Exception as e:
        logging.error(f"Error logging action for service {new_service.id}: {e}")

    return jsonify({ "msg": "Servis başarıyla oluşturuldu" }), 201

@service_bp.route('/<int:service_id>', methods=['DELETE'])
@permission_required(AppPermissions.PAGE_VIEW_PRODUCT_LIST)
def delete_service(service_id):
    """ Delete a service definition. """
    service = ServiceDefinition.query.get_or_404(service_id)
    
    try:
        # Check if the service is being used by any return case items
        service_usage = ReturnCaseItemService.query.filter_by(service_definition_id=service_id).first()
        if service_usage:
            return jsonify({"msg": "Bu servis kullanımda olduğu için silinemez."}), 400
        
        db.session.delete(service)
        db.session.commit()
        
        return jsonify({"msg": "Servis başarıyla silindi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Servis silinemedi.", "error": str(e)}), 500
