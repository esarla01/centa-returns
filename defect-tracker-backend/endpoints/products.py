from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from permissions import permission_required

# Import your db instance and models
from models import AppPermissions, db, ProductModel, ProductTypeEnum

product_bp = Blueprint("product", __name__, url_prefix="/products")

@product_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """
    Retrieve a paginated and searchable list of product models.
    Supports filtering by product_type.
    """
    print("Fetching products with filters")
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    search_term = request.args.get('search', '', type=str)
    product_type_filter = request.args.get('type', '', type=str)

    query = ProductModel.query

    if search_term:
        query = query.filter(ProductModel.name.ilike(f'%{search_term}%'))
    
    if product_type_filter:
        # Validate that the filter value is a valid enum key
        if product_type_filter in ProductTypeEnum._member_map_:
            query = query.filter(ProductModel.product_type == ProductTypeEnum[product_type_filter])

    query = query.order_by(ProductModel.name.asc())
    
    paginated_products = query.paginate(page=page, per_page=limit, error_out=False)
    
    products_list = [
        {
            'id': p.id,
            'name': p.name,
            'product_type': p.product_type.value # Send the user-friendly value
        }
        for p in paginated_products.items
    ]

    return jsonify({
        "products": products_list,
        "totalPages": paginated_products.pages,
        "currentPage": paginated_products.page
    }), 200

@product_bp.route('/', methods=['POST'])
@permission_required(AppPermissions.PAGE_VIEW_PRODUCT_LIST)
def create_product():
    """ Create a new product model. """
    data = request.get_json()
    name = data.get('name', '').strip()
    product_type_key = data.get('product_type')

    if not name:
        return jsonify({"msg": "Ürün adı gereklidir."}), 400
    if not product_type_key or product_type_key not in ProductTypeEnum._member_map_:
        return jsonify({"msg": "Geçerli bir ürün tipi gereklidir."}), 400
    
    if ProductModel.query.filter_by(name=name).first():
        return jsonify({"msg": "Bu isimle bir ürün modeli zaten mevcut."}), 409

    new_product = ProductModel(
        name=name,
        product_type=ProductTypeEnum[product_type_key]
    )
    db.session.add(new_product)
    db.session.commit()

    return jsonify({ "msg": "Ürün modeli başarıyla oluşturuldu" }), 201

@product_bp.route('/<int:product_id>', methods=['PUT'])
@permission_required(AppPermissions.PAGE_VIEW_PRODUCT_LIST)
def update_product(product_id):
    """ Update an existing product model. """
    product = ProductModel.query.get_or_404(product_id)
    data = request.get_json()
    
    name = data.get('name', '').strip()
    product_type_key = data.get('product_type')

    if not name:
        return jsonify({"msg": "Ürün adı gereklidir."}), 400
    if not product_type_key or product_type_key not in ProductTypeEnum._member_map_:
        return jsonify({"msg": "Geçerli bir ürün tipi gereklidir."}), 400
        
    # Check if another product with the new name already exists
    existing_product = ProductModel.query.filter(ProductModel.name == name, ProductModel.id != product_id).first()
    if existing_product:
        return jsonify({"msg": "Bu isimle başka bir ürün modeli zaten mevcut."}), 409

    product.name = name
    product.product_type = ProductTypeEnum[product_type_key]
    
    db.session.commit()
    return jsonify({ "msg": "Ürün modeli başarıyla güncellendi" }), 200

@product_bp.route('/<int:product_id>', methods=['DELETE'])
@permission_required(AppPermissions.PAGE_VIEW_PRODUCT_LIST)
def delete_product(product_id):
    """ Delete a product model. """
    product = ProductModel.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"msg": "Ürün modeli başarıyla silindi."}), 200