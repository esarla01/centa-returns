from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from models import AppPermissions, Permission, Role, RolePermission, User, UserRole, db
from permissions import permission_required
import re
from sqlalchemy import or_

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")

# Endpoints to be moved here: retrieve-users, register, deregister 

@admin_bp.route('/', methods=['POST'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def register():
    data = request.get_json()

    if not data:
        return jsonify({"msg": "No data provided"}), 400

    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    role = data.get('role')

    # Validate required fields
    if not email or not password or not first_name or not last_name or not role:
        return jsonify({"msg": "All fields are required"}), 400

    # Validate email format
    if not EMAIL_REGEX.match(email):
        return jsonify({"msg": "Invalid email format"}), 400

    # Validate role
    try:
        role_enum = UserRole(role)
    except ValueError:
        return jsonify({"msg": "Invalid role"}), 400

    # Look up the Role object
    role_obj = Role.query.filter_by(name=role_enum).first()
    if not role_obj:
        return jsonify({"msg": "Role not found in database"}), 400

    # Validate password strength
    if not PASSWORD_REGEX.match(password):
        return jsonify({"msg": "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character"}), 400

    # Check if the user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "A user with that email already exists"}), 400

    try:
        # Create a new user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role_id=role_obj.id
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return jsonify({"msg": "User registered successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An error occurred while registering the user", "error": str(e)}), 500

@admin_bp.route('/', methods=['DELETE'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def deregister():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    target_email = data.get('email')  

    if not target_email:
        return jsonify({"msg": "Email of the user to deregister is required"}), 400
    
    # Prevent deletion of a specific user
    if target_email == "erinsarlak003@gmail.com":
        return jsonify({"msg": "This user cannot be deregistered"}), 403
    
    # Query user by email
    user_to_delete = User.query.filter_by(email=target_email).first()

    if not user_to_delete:
        return jsonify({"msg": f'User with email {target_email} not found'}), 404
    
    try:
        db.session.delete(user_to_delete)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An error occurred while deregistering the user", "error": str(e)}), 500

    return jsonify({"msg": f'User {user_to_delete.first_name} {user_to_delete.last_name} deregistered successfully'}), 200

@admin_bp.route('/', methods=['GET'])
# @permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def retrieve_users():
    """
    Retrieve a paginated, searchable, and filterable list of users
    using Flask-SQLAlchemy's paginate() function.
    """

    # Get the page, limit, search, and role filter from the request
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 5, type=int)
    search = request.args.get('search', '', type=str).strip()
    role_filter = request.args.get('role', '', type=str) # e.g., "ADMIN", "MANAGER"
    
    print(f"Role filter received: '{role_filter}'")
    print(f"Available UserRole members: {list(UserRole._member_map_.keys())}")

    # Get the users and their roles
    query = db.session.query(User).join(Role)

    # If there is a search term, filter the users by first name, last name, and email
    if search:
        query = query.filter(
            or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    # If there is a role filter, filter the users by role
    if role_filter and role_filter.upper() in UserRole._member_map_:
        print(f"Filtering by role: {role_filter.upper()}")
        query = query.filter(Role.name == UserRole[role_filter.upper()])
    else:
        print(f"Role filter not applied. role_filter: '{role_filter}', upper: '{role_filter.upper() if role_filter else ''}', in map: {role_filter.upper() in UserRole._member_map_ if role_filter else False}")
    
    # Paginate the users
    paginated_users = query.order_by(Role.name).paginate(
        page=page, 
        per_page=limit, 
        error_out=False
    )

    # Serialize the users
    def serialize_user(user):
       return {
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.name.value,
        "createdAt": (
            user.created_at.strftime("%d %B %Y")
            .replace("January", "Ocak")
            .replace("February", "Şubat")
            .replace("March", "Mart")
            .replace("April", "Nisan")
            .replace("May", "Mayıs")
            .replace("June", "Haziran")
            .replace("July", "Temmuz")
            .replace("August", "Ağustos")
            .replace("September", "Eylül")
            .replace("October", "Ekim")
            .replace("November", "Kasım")
            .replace("December", "Aralık")
        ),
        "lastLogin": (
            user.last_login.strftime("%d %B %Y")
            .replace("January", "Ocak")
            .replace("February", "Şubat")
            .replace("March", "Mart")
            .replace("April", "Nisan")
            .replace("May", "Mayıs")
            .replace("June", "Haziran")
            .replace("July", "Temmuz")
            .replace("August", "Ağustos")
            .replace("September", "Eylül")
            .replace("October", "Ekim")
            .replace("November", "Kasım")
            .replace("December", "Aralık")
            if user.last_login else None
        ),
       }

    # Return the serialized users
    return jsonify({
        "users": [serialize_user(u) for u in paginated_users.items],
        "totalPages": paginated_users.pages,
        "currentPage": paginated_users.page,
        "totalUsers": paginated_users.total
    }) 