import datetime
from math import ceil
from types import NoneType
from sqlalchemy import or_
import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, get_jwt_identity, jwt_required, get_jwt
from flask_mail import Message
from models import AppPermissions, Permission, Role, RolePermission, User, UserRole, db, mail
import re
from permissions import permission_required

URL_BASE = 'http://localhost:5000'

user_bp = Blueprint("user", __name__, url_prefix="/auth")

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")

# Removed: register, deregister, retrieve-users endpoints (now in admin.py)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Veri sağlanmadı"}), 400
    
    # Get email and password from the request body
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "E-posta ve şifre gereklidir"}), 400
    
    # Query user by email and check if the password is correct
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "E-posta veya şifre yanlış! Lütfen tekrar deneyin."}), 400

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
        return jsonify({"msg": "Giriş sırasında bir hata oluştu", "error": str(e)}), 500

@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"msg": "E-posta gereklidir"}), 400
    
    user = User.query.filter_by(email=email).first()

    # Do not reveal if the user exists for security reasons
    if not user:
        return jsonify(msg="Bu e-posta adresi mevcutsa, sıfırlama bağlantısı gönderildi."), 200
    
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
        return jsonify({"msg": "E-posta gönderilirken bir hata oluştu."}, {"error": str(e)}), 500

    return jsonify(msg="Bu e-posta adresi mevcutsa, sıfırlama bağlantısı gönderildi."), 200
    
@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    # Validate input
    if not token or not new_password:
        return jsonify(msg="Token ve yeni şifre gereklidir"), 400

    # Validate password strength
    if not PASSWORD_REGEX.match(new_password):
        return jsonify(msg="Şifre en az 8 karakter uzunluğunda olmalı, bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."), 400

    # Find user by reset token
    user = User.query.filter_by(reset_token=token).first()

    if not user:
        return jsonify(msg="Geçersiz token"), 400

    # Check if the token has expired
    if user.reset_token_expiry < datetime.datetime.utcnow():
        return jsonify(msg="Token süresi dolmuş"), 400

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
        return jsonify(msg="Şifre başarıyla sıfırlandı, ancak onay e-postası gönderilemedi."), 200

    return jsonify(msg="Şifre başarıyla sıfırlandı"), 200


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
        return jsonify({"msg": "Kullanıcı bulunamadı"}), 404
    
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

@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout endpoint that clears the JWT cookie, updates the database, and returns a success message.
    """
    try:
        # Get the current user's identity from the JWT
        identity = get_jwt_identity()
        
        # Find the user in the database
        user = User.query.filter_by(email=identity).first()
        
        if user:
            # Update the last_logout field to track logout time
            user.last_logout = datetime.datetime.utcnow()
            db.session.commit()
        
        # Create response with success message
        response = jsonify({"msg": "Çıkış başarılı"})
        
        # Clear the JWT cookies
        unset_jwt_cookies(response)
        
        return response, 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Çıkış sırasında bir hata oluştu", "error": str(e)}), 500