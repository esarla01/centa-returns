import datetime
from math import ceil
from types import NoneType
from sqlalchemy import or_
import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies ,get_jwt_identity, jwt_required, get_jwt
from flask_mail import Message
from models import AppPermissions, Permission, Role, RolePermission, User, UserRole, db, mail
import re
from permissions import permission_required

URL_BASE = 'http://localhost:5000'

user_bp = Blueprint("user", __name__, url_prefix="/auth")

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")

@user_bp.route('/register', methods=['POST'])
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

@user_bp.route('/deregister', methods=['DELETE'])
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

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    # Get email and password from the request body
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400
    
    # Query user by email and check if the password is correct
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "The password or email is incorrect! Please try again."}), 400

    try:
        # Update last login time
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=user.email, additional_claims={
            "name": user.first_name,
            "surname": user.last_name,
            "role": user.role.name.value
        })

        # Set the token in the cookie
        response = jsonify({"msg": "Login successful"})
        set_access_cookies(response, access_token)
        return response

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An error occurred during login", "error": str(e)}), 500

@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"msg": "Email is required"}), 400
    
    user = User.query.filter_by(email=email).first()

    # Do not reveal if the user exists for security reasons
    if not user:
        return jsonify(msg="If this email exists, a reset link has been sent."), 200
    
    # Generate a secure token and set expiry
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    db.session.commit()

    reset_url = f" http://localhost:3000/reset-password?token={token}"

    # Prepare the email message
    msg = Message(
        subject="Şifrenizi Sıfırlayın",
        recipients=[user.email],
        body=f"""Merhaba {user.first_name},

    Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki 
    bağlantıya tıklayarak yeni bir şifre seçebilirsiniz: 
    {reset_url} 

    Bu talebi siz yapmadıysanız, bu mesajı dikkate almayın. 
    Bu bağlantı 15 dakika boyunca geçerlidir.

    – Centa
    """
    )

    try:
        mail.send(msg)
    except Exception as e:
        # Log the error and return a generic message
        print(f"Error sending email: {e}")
        return jsonify({"msg": "An error occurred while sending the email."}), 500

    return jsonify(msg="If this email exists, a reset link has been sent."), 200
    
@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    # Validate input
    if not token or not new_password:
        return jsonify(msg="Token and new password are required"), 400

    # Validate password strength
    if not PASSWORD_REGEX.match(new_password):
        return jsonify(msg="Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."), 400

    # Find user by reset token
    user = User.query.filter_by(reset_token=token).first()

    if not user:
        return jsonify(msg="Invalid token"), 400

    # Check if the token has expired
    if user.reset_token_expiry < datetime.datetime.utcnow():
        return jsonify(msg="Expired token"), 400

    # Update user's password and clear the reset token
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    # Send confirmation email
    msg = Message(
        subject="Şifrenizi Sıfırlayın",
        recipients=[user.email],
        body=f"""Merhaba {user.first_name},

    Şifrenizi başarıyla sıfırladınız. Artık yeni şifrenizle 
    giriş yapabilirsiniz. Eğer bu talebi siz yapmadıysanız, 
    kimsenin bilmediğinden emin olduğunuz yeni bir şifre seçin 
    ve lütfen şifrenizi tekrar sıfırlayın.
    """
    )
    try:
        mail.send(msg)
    except Exception as e:
        # Log the error and return a generic message
        print(f"Error sending email: {e}")
        return jsonify(msg="Password reset successfully, but failed to send confirmation email."), 200

    return jsonify(msg="Password reset successfully"), 200


@user_bp.route('/whoami', methods=['GET'])
@jwt_required()
def whoami():
    """
    This endpoint returns the user's identity and claims extracted from the JWT.
    The token is expected to be sent via HttpOnly cookie (automatically included 
    by the browser).
    """
    identity = get_jwt_identity() # typically the user's email
    claims = get_jwt()            # custom fields added with `additional_claims`

    # Get user from database
    user = User.query.filter_by(email=identity).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Get permission ids from database
    role_id = user.role_id
    permission_ids = [
        pid for (pid,) in
        RolePermission.query
            .filter_by(role_id=role_id)
            .with_entities(RolePermission.permission_id)
            .all()
    ]
    permissions = (
        Permission.query
        .filter(Permission.id.in_(permission_ids))
        .all()
    )

    # Get permission names from database
    permission_names = [perm.name.name for perm in permissions] 

    # Return response
    response =  {
        "email": identity,
        "firstName": claims.get("name"),
        "lastName": claims.get("surname"),
        "role": claims.get("role"),
        "permissions": permission_names
    }
    
    return jsonify(response), 200



@user_bp.route('/retrieve-users', methods=['GET'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
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