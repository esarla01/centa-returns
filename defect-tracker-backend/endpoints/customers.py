
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required 
from sqlalchemy import or_

from models import db, Customers


URL_BASE = 'http://localhost:5000'

customer_bp = Blueprint("customer", __name__, url_prefix="/customers")

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def is_valid_email(email_string):
    """Checks if a string is a valid email format."""
    if not email_string: return False
    return EMAIL_REGEX.fullmatch(email_string) is not None

def is_valid_phone_number(phone_string):
    """Checks if a string is a valid phone number."""
    if not phone_string: return False
    digits_only = re.sub(r'\D', '', phone_string)
    return 7 <= len(digits_only) <= 15

@customer_bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    """
    Create a new customer.
    Expects a JSON payload with customer details.
    """
    data = request.get_json()

    # Basic validation: ensure 'name' is provided
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({"msg": "Company name is required."}), 400

    name = data.get('name').strip()
    contact_info = data.get('contact_info', '').strip()
    representative = data.get('representative', '').strip()
    address = data.get('address', '').strip()

    if not name or (not contact_info and not representative): 
        return jsonify({"msg": "Company name is required, and either contact information or representative is required."}), 400
    
    if contact_info:
        # Check if contact_info is a valid email OR a valid phone number
        if not (is_valid_email(contact_info) or is_valid_phone_number(contact_info)):
            return jsonify({"msg": "Contact info must be a valid email or phone number."}), 400

    # Check if a customer with the same name already exists
    if Customers.query.filter_by(name=data['name'].strip()).first():
        return jsonify({"msg": "A customer with this name already exists."}), 409 # 409 Conflict

    # Create a new Customer instance
    new_customer = Customers(
        name=name,
        representative=representative,
        contact_info=contact_info,
        address=address,
    )

    try:
        db.session.add(new_customer)
        db.session.commit()
        # Return the newly created customer's data
        return jsonify({
            "msg": "Customer created successfully",
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to create customer.", "error": str(e)}), 500


@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """
    Delete a customer by their ID.
    The ID is passed in the URL.
    """

    # Find the customer by their primary key
    customer = Customers.query.get(customer_id)

    # If customer doesn't exist, return a 404 Not Found error
    if not customer:
        return jsonify({"msg": "Customer not found."}), 404

    try:
        db.session.delete(customer)
        db.session.commit()
        return jsonify({"msg": "Customer deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to delete customer.", "error": str(e)}), 500

@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """
    Update an existing customer's details.
    The customer's name cannot be changed.
    """
    # Find the customer to update
    customer = Customers.query.get(customer_id)
    if not customer:
        return jsonify({"msg": "Customer not found."}), 404

    data = request.get_json()
    
    contact_info = data.get('contact_info', '').strip()
    
    # Validate contact_info if it's being provided
    if not contact_info:
        return jsonify({"msg": "Contact info (email or phone number) cannot be empty."}), 400

    if not (is_valid_email(contact_info) or is_valid_phone_number(contact_info)):
        return jsonify({"msg": "Contact info must be a valid email or phone number."}), 400

    customer.representative = data.get('representative', '').strip()
    customer.contact_info = contact_info
    customer.address = data.get('address', '').strip()
    
    try:
        db.session.commit()
        return jsonify({ "msg": "Customer updated successfully." }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to update customer.", "error": str(e)}), 500
    
@customer_bp.route('/',methods=['GET'])
@jwt_required()
def get_customers():
    """
    Retrieve a paginated and searchable list of customers.
    Accepts 'page', 'limit', and 'search' query parameters.
    """
    # Get pagination and search parameters from the request args
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 5, type=int)
    search_term = request.args.get('search', '', type=str)

    # Start with a base query
    query = Customers.query

    # If a search term is provided, filter the results
    # This searches the 'name' and 'representative' fields
    if search_term:
        query = query.filter(
            or_(
                Customers.name.ilike(f'%{search_term}%'),
                Customers.representative.ilike(f'%{search_term}%')
            )
        )

    # Order by creation date, newest first
    query = query.order_by(Customers.created_at.desc())
    
    # Execute the paginated query
    paginated_customers = query.paginate(page=page, per_page=limit, error_out=False)
    
    # Format the customers into a list of dictionaries
    customers_list = [
        {
            'id': customer.id,
            'name': customer.name,
            'representative': customer.representative,
            'contact_info': customer.contact_info,
            'address': customer.address,
            'created_at': customer.created_at.isoformat() # Convert datetime to string
        }
        for customer in paginated_customers.items
    ]

    # Return the data in the format the frontend expects
    return jsonify({
        "customers": customers_list,
        "totalPages": paginated_customers.pages,
        "currentPage": paginated_customers.page
    }), 200

